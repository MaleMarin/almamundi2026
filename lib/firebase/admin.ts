import "server-only";
import { getApps, getApp, initializeApp, cert, type App } from "firebase-admin/app";
import type { ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/** FIREBASE_STORAGE_BUCKET o, si falta, el público (mismo bucket del cliente). */
function resolveStorageBucketName(): string | undefined {
  const raw = (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    ""
  ).trim();
  if (!raw) return undefined;
  return raw.replace(/^gs:\/\//, "");
}

function initAdmin(): App {
  if (getApps().length) return getApp() as App;

  const storageBucketEnv = resolveStorageBucketName();

  // Opción A: JSON completo del service account en Base64 (recomendado en Vercel), o JSON en claro si empieza por "{".
  const secretRaw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (secretRaw) {
    let svc: Record<string, unknown>;
    try {
      if (secretRaw.startsWith("{")) {
        svc = JSON.parse(secretRaw) as Record<string, unknown>;
      } else {
        const compactB64 = secretRaw.replace(/\s/g, "");
        const jsonUtf8 = Buffer.from(compactB64, "base64").toString("utf8").replace(/^\uFEFF/, "");
        svc = JSON.parse(jsonUtf8) as Record<string, unknown>;
      }
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_BASE64: valor ilegible. Debe ser (1) Base64 de una sola línea del JSON de service account, o (2) el JSON completo. Regenerar: base64 -i clave.json | tr -d '\\n'",
      );
    }
    const r = svc as Record<string, string | undefined>;
    const account: ServiceAccount = {
      projectId: (r.project_id ?? r.projectId) as string,
      clientEmail: (r.client_email ?? r.clientEmail) as string,
      privateKey: String(r.private_key ?? r.privateKey ?? "").replace(/\\n/g, "\n"),
    };
    const storageBucket = storageBucketEnv ?? r.storage_bucket ?? r.storageBucket;
    return initializeApp({
      credential: cert(account),
      ...(storageBucket && { storageBucket }),
    });
  }

  // Opción B: FIREBASE_* (nombres del BLOQUE 1)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : "";

  if (privateKey && !privateKey.includes("END PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY parece truncado o mal formado. Debe ser una sola línea con \\n para saltos de línea, desde -----BEGIN hasta -----END PRIVATE KEY-----."
    );
  }

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      ...(storageBucketEnv && { storageBucket: storageBucketEnv }),
    });
  }

  throw new Error(
    "Firebase Admin: set FIREBASE_SERVICE_ACCOUNT_BASE64 or (FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) or (FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY)"
  );
}

/** Auth de Firebase Admin (verificar idToken de cliente). */
export function getAdminAuth() {
  return getAuth(initAdmin());
}

let _adminDb: ReturnType<typeof getFirestore> | null = null;

export function getAdminDb(): ReturnType<typeof getFirestore> {
  if (!_adminDb) _adminDb = getFirestore(initAdmin());
  return _adminDb;
}

/** Alias para compatibilidad con scripts y nuevo código. */
export function adminDb(): ReturnType<typeof getFirestore> {
  return getAdminDb();
}

/** Storage de Firebase Admin (para subir ecos, etc.). */
export function getAdminStorage() {
  return getStorage(initAdmin());
}

/** Bucket por defecto. Usa FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET o el del app. */
export function getAdminBucket() {
  const bucketName = resolveStorageBucketName();
  const storage = getAdminStorage();
  if (bucketName) return storage.bucket(bucketName);
  const fallback = storage.bucket();
  if (!fallback.name) {
    throw new Error(
      "Firebase Storage: falta FIREBASE_STORAGE_BUCKET o NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    );
  }
  return fallback;
}
