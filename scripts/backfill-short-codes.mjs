/**
 * Escribe solo shortCode en historias y respuestas ya aprobadas que no lo tengan.
 * Mismo alfabeto que lib/short-code.ts.
 */
import { readFileSync } from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const LENGTH = 6;
const STORY_STATUSES = new Set(['approved', 'featured', 'published', 'active']);

function loadEnv() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value.replace(/\\n/g, '\n');
  }
}

function randomCode() {
  const limit = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  let out = '';
  while (out.length < LENGTH) {
    const bytes = new Uint8Array(LENGTH);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === LENGTH) break;
    }
  }
  return out;
}

function isCode(value) {
  return typeof value === 'string' && new RegExp(`^[${ALPHABET}]{${LENGTH}}$`).test(value);
}

function initDb() {
  if (!getApps().length) {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
    if (b64) {
      const json = Buffer.from(b64.replace(/\s/g, ''), 'base64').toString('utf8');
      const svc = JSON.parse(json);
      initializeApp({
        credential: cert({
          projectId: svc.project_id ?? svc.projectId,
          clientEmail: svc.client_email ?? svc.clientEmail,
          privateKey: String(svc.private_key ?? svc.privateKey ?? '').replace(/\\n/g, '\n'),
        }),
      });
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(
        /\\n/g,
        '\n'
      );
      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Faltan credenciales de Firebase Admin');
      }
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    }
  }
  return getFirestore();
}

function takeCode(used) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = randomCode();
    if (used.has(code)) continue;
    used.add(code);
    return code;
  }
  throw new Error('No se pudo crear un código corto');
}

async function fill(db, collectionName, include) {
  const snap = await db.collection(collectionName).get();
  const used = new Set();
  const pending = [];
  let example = '';
  for (const doc of snap.docs) {
    const data = doc.data();
    if (isCode(data.shortCode)) {
      used.add(data.shortCode);
      if (!example) example = data.shortCode;
      continue;
    }
    if (!include(data)) continue;
    pending.push(doc.ref);
  }
  let written = 0;
  for (const ref of pending) {
    const code = takeCode(used);
    const clash = await db.collection(collectionName).where('shortCode', '==', code).limit(1).get();
    if (!clash.empty) {
      used.add(code);
      continue;
    }
    await ref.update({ shortCode: code });
    written += 1;
    if (!example) example = code;
  }
  return { written, example };
}

loadEnv();
const db = initDb();
const stories = await fill(db, 'stories', (data) => STORY_STATUSES.has(String(data.status ?? '')));
const respuestas = await fill(db, 'respuestas', (data) => data.status === 'approved');
const example = stories.example
  ? `https://www.almamundi.org/h/${stories.example}`
  : respuestas.example
    ? `https://www.almamundi.org/r/${respuestas.example}`
    : '';
console.log(
  `historias ${stories.written}, respuestas ${respuestas.written}${example ? `, ejemplo ${example}` : ''}`
);
