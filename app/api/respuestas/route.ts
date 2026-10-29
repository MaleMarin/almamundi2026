import "server-only";
import { after, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isValidRecipientEmail } from "@/lib/email-html";
import {
  sendRespuestaReceivedEmail,
} from "@/lib/email/respuesta-mail";
import { getAdminBucket, getAdminDb } from "@/lib/firebase/admin";
import { stripHtml } from "@/lib/api/input-validation";
import { LEGAL_TEXTS_VERSION } from "@/lib/legal-consent";
import { enqueueMalwareScanAfterSave } from "@/lib/malware-scan";
import { isQuestionMode, resolveQuestionId } from "@/lib/pregunta-semana";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";
import {
  RESPUESTA_CAPTION_MAX,
  RESPUESTA_CONTACTS_COLLECTION,
  RESPUESTA_PHOTO_MAX_BYTES,
  RESPUESTA_PRIVATE_PATH,
  RESPUESTA_TEXT_MAX,
  RESPUESTA_VOICE_MAX_BYTES,
  RESPUESTA_VOICE_MAX_SECONDS,
  RESPUESTAS_COLLECTION,
  isRespuestaKind,
} from "@/lib/respuestas/constants";
import { geocodeCityCountry } from "@/lib/respuestas/geocode";
import { verifyTurnstileStrict } from "@/lib/security/turnstile-strict";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function cleanLine(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return stripHtml(value).replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

function coord(value: unknown, maxAbs: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > maxAbs) return null;
  return value;
}

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const VOICE_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
  "video/webm",
  "video/mp4",
  "video/quicktime",
]);

