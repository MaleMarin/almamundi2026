/**
 * Inicialización de Firebase Admin para scripts (sin server-only).
 * No importar desde la app; solo para npm run seed:stories etc.
 */
import { getApps, getApp, initializeApp, cert } from "firebase-admin/app";
import type { ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (getApps().length) return getApp();

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    const json = Buffer.from(b64, "base64").toString("utf8");
    const svc = JSON.parse(json) as Record<string, string>;
    const account: ServiceAccount = {
      projectId: svc.project_id ?? svc.projectId,
      clientEmail: svc.client_email ?? svc.clientEmail,
      privateKey: (svc.private_key ?? svc.privateKey)?.replace(/\\n/g, "\n"),
    };
    return initializeApp({ credential: cert(account) });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : "";

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  throw new Error(
    "Firebase Admin: set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (or FIREBASE_ADMIN_*) in .env"
  );
}

export function getAdminDb() {
  return getFirestore(initAdmin());
}
