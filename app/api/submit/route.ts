import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Ruta antigua. Ningún formulario de esta rama la llama.
 * Los envíos nuevos entran por POST /api/submissions.
 */
export function POST() {
  return NextResponse.json(
    { error: "Esta vía de envío ya no está disponible." },
    { status: 410 }
  );
}
