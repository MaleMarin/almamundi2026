#!/usr/bin/env node
/**
 * Mueve stories.authorEmail a author_contacts/{storyId} y borra el campo.
 *
 * Por defecto solo cuenta (dry-run). No escribe Firestore ni el respaldo.
 *   node scripts/migrate-author-contacts.mjs
 *
 * Para aplicar: primero guarda un JSON local y después copia y borra.
 *   node scripts/migrate-author-contacts.mjs --apply
 *
 * El JSON queda en scripts/backups/ y contiene correos. No lo subas.
 * No ejecutes este script contra producción sin aprobación.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldPath, FieldValue, getFirestore } from 'firebase-admin/firestore';

const root = resolve(import.meta.dirname, '..');
const apply = process.argv.includes('--apply') && !process.argv.includes('--dry-run');

function loadEnvFile(file) {
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value;
  }
}

function initAdmin() {
  if (getApps().length) return getApps()[0];
  const secretRaw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (secretRaw) {
    const svc = secretRaw.startsWith('{')
      ? JSON.parse(secretRaw)
      : JSON.parse(Buffer.from(secretRaw.replace(/\s/g, ''), 'base64').toString('utf8'));
    return initializeApp({
      credential: cert({
        projectId: svc.project_id ?? svc.projectId,
        clientEmail: svc.client_email ?? svc.clientEmail,
        privateKey: String(svc.private_key ?? svc.privateKey ?? '').replace(/\\n/g, '\n'),
      }),
    });
  }
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(
    /\\n/g,
    '\n'
  );
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Faltan las credenciales de Firebase Admin en el entorno.');
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function storiesWithAuthorEmail(db) {
  const found = [];
  let last = null;
  for (;;) {
    let query = db.collection('stories').orderBy(FieldPath.documentId()).limit(300);
    if (last) query = query.startAfter(last);
    const snap = await query.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      const raw = doc.get('authorEmail');
      if (typeof raw === 'string' && raw.trim()) {
        found.push({ storyId: doc.id, authorEmail: raw.trim() });
      }
    }
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < 300) break;
  }
  return found;
}

loadEnvFile(resolve(root, '.env.local'));
initAdmin();
const db = getFirestore();
const found = await storiesWithAuthorEmail(db);

console.log(`Historias con authorEmail: ${found.length}`);
if (!apply) {
  console.log('Dry-run. No se escribió nada.');
  process.exit(0);
}

const dir = resolve(root, 'scripts/backups');
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = resolve(dir, `author-emails-${stamp}.json`);
writeFileSync(backupPath, `${JSON.stringify(found, null, 2)}\n`);

let copied = 0;
let removed = 0;
let failed = 0;
for (const row of found) {
  try {
    await db.collection('author_contacts').doc(row.storyId).set(
      {
        email: row.authorEmail,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    copied += 1;
    await db.collection('stories').doc(row.storyId).update({
      authorEmail: FieldValue.delete(),
    });
    removed += 1;
  } catch (err) {
    failed += 1;
    const message = err instanceof Error ? err.message : 'error';
    console.error(`Falló ${row.storyId}: ${message}`);
  }
}

console.log(`Respaldo: ${backupPath}`);
console.log(`Copiadas: ${copied}. authorEmail borrado: ${removed}. Fallos: ${failed}.`);
process.exit(failed > 0 ? 1 : 0);
