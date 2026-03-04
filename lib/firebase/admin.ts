import "server-only";
import { getApps, getApp, initializeApp, cert, type App } from "firebase-admin/app";
import type { ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function initAdmin(): App {
  if (getApps().length) return getApp() as App;

  const storageBucketEnv = process.env.FIREBASE_STORAGE_BUCKET || undefined;

  // Opción A (recomendada): JSON en base64 (acepta snake_case del JSON de Firebase)
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    const json = Buffer.from(b64, "base64").toString("utf8");
    const svc = JSON.parse(json) as Record<string, string>;
    const account: ServiceAccount = {
      projectId: svc.project_id ?? svc.projectId,
      clientEmail: svc.client_email ?? svc.clientEmail,
      privateKey: (svc.private_key ?? svc.privateKey)?.replace(/\\n/g, "\n"),
    };
    const storageBucket = storageBucketEnv ?? svc.storage_bucket ?? svc.storageBucket;
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

/** Bucket por defecto. Usa FIREBASE_STORAGE_BUCKET o el del app si se inicializó con storageBucket (ej. desde base64). */
export function getAdminBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  const storage = getAdminStorage();
  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}
