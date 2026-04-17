import { NextResponse } from "next/server";
import {
  MAX_DESCRIPCION,
  MAX_TITULO,
  stripHtml,
} from "@/lib/api/input-validation";
import { THEME_IDS } from "@/lib/themes";
import { getAdminDb } from "@/lib/firebase/admin";
import { randomUUID } from "crypto";
import { bufferMatchesDeclaredMime } from "@/lib/file-sniff";
import { savePrivateSubmissionObject } from "@/lib/server-storage";
import {
  clientIpFromRequest,
  enforceRateLimit,
  getRateLimiter,
} from "@/lib/rate-limit";
import { verifyTurnstileIfConfigured } from "@/lib/turnstile";
import { AGE_RANGE_OPTIONS } from "@/lib/subir-author-fields";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const AGE_SET = new Set<string>(AGE_RANGE_OPTIONS.map((o) => o.id));

const SEX_OK = new Set([
  "femenino",
  "masculino",
  "no-binario",
  "prefiero-no-decir",
]);

const THEME_SET = new Set<string>(THEME_IDS);

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const rl = getRateLimiter("submissions-photo", 20, 3600);
  const blocked = await enforceRateLimit(rl, `photo:${ip}`, {
    max: 20,
    windowMs: 3600_000,
  });
  if (blocked) return blocked;

  try {
    const form = await req.formData();

    const turnstile = form.get("cf-turnstile-response");
    const captcha = await verifyTurnstileIfConfigured(
      typeof turnstile === "string" ? turnstile : null,
      ip
    );
    if (!captcha.ok) {
      return NextResponse.json({ error: "captcha_required" }, { status: 400 });
    }

    const alias = stripHtml(String(form.get("alias") || "")).slice(0, 120).trim();
    const email = String(form.get("email") || "").trim().slice(0, 254);
    const pais = stripHtml(String(form.get("pais") || "")).slice(0, 120).trim();
    const context = stripHtml(String(form.get("context") || ""))
      .slice(0, MAX_DESCRIPCION)
      .trim();
    const birthDate = stripHtml(String(form.get("birthDate") || ""))
      .slice(0, 80)
      .trim();
    const sexRaw = String(form.get("sex") || "").trim();
    const ageRangeRaw = String(form.get("ageRange") || "").trim();
    const privacyRaw = String(form.get("consentPrivacyPolicy") || "").trim();
    const topic = stripHtml(String(form.get("topic") || ""))
      .slice(0, MAX_TITULO)
      .trim();

    const file = form.get("file");

    if (!alias) return NextResponse.json({ error: "alias_required" }, { status: 400 });
    if (!topic || !THEME_SET.has(topic)) {
      return NextResponse.json({ error: "topic_required" }, { status: 400 });
    }
    if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });
    if (pais.length < 2) {
      return NextResponse.json({ error: "pais_required" }, { status: 400 });
    }
    if (!ageRangeRaw || !AGE_SET.has(ageRangeRaw)) {
      return NextResponse.json({ error: "age_range_required" }, { status: 400 });
    }
    if (privacyRaw !== "1" && privacyRaw !== "true" && privacyRaw !== "on") {
      return NextResponse.json({ error: "privacy_required" }, { status: 400 });
    }

    let sex: string | undefined;
    if (sexRaw) {
      if (!SEX_OK.has(sexRaw)) {
        return NextResponse.json({ error: "invalid_sex" }, { status: 400 });
      }
      sex = sexRaw;
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }

    const mime = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (!bufferMatchesDeclaredMime(buf, mime)) {
      return NextResponse.json({ error: "content_type_mismatch" }, { status: 400 });
    }

    const submissionId = randomUUID();
    const ext = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
    const { storagePath, signedReadUrl } = await savePrivateSubmissionObject({
      buffer: buf,
      originalName: `${submissionId}${ext}`,
      contentType: mime,
    });

    const db = getAdminDb();
    await db.collection("submissions").doc(submissionId).set({
      type: "photo",
      alias,
      email,
      countryLabel: pais,
      ageRange: ageRangeRaw,
      consentPrivacyPolicy: true,
      ...(birthDate ? { birthDate } : {}),
      ...(sex ? { sex } : {}),
      ...(context ? { context } : {}),
      topic,
      storagePath,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, submissionId, readUrl: signedReadUrl, storagePath });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
