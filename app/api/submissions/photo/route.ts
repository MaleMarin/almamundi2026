import { NextResponse } from "next/server";
import { getAdminDb, getAdminBucket } from "@/lib/firebase/admin";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const alias = String(form.get("alias") || "").trim();
    const email = String(form.get("email") || "").trim();
    const topic = String(form.get("topic") || "").trim();
    const context = String(form.get("context") || "").trim();
    const dateTaken = String(form.get("dateTaken") || "").trim();

    const file = form.get("file");

    if (!alias) return NextResponse.json({ error: "alias_required" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });
    if (!topic) return NextResponse.json({ error: "topic_required" }, { status: 400 });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }

    const submissionId = randomUUID();
    const ext = file.type === "image/png" ? "png" : "jpg";
    const objectPath = `submissions/${submissionId}/original.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let bucket;
    try {
      bucket = getAdminBucket();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: "firebase_config", detail: msg },
        { status: 500 }
      );
    }

    const obj = bucket.file(objectPath);
    await obj.save(buffer, {
      contentType: file.type,
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
    try {
      await obj.makePublic();
    } catch {
      // Objeto subido; makePublic puede fallar por permisos IAM. La URL queda guardada igual.
    }

    const db = getAdminDb();
    await db.collection("submissions").doc(submissionId).set({
      type: "photo",
      alias,
      email,
      topic,
      ...(context && { context }),
      ...(dateTaken && { dateTaken }),
      storagePath: objectPath,
      publicUrl,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, submissionId, publicUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const isCredential = /credential|private|invalid|unauthorized|auth/i.test(message);
    return NextResponse.json(
      {
        error: "server_error",
        detail: message,
        hint: isCredential
          ? "Revisa FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env.local (sin coma al final, con \\n en la clave)."
          : message.includes("bucket") || message.includes("Bucket")
            ? "Revisa FIREBASE_STORAGE_BUCKET en .env.local (ej: almamundi-6d294.appspot.com o .firebasestorage.app)."
            : undefined,
      },
      { status: 500 }
    );
  }
}
