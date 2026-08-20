import "server-only";
import { NextResponse } from "next/server";

/** Vercel Cron envía Authorization: Bearer $CRON_SECRET si esa variable existe. */
export function unauthorizedCronResponse(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    if (process.env.VERCEL === "1") {
      console.error("[cron] Falta CRON_SECRET en variables de entorno.");
      return NextResponse.json({ error: "cron_not_configured" }, { status: 401 });
    }
    return null;
  }
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
