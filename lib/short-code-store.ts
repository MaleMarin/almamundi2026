import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { isShortCode, randomShortCode } from "@/lib/short-code";

/** Código nuevo, único dentro de la colección. */
export async function allocateShortCode(db: Firestore, collectionName: string): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = randomShortCode();
    const found = await db.collection(collectionName).where("shortCode", "==", code).limit(1).get();
    if (found.empty) return code;
  }
  throw new Error("No se pudo crear un código corto");
}

/** Si ya hay un código válido, lo deja. Si no, escribe solo shortCode. */
export async function ensureShortCode(
  db: Firestore,
  collectionName: string,
  id: string,
  current: unknown
): Promise<string> {
  if (isShortCode(typeof current === "string" ? current : "")) return current as string;
  const code = await allocateShortCode(db, collectionName);
  await db.collection(collectionName).doc(id).update({ shortCode: code });
  return code;
}