/** POST /api/respuestas — crea la respuesta y el contacto privado. No escribe en stories. */
export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const blocked = await enforceRateLimit(getRateLimiter("respuestas-post", 8, 3600), `respuestas-post:${ip}`, {
    max: 8,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("invalid_request", 400);
  }

  if (!isRespuestaKind(body.kind)) return jsonError("invalid_kind", 400);
  const questionId = resolveQuestionId(body.questionId);
  if (!questionId) return jsonError("invalid_question", 400);
  if (!isQuestionMode(body.mode)) return jsonError("invalid_mode", 400);
  if (body.kind === "texto") {
    const captcha = await verifyTurnstileStrict(
      typeof body.captchaToken === "string" ? body.captchaToken : null,
      ip
    );
    if (!captcha.ok) return jsonError("captcha_required", 400);
  }

  const alias = cleanLine(body.alias, 80);
  const city = cleanLine(body.city, 120);
  const country = cleanLine(body.country, 120);
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  if (alias.length < 2) return jsonError("alias_required", 400);
  if (city.length < 1) return jsonError("city_required", 400);
  if (country.length < 2) return jsonError("country_required", 400);
  if (!isValidRecipientEmail(email)) return jsonError("email_required", 400);
  const versionedConsent = body.consentAdult === true;
  if (
    body.consentPrivacyPolicy !== true ||
    body.consentPublicacion !== true ||
    body.consentTerminos !== true
  ) {
    return jsonError("consent_required", 400);
  }

  const contenidoRaw = typeof body.contenido === "string" ? stripHtml(body.contenido).trim() : "";
  let contenido = "";
  if (body.kind === "texto") {
    if (!contenidoRaw) return jsonError("text_required", 400);
    if (contenidoRaw.length > RESPUESTA_TEXT_MAX) return jsonError("text_too_long", 400);
    contenido = contenidoRaw;
  } else if (body.kind === "foto") {
    if (!contenidoRaw) return jsonError("caption_required", 400);
    if (contenidoRaw.length > RESPUESTA_CAPTION_MAX) return jsonError("caption_too_long", 400);
    contenido = contenidoRaw;
  }

  const storagePath = typeof body.storagePath === "string" ? body.storagePath.trim() : "";
  if (body.kind !== "texto") {
    if (!RESPUESTA_PRIVATE_PATH.test(storagePath)) {
      return jsonError(body.kind === "foto" ? "photo_required" : "audio_required", 400);
    }
  }

  const lat = coord(body.lat, 90);
  const lng = coord(body.lng, 180);
  const needsGeo = lat == null || lng == null;

  try {
    const db = getAdminDb();
    const ref = db.collection(RESPUESTAS_COLLECTION).doc();
    let contentType: string | null = null;

    if (body.kind !== "texto") {
      const file = getAdminBucket().file(storagePath);
      const [exists] = await file.exists();
      if (!exists) return jsonError(body.kind === "foto" ? "photo_required" : "audio_required", 400);
      const [meta] = await file.getMetadata();
      const custom = (meta.metadata ?? {}) as Record<string, string | undefined>;
      if (custom.captchaVerified !== "1") return jsonError("captcha_required", 400);
      if (custom.respuestaKind !== body.kind) {
        return jsonError(body.kind === "foto" ? "photo_type" : "audio_type", 400);
      }
      if (typeof custom.respuestaId === "string" && custom.respuestaId.trim()) {
        return jsonError("file_used", 409);
      }
      const size = Number(meta.size ?? 0);
      const max = body.kind === "foto" ? RESPUESTA_PHOTO_MAX_BYTES : RESPUESTA_VOICE_MAX_BYTES;
      if (!Number.isFinite(size) || size <= 0 || size > max) {
        return jsonError(body.kind === "foto" ? "photo_too_large" : "audio_too_large", 413);
      }
      contentType = typeof meta.contentType === "string" ? meta.contentType : "";
      const typeOk = body.kind === "foto" ? PHOTO_TYPES.has(contentType) : VOICE_TYPES.has(contentType);
      if (!typeOk) return jsonError(body.kind === "foto" ? "photo_type" : "audio_type", 400);
      if (body.kind === "voz" && custom.durationSeconds) {
        const seconds = Number(custom.durationSeconds);
        if (Number.isFinite(seconds) && seconds > RESPUESTA_VOICE_MAX_SECONDS) {
          return jsonError("audio_too_long", 400);
        }
      }
      await file.setMetadata({
        contentType: contentType || undefined,
        cacheControl: "private, max-age=0, no-store",
        metadata: { ...custom, respuestaKind: body.kind, respuestaId: ref.id },
      });
    }

    const batch = db.batch();
    batch.set(ref, {
      questionId,
      mode: body.mode,
      kind: body.kind,
      contenido,
      storagePath: body.kind === "texto" ? null : storagePath,
      publishedPath: null,
      publishedUrl: null,
      contentType,
      alias,
      city,
      country,
      consentPublicacion: true,
      consentTerminos: true,
      consentedAt: Date.now(),
      ...(versionedConsent
        ? {
            consentAdult: true,
            consentPrivacyPolicy: true,
            consentTextsVersion: LEGAL_TEXTS_VERSION,
          }
        : { consentPrivacyPolicy: true }),
      lat,
      lng,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(db.collection(RESPUESTA_CONTACTS_COLLECTION).doc(ref.id), {
      email,
      createdAt: FieldValue.serverTimestamp(),
    });
    try {
      await batch.commit();
    } catch (err) {
      if (body.kind === "voz" || body.kind === "foto") {
        await getAdminBucket()
          .file(storagePath)
          .setMetadata({
            cacheControl: "private, max-age=0, no-store",
            metadata: { respuestaKind: body.kind },
          })
          .catch(() => undefined);
      }
      throw err;
    }

    if (body.kind !== "texto") {
      enqueueMalwareScanAfterSave({
        db,
        collection: "respuestas",
        submissionId: ref.id,
        storagePaths: [storagePath],
      });
    }

    const respuestaId = ref.id;
    after(async () => {
      if (needsGeo) {
        try {
          const geo = await geocodeCityCountry(city, country);
          if (geo) await ref.update({ lat: geo.lat, lng: geo.lng });
          else console.error("[respuestas POST] geocode sin resultado");
        } catch (err) {
          console.error("[respuestas POST] geocode", err instanceof Error ? err.message : "geo");
        }
      }
      try {
        const mailed = await sendRespuestaReceivedEmail({ to: email, alias });
        await ref.update({
          receivedMail: {
            status: mailed.ok ? "sent" : "failed",
            at: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error("[respuestas POST] correo", err instanceof Error ? err.message : "mail");
      }
    });

    return NextResponse.json({ ok: true, id: respuestaId });
  } catch (e) {
    console.error("[respuestas POST]", e instanceof Error ? e.message : "save");
    return jsonError("send_failed", 500);
  }
}
