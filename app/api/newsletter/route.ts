import { NextRequest, NextResponse } from "next/server";
import { parseAlmaLocale } from "@/lib/i18n/locale";
import { clientIpFromRequest, enforceRateLimit, getRateLimiter } from "@/lib/rate-limit";
import { requestNewsletterConfirmation } from "@/lib/newsletter/service";
import { verifyTurnstileStrict } from "@/lib/security/turnstile-strict";

export const runtime = "nodejs";

/** POST /api/newsletter — doble confirmación. No revela si el correo ya existe. */
export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter("newsletter-post", 5, 3600);
  const blocked = await enforceRateLimit(rl, `newsletter:${ip}`, {
    max: 5,
    windowMs: 3_600_000,
  });
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "email" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "email" }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;
  const captcha = await verifyTurnstileStrict(
    typeof raw.captchaToken === "string" ? raw.captchaToken : "",
    ip
  );
  if (!captcha.ok) return NextResponse.json({ error: "verify" }, { status: 400 });

  const origin = raw.origin === "franja" || raw.origin === "contar" ? raw.origin : null;
  if (!origin) return NextResponse.json({ error: "email" }, { status: 400 });

  const result = await requestNewsletterConfirmation({
    email: typeof raw.email === "string" ? raw.email : "",
    locale: parseAlmaLocale(typeof raw.locale === "string" ? raw.locale : undefined),
    origin,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === "send" ? 502 : 400 });
  }
  return NextResponse.json({ ok: true });
}
