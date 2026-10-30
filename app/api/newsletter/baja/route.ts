import { NextRequest, NextResponse } from "next/server";
import { unsubscribeNewsletterToken } from "@/lib/newsletter/subscribers";

export const runtime = "nodejs";

function tokenFrom(req: NextRequest): string {
  return new URL(req.url).searchParams.get("t")?.trim() ?? "";
}

/** Un clic del cliente de correo (RFC 8058). Siempre 200, sin revelar si el token existe. */
export async function POST(req: NextRequest) {
  await unsubscribeNewsletterToken(tokenFrom(req));
  return new NextResponse(null, { status: 200 });
}

/** Si el cliente abre la cabecera, la página hace la baja. */
export async function GET(req: NextRequest) {
  const token = tokenFrom(req);
  const dest = new URL("/newsletter/baja", req.nextUrl.origin);
  if (token) dest.searchParams.set("t", token);
  return NextResponse.redirect(dest);
}
