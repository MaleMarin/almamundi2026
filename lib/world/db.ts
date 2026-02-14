import type { CollectionReference } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

function hasFirestoreConfig() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_PROJECT_ID
  );
}

function ensureAdminInitialized() {
  if (admin.apps.length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    const json = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(json),
      projectId: json.project_id || process.env.FIREBASE_PROJECT_ID,
    });
    return;
  }

  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export function getWorldCollection(): CollectionReference | null {
  try {
    if (!hasFirestoreConfig()) return null;

    ensureAdminInitialized();
    const db = getFirestore();
    return db.collection("world") as unknown as CollectionReference;
  } catch (e) {
    console.error("[getWorldCollection] Firestore init failed:", e);
    return null;
  }
}
