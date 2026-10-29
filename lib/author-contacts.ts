/**
 * Correo, edad, género y «¿Algo más…?» de una historia publicada.
 * El documento público `stories` no los guarda. El cliente no puede leer esta colección.
 */
import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { normalizeAntecedentes } from "@/lib/antecedentes";

export const AUTHOR_CONTACTS_COLLECTION = "author_contacts";

export type AuthorPrivateFields = {
  email?: string | null;
  ageRange?: string | null;
  sex?: string | null;
  antecedentes?: string | null;
};

function privateText(raw: string | null | undefined, max = 200): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, max);
}

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

/** Guarda solo los campos presentes. No pisa el correo si no viene uno nuevo. */
export async function saveAuthorPrivate(
  db: Firestore,
  storyId: string,
  fields: AuthorPrivateFields
): Promise<void> {
  const id = storyId.trim();
  if (!id) return;
  const payload: Record<string, unknown> = {};
  const email = privateText(fields.email, 320);
  const ageRange = privateText(fields.ageRange, 40);
  const sex = privateText(fields.sex, 40);
  const antecedentes = normalizeAntecedentes(fields.antecedentes) ?? "";
  if (email) payload.email = email;
  if (ageRange) payload.ageRange = ageRange;
  if (sex) payload.sex = sex;
  if (antecedentes) payload.antecedentes = antecedentes;
  if (Object.keys(payload).length === 0) return;
  payload.updatedAt = FieldValue.serverTimestamp();
  await db.collection(AUTHOR_CONTACTS_COLLECTION).doc(id).set(payload, { merge: true });
}

export async function saveAuthorContact(
  db: Firestore,
  storyId: string,
  email: string
): Promise<void> {
  await saveAuthorPrivate(db, storyId, { email });
}

export async function deleteAuthorContact(db: Firestore, storyId: string): Promise<void> {
  const id = storyId.trim();
  if (!id) return;
  await db.collection(AUTHOR_CONTACTS_COLLECTION).doc(id).delete();
}
