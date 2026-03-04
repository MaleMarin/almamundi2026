import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.warn("[Firebase client] NEXT_PUBLIC_FIREBASE_API_KEY no está definida en .env.local");
}

const firebaseApp = firebaseConfig.apiKey
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>))
  : null;

export { firebaseApp };
export const db = firebaseApp ? getFirestore(firebaseApp) : (null as ReturnType<typeof getFirestore> | null);
export const auth = firebaseApp ? getAuth(firebaseApp) : (null as ReturnType<typeof getAuth> | null);
export const storage = firebaseApp ? getStorage(firebaseApp) : (null as ReturnType<typeof getStorage> | null);
