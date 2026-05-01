import { NextRequest, NextResponse } from "next/server";
import { clientIpFromRequest, enforceRateLimit, getRateLimiter } from "@/lib/rate-limit";
import { escapeHtml, isValidRecipientEmail } from "@/lib/email-html";

export const runtime = "nodejs";

const REQUEST_TYPES = [
  "confirmar_tratamiento",
  "acceder",
  "corregir",
  "eliminar",
  "anonimizar_bloquear",
  "retirar_consentimiento",
  "informacion_uso",
  "limitar_fines",
  "otro",
] as const;

type RequestType = (typeof REQUEST_TYPES)[number];

function isRequestType(v: unknown): v is RequestType {
  return typeof v === "string" && (REQUEST_TYPES as readonly string[]).includes(v);
}

function inboxTo(): string {
  const raw = process.env.PRIVACY_DATA_REQUEST_TO?.trim() || "hola@almamundi.org";
  return isValidRecipientEmail(raw) ? raw.toLowerCase() : "hola@almamundi.org";
}

export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter("privacy-data-request", 12, 3600);
  const blocked = await enforceRateLimit(rl, `privacy-data:${ip}`, {
    max: 8,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  if (!process.env.RESEND_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "El envío electrónico no está configurado. Escribinos a hola@almamundi.org con el mismo contenido." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const requestType = body.requestType;
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const country = typeof body.country === "string" ? body.country.trim() : "";
  const ownData = body.ownData === "yes" || body.ownData === "no" ? body.ownData : "";

  if (!isRequestType(requestType)) {
    return NextResponse.json({ error: "Tipo de solicitud no válido." }, { status: 400 });
  }
  if (description.length < 10 || description.length > 12000) {
    return NextResponse.json({ error: "La descripción debe tener entre 10 y 12.000 caracteres." }, { status: 400 });
  }
  if (fullName.length < 2 || fullName.length > 200) {
    return NextResponse.json({ error: "Indica un nombre completo válido." }, { status: 400 });
  }
  if (!isValidRecipientEmail(email)) {
    return NextResponse.json({ error: "Correo electrónico no válido." }, { status: 400 });
  }
  if (phone.length > 120) {
    return NextResponse.json({ error: "Teléfono demasiado largo." }, { status: 400 });
  }
  if (country.length > 120) {
    return NextResponse.json({ error: "País: texto demasiado largo." }, { status: 400 });
  }
  if (ownData !== "yes" && ownData !== "no") {
    return NextResponse.json({ error: "Indica si la solicitud es sobre tus propios datos." }, { status: 400 });
  }

  const labelMap: Record<RequestType, string> = {
    confirmar_tratamiento: "Confirmar si tratamos datos personales tuyos.",
    acceder: "Acceder a los datos personales que tenemos sobre ti.",
    corregir: "Corregir datos incompletos, incorrectos o desactualizados.",
    eliminar: "Solicitar la eliminación de tus datos personales.",
    anonimizar_bloquear: "Solicitar la anonimización o bloqueo de datos que ya no sean necesarios.",
    retirar_consentimiento: "Retirar tu consentimiento para el uso de tus datos.",
    informacion_uso: "Solicitar información sobre cómo usamos o compartimos tus datos.",
    limitar_fines: "Solicitar que dejemos de usar tus datos para ciertos fines.",
    otro: "Otro tipo de solicitud.",
  };

  const plainLines = [
    "Solicitud sobre datos personales — AlmaMundi",
    "",
    `Tipo: ${labelMap[requestType]}`,
    `Código interno: ${requestType}`,
    "",
    "Descripción:",
    description,
    "",
    "Identificación:",
    `Nombre: ${fullName}`,
    `Correo: ${email}`,
    phone ? `Teléfono / contacto alternativo: ${phone}` : "Teléfono / contacto alternativo: (no indicado)",
    country ? `País: ${country}` : "País: (no indicado)",
    `Solicitud sobre datos propios: ${ownData === "yes" ? "Sí" : "No"}`,
    "",
    `IP aproximada (cabecera): ${ip.slice(0, 80)}`,
    `Fecha (servidor): ${new Date().toISOString()}`,
  ];

  const textBody = plainLines.join("\n");

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL ?? "AlmaMundi <hola@almamundi.org>";
    const to = inboxTo();
    const subjName = fullName.replace(/[\r\n]+/g, " ").slice(0, 60);
    const subject = `[AlmaMundi] Datos personales — ${subjName}`.slice(0, 180);

    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject,
      text: textBody.slice(0, 50000),
      html: `<pre style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(
        textBody.slice(0, 50000),
      )}</pre>`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[privacy-data-request]", e);
    return NextResponse.json({ error: "No pudimos enviar la solicitud. Intentá de nuevo más tarde." }, { status: 500 });
  }
}
