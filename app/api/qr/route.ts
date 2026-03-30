/**
 * GET /api/qr?url=... — PNG de código QR (compartido ético).
 * Solo codifica URLs del propio sitio (hosts desde env + localhost); rate limit por IP.
 */
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

function allowedQrHosts(): Set<string> {
  const hosts = new Set<string>();
  const addFromEnv = (raw: string | undefined) => {
    const t = raw?.trim();
    if (!t) return;
    try {
      const u = new URL(t.includes("://") ? t : `https://${t}`);
      if (u.hostname) hosts.add(u.hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  };
  addFromEnv(process.env.NEXT_PUBLIC_APP_URL);
  addFromEnv(process.env.PUBLIC_SITE_URL);
  addFromEnv(process.env.VERCEL_URL);
  hosts.add("localhost");
  hosts.add("127.0.0.1");
  if (hosts.size <= 2) {
    hosts.add("almamundi.org");
    hosts.add("www.almamundi.org");
  }
  return hosts;
}

function isAlmamundiSubdomain(host: string): boolean {
  const h = host.toLowerCase();
  return h === "almamundi.org" || h.endsWith(".almamundi.org");
}

/** https obligatorio salvo http en localhost (desarrollo). */
function isAllowedQrTargetUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  const host = u.hostname.toLowerCase();
  if (u.protocol === "http:") {
    return host === "localhost" || host === "127.0.0.1";
  }
  if (u.protocol !== "https:") return false;
  const allowed = allowedQrHosts();
  if (allowed.has(host) || isAlmamundiSubdomain(host)) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter("qr-png", 120, 3600);
  const blocked = await enforceRateLimit(rl, `qr:${ip}`, {
    max: 120,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  const url = req.nextUrl.searchParams.get("url");
  if (!url || url.length > 2048) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  if (!isAllowedQrTargetUrl(url)) {
    return NextResponse.json({ error: "url_not_allowed" }, { status: 400 });
  }
  try {
    const buffer = await QRCode.toBuffer(url, {
      type: "png",
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "qr_failed" }, { status: 500 });
  }
}
