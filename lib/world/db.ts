/**
 * Firestore: colección world_items.
 * Inicialización única (singleton). Reutilizar en api y cron.
 */
import { getFirestore as getFirestoreAdmin, type Firestore } from "firebase-admin/firestore";
import { getApps, initializeApp, type App } from "firebase-admin/app";

const COLLECTION = "world_items";

let app: App | null = null;

function getApp(): App | null {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0] as App;
    return app;
  }
  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (!projectId && !gac) return null;
  try {
    app = initializeApp({ projectId: projectId || undefined });
    return app;
  } catch {
    return null;
  }
}

export function getDb(): Firestore | null {
  const a = getApp();
  if (!a) return null;
  return getFirestoreAdmin(a);
}

export function getWorldCollection() {
  const db = getDb();
  if (!db) return null;
  return db.collection(COLLECTION);
}
