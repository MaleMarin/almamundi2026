import "server-only";
import { after, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isValidRecipientEmail } from "@/lib/email-html";
import { getAdminDb } from "@/lib/firebase/admin";
import { stripHtml } from "@/lib/api/input-validation";
import { LEGAL_TEXTS_VERSION } from "@/lib/legal-consent";
import { clientIpFromRequest, enforceRateLimit, getRateLimiter } from "@/lib/rate-limit";
import { verifyTurnstileStrict } from "@/lib/security/turnstile-strict";
import { parseAlmaLocale } from "@/lib/i18n/locale";
import {
  ME_PREGUNTAS_COLLECTION,
  ME_PREGUNTA_CONTACTS_COLLECTION,
  ME_PREGUNTA_MAX,
} from "@/lib/me-pregunto/shared";
import { consultaMePreguntasAprobadas, listaMePreguntasPublicas } from "@/lib/me-pregunto/server";
import { writeCoordsIfMissing } from "@/lib/respuestas/geocode";
import { sendMePreguntaEmail } from "@/lib/email/me-pregunto-mail";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function cleanLine(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return stripHtml(value).replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

/** GET /api/me-pregunto — preguntas aprobadas, sin correo. */
export async function GET(req: Request) {
  const ip = clientIpFromRequest(req);
  const blocked = await enforceRateLimit(getRateLimiter("me-pregunto-get", 120, 60), `me-pregunto-get:${ip}`, {
    max: 120,
    windowMs: 60_000,
  });
  if (blocked) return blocked;
  try {
    const snap = await consultaMePreguntasAprobadas(getAdminDb()).get();
    const items = listaMePreguntasPublicas(snap.docs);
    // Las preguntas publicadas antes de tener punto se ubican de a poco, sin demorar la respuesta.
    const sinPunto = snap.docs
      .filter((doc) => typeof doc.get("lat") !== "number" || typeof doc.get("lng") !== "number")
      .slice(0, 5);
    if (sinPunto.length) {
      after(async () => {
        for (const doc of sinPunto) {
          await writeCoordsIfMissing(doc.ref, String(doc.get("city") ?? ""), String(doc.get("country") ?? "")).catch(() => undefined);
        }
      });
    }
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (e) {
    console.error("[me-pregunto GET]", e instanceof Error ? e.message : "list");
    return jsonError("list_failed", 500);
  }
}

/** POST /api/me-pregunto — guarda una pregunta pendiente de revisión y el contacto privado. */
export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const blocked = await enforceRateLimit(getRateLimiter("me-pregunto-post", 5, 3600), `me-pregunto-post:${ip}`, {
    max: 5,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("invalid_request", 400);
  }

  const captcha = await verifyTurnstileStrict(typeof body.captchaToken === "string" ? body.captchaToken : null, ip);
  if (!captcha.ok) return jsonError("captcha_required", 400);

  const texto = cleanLine(body.texto, ME_PREGUNTA_MAX + 20);
  const alias = cleanLine(body.alias, 80);
  const city = cleanLine(body.city, 120);
  const country = cleanLine(body.country, 120);
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  if (texto.length < 8) return jsonError("question_required", 400);
  if (texto.length > ME_PREGUNTA_MAX) return jsonError("question_too_long", 400);
  if (alias.length < 2) return jsonError("alias_required", 400);
  if (city.length < 1) return jsonError("city_required", 400);
  if (country.length < 2) return jsonError("country_required", 400);
  if (email && !isValidRecipientEmail(email)) return jsonError("email_required", 400);
  if (body.consentAdult !== true || body.consentPrivacyPolicy !== true || body.consentTerminos !== true || body.consentPublicacion !== true) {
    return jsonError("consent_required", 400);
  }
  const locale = parseAlmaLocale(typeof body.locale === "string" ? body.locale : undefined);

  try {
    const db = getAdminDb();
    const ref = db.collection(ME_PREGUNTAS_COLLECTION).doc();
    const batch = db.batch();
    batch.set(ref, {
      texto,
      alias,
      city,
      country,
      locale,
      status: "pending",
      consentAdult: true,
      consentPrivacyPolicy: true,
      consentPublicacion: true,
      consentTerminos: true,
      consentTextsVersion: LEGAL_TEXTS_VERSION,
      consentedAt: Date.now(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (email) {
      batch.set(db.collection(ME_PREGUNTA_CONTACTS_COLLECTION).doc(ref.id), {
        email,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    if (email) {
      after(async () => {
        try {
          const mailed = await sendMePreguntaEmail({ tipo: "recibida", to: email, alias, pregunta: texto, locale });
          await ref.update({ receivedMail: { status: mailed.ok ? "sent" : "failed", at: new Date().toISOString() } });
        } catch (err) {
          console.error("[me-pregunto POST] correo", err instanceof Error ? err.message : "mail");
        }
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[me-pregunto POST]", e instanceof Error ? e.message : "save");
    return jsonError("send_failed", 500);
  }
}
