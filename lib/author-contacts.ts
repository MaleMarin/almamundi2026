/**
 * Correo del autor de una historia publicada.
 * El documento público `stories` no lo guarda. El cliente no puede leer esta colección.
 */
import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

export const AUTHOR_CONTACTS_COLLECTION = "author_contacts";

export function authorEmailOnStory(data: Record<string, unknown> | undefined): string | null {
  const raw = data?.authorEmail;
  if (typeof raw !== "string") return null;
  const email = raw.trim();
  return email || null;
}

export async function readAuthorContactEmail(
  db: Firestore,
  storyId: string
): Promise<string | null> {
  const id = storyId.trim();
  if (!id) return null;
  const snap = await db.collection(AUTHOR_CONTACTS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  const raw = snap.get("email");
  if (typeof raw !== "string") return null;
  const email = raw.trim();
  return email || null;
}

/** `author_contacts` primero. Si no hay documento, el `authorEmail` que aún esté en la historia. */
export async function resolveStoredAuthorEmail(
  db: Firestore,
  storyId: string,
  storyData: Record<string, unknown> | undefined
): Promise<string | null> {
  return (await readAuthorContactEmail(db, storyId)) ?? authorEmailOnStory(storyData);
}

export async function saveAuthorContact(
  db: Firestore,
  storyId: string,
  email: string
): Promise<void> {
  const id = storyId.trim();
  const trimmed = email.trim();
  if (!id || !trimmed) return;
  await db.collection(AUTHOR_CONTACTS_COLLECTION).doc(id).set(
    {
      email: trimmed,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteAuthorContact(db: Firestore, storyId: string): Promise<void> {
  const id = storyId.trim();
  if (!id) return;
  await db.collection(AUTHOR_CONTACTS_COLLECTION).doc(id).delete();
}
