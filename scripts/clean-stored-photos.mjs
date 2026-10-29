#!/usr/bin/env node
/**
 * Limpia fotos ya guardadas en Storage.
 *
 * Por defecto solo informa. No descarga respaldos, no reescribe Storage
 * y no toca Firestore.
 *   node scripts/clean-stored-photos.mjs
 *
 * Para corregir: respalda cada archivo que vaya a cambiar y después lo reescribe.
 *   node scripts/clean-stored-photos.mjs --apply
 *
 * Carpetas: submissions/private/ (envíos, fotos de perfil, archivos extra
 * y respuestas privadas) y published/ (historias y respuestas publicadas).
 * No toca videos ni audios.
 *
 * El respaldo queda en scripts/backups/ y no se sube a git.
 * No ejecutes --apply contra producción sin aprobación.
 */

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const heicModule = require('heic-convert');
const heicConvert = typeof heicModule === 'function' ? heicModule : heicModule.default;

const root = resolve(import.meta.dirname, '..');
const apply = process.argv.includes('--apply') && !process.argv.includes('--dry-run');
const MAX_SIDE = 2048;
const PREFIXES = ['submissions/private/', 'published/'];
const COLLECTIONS = ['submissions', 'stories', 'respuestas'];
const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

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

function storageBucketName() {
  const raw = (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    ''
  )
    .trim()
    .replace(/^gs:\/\//, '');
  return raw || undefined;
}

function initAdmin() {
  if (getApps().length) return getApps()[0];
  const storageBucket = storageBucketName();
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
      ...(storageBucket ? { storageBucket } : {}),
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
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    ...(storageBucket ? { storageBucket } : {}),
  });
}

function extensionOf(name) {
  const base = name.split('/').pop() || '';
  const dot = base.lastIndexOf('.');
  return dot < 0 ? '' : base.slice(dot + 1).toLowerCase();
}

function contentTypeOf(meta) {
  return String(meta?.contentType || '')
    .toLowerCase()
    .split(';')[0]
    .trim();
}

function isVideoOrAudio(name, contentType) {
  if (contentType.startsWith('video/') || contentType.startsWith('audio/')) return true;
  return /^(mp4|m4v|mov|webm|mkv|mp3|m4a|wav|aac|ogg|oga|opus)$/.test(extensionOf(name));
}

function isPhoto(name, contentType) {
  if (!name || name.endsWith('/') || name.includes('..')) return false;
  if (isVideoOrAudio(name, contentType)) return false;
  if (IMAGE_EXT.has(extensionOf(name))) return true;
  return (
    contentType === 'image/jpeg' ||
    contentType === 'image/jpg' ||
    contentType === 'image/png' ||
    contentType === 'image/webp' ||
    contentType === 'image/heic' ||
    contentType === 'image/heif'
  );
}

function looksLikeHeic(buffer) {
  if (!buffer || buffer.length < 12) return false;
  if (buffer.toString('ascii', 4, 8) !== 'ftyp') return false;
  const box = buffer.subarray(8, Math.min(buffer.length, 64)).toString('ascii').toLowerCase();
  if (box.includes('avif')) return false;
  return /heic|heif|heix|heim|heis|hevc|hevx|mif1|msf1/.test(box);
}

function isHeic(name, contentType, buffer) {
  if (contentType.includes('heic') || contentType.includes('heif')) return true;
  if (/\.(heic|heif)$/i.test(name)) return true;
  return looksLikeHeic(buffer);
}

function readExifTags(exif) {
  const found = { gps: false, other: false };
  try {
    let offset = 0;
    if (exif.length >= 6 && exif.toString('ascii', 0, 4) === 'Exif') offset = 6;
    if (exif.length < offset + 8) return found;
    const order = exif.toString('ascii', offset, offset + 2);
    const le = order === 'II';
    if (!le && order !== 'MM') return found;
    const u16 = (at) => (le ? exif.readUInt16LE(at) : exif.readUInt16BE(at));
    const u32 = (at) => (le ? exif.readUInt32LE(at) : exif.readUInt32BE(at));
    if (u16(offset + 2) !== 42) return found;
    let ifd = offset + u32(offset + 4);
    const seen = new Set();
    for (let depth = 0; depth < 8 && ifd > 0 && !seen.has(ifd); depth += 1) {
      seen.add(ifd);
      if (ifd + 2 > exif.length) return found;
      const count = u16(ifd);
      for (let i = 0; i < count; i += 1) {
        const entry = ifd + 2 + i * 12;
        if (entry + 12 > exif.length) return found;
        const tag = u16(entry);
        if (tag === 0x8825) found.gps = true;
        else found.other = true;
      }
      const nextPtr = ifd + 2 + count * 12;
      if (nextPtr + 4 > exif.length) break;
      const next = u32(nextPtr);
      ifd = next ? offset + next : 0;
    }
  } catch {
    return found;
  }
  return found;
}

function heicPixelSize(buffer) {
  let best = null;
  let from = 0;
  while (from < buffer.length) {
    const at = buffer.indexOf('ispe', from);
    if (at < 0 || at + 16 > buffer.length) break;
    const width = buffer.readUInt32BE(at + 8);
    const height = buffer.readUInt32BE(at + 12);
    if (width > 0 && height > 0 && width <= 20000 && height <= 20000) {
      const area = width * height;
      if (!best || area > best.area) best = { width, height, area };
    }
    from = at + 4;
  }
  return best;
}

function orientedSize(width, height, orientation) {
  const swap = orientation >= 5 && orientation <= 8;
  return {
    width: swap ? height : width,
    height: swap ? width : height,
  };
}

async function inspect(buffer, name, contentType) {
  const heic = isHeic(name, contentType, buffer);
  let width = 0;
  let height = 0;
  let orientation = 1;
  let gps = false;
  let other = false;

  try {
    const meta = await sharp(buffer, { failOn: 'none' }).metadata();
    if (meta.width && meta.height) {
      width = meta.width;
      height = meta.height;
      orientation = meta.orientation || 1;
      if (meta.exif?.length) {
        const tags = readExifTags(meta.exif);
        gps = tags.gps;
        other = tags.other;
      }
      if (meta.xmp?.length || meta.iptc?.length) other = true;
    }
  } catch {
    width = 0;
  }

  if (!width || !height) {
    if (!heic) throw new Error('no se pudo leer la imagen');
    const box = heicPixelSize(buffer);
    if (!box) throw new Error('no se pudo leer el tamaño del HEIC');
    width = box.width;
    height = box.height;
    const marker = buffer.indexOf('Exif\u0000\u0000');
    if (marker >= 0) {
      const tags = readExifTags(buffer.subarray(marker, Math.min(buffer.length, marker + 65536)));
      gps = tags.gps;
      other = tags.other;
    }
  }

  if (orientation > 1) other = true;
  const visual = orientedSize(width, height, orientation);
  const over = Math.max(visual.width, visual.height) > MAX_SIDE;
  return {
    gps,
    other,
    over,
    heic,
    change: gps || other || over || heic,
  };
}

function outputKind(name, contentType, heic) {
  if (heic) return 'jpeg';
  const ext = extensionOf(name);
  const ct = contentType;
  if (ext === 'png' || ct === 'image/png') return 'png';
  if (ext === 'webp' || ct === 'image/webp') return 'webp';
  return 'jpeg';
}

function replacementPath(name, kind) {
  if (kind === 'png' || kind === 'webp') return name;
  const ext = extensionOf(name);
  if (ext === 'jpg' || ext === 'jpeg') return name;
  const slash = name.lastIndexOf('/');
  const base = slash < 0 ? name : name.slice(slash + 1);
  const stem = base.replace(/\.(heic|heif|png|jpe?g|webp)$/i, '') || 'foto';
  const dir = slash < 0 ? '' : name.slice(0, slash + 1);
  return `${dir}${stem}.jpg`;
}

async function render(buffer, name, contentType, info) {
  const kind = outputKind(name, contentType, info.heic);
  let source = buffer;
  if (info.heic) {
    let readable = false;
    try {
      const meta = await sharp(buffer, { failOn: 'none' }).metadata();
      readable = Boolean(meta.width && meta.height);
    } catch {
      readable = false;
    }
    if (!readable) {
      const converted = await heicConvert({ buffer, format: 'JPEG', quality: 1 });
      source = Buffer.from(converted);
    }
  }

  let pipeline = sharp(source, { failOn: 'none' }).rotate();
  pipeline = pipeline.resize({
    width: MAX_SIDE,
    height: MAX_SIDE,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (kind === 'png') {
    return { buffer: await pipeline.png().toBuffer(), contentType: 'image/png' };
  }
  if (kind === 'webp') {
    return { buffer: await pipeline.webp({ quality: 90 }).toBuffer(), contentType: 'image/webp' };
  }
  return {
    buffer: await pipeline.jpeg({ quality: info.heic ? 85 : 90 }).toBuffer(),
    contentType: 'image/jpeg',
  };
}

async function* listPrefix(bucket, prefix) {
  let pageToken;
  do {
    const [files, next] = await bucket.getFiles({
      prefix,
      autoPaginate: false,
      maxResults: 200,
      pageToken,
    });
    for (const file of files) yield file;
    pageToken = next?.pageToken;
  } while (pageToken);
}

function fechaHoy() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function backupDir() {
  const base = resolve(root, 'scripts/backups', `photos-${fechaHoy()}`);
  return base;
}

async function loadCollection(db, name) {
  const docs = [];
  let last = null;
  for (;;) {
    let query = db.collection(name).orderBy(FieldPath.documentId()).limit(200);
    if (last) query = query.startAfter(last);
    const snap = await query.get();
    if (snap.empty) break;
    docs.push(...snap.docs.map((doc) => ({ ref: doc.ref, data: doc.data() })));
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < 200) break;
  }
  return docs;
}

function replacePath(value, oldPath, newPath, changed) {
  if (typeof value === 'string') {
    if (!value.includes(oldPath) && !value.includes(encodeURIComponent(oldPath))) return value;
    changed.yes = true;
    return value.split(oldPath).join(newPath).split(encodeURIComponent(oldPath)).join(encodeURIComponent(newPath));
  }
  if (Array.isArray(value)) return value.map((item) => replacePath(item, oldPath, newPath, changed));
  if (!value || typeof value !== 'object') return value;
  if (Object.prototype.toString.call(value) !== '[object Object]') return value;
  const next = {};
  for (const [key, item] of Object.entries(value)) {
    next[key] = replacePath(item, oldPath, newPath, changed);
  }
  return next;
}

async function updateFirestore(docs, oldPath, newPath) {
  let updates = 0;
  for (const doc of docs) {
    const changed = { yes: false };
    const next = replacePath(doc.data, oldPath, newPath, changed);
    if (!changed.yes) continue;
    doc.data = next;
    await doc.ref.set(next);
    updates += 1;
  }
  return updates;
}

function reasonLine(info) {
  const parts = [];
  if (info.gps) parts.push('GPS');
  if (info.other) parts.push('EXIF');
  if (info.over) parts.push(`más de ${MAX_SIDE} px`);
  if (info.heic) parts.push('HEIC');
  return parts.join(', ') || 'limpieza';
}

loadEnvFile(resolve(root, '.env.local'));
initAdmin();
const bucketName = storageBucketName();
const bucket = bucketName ? getStorage().bucket(bucketName) : getStorage().bucket();
if (!bucket.name) {
  throw new Error('Firebase Storage: falta FIREBASE_STORAGE_BUCKET o NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
}

const counts = { total: 0, gps: 0, other: 0, over: 0, heic: 0, wouldChange: 0 };
const changed = [];
const failed = [];
const seen = new Set();

let firestoreDocs = [];
if (apply) {
  const db = getFirestore();
  for (const name of COLLECTIONS) {
    const docs = await loadCollection(db, name);
    firestoreDocs.push(...docs);
  }
}

for (const prefix of PREFIXES) {
  for await (const file of listPrefix(bucket, prefix)) {
    const name = file.name;
    if (seen.has(name)) continue;
    let contentType = '';
    try {
      const [meta] = await file.getMetadata();
      contentType = contentTypeOf(meta);
      if (!isPhoto(name, contentType)) continue;
      seen.add(name);
      counts.total += 1;
      const [buffer] = await file.download();
      const info = await inspect(buffer, name, contentType);
      if (info.gps) counts.gps += 1;
      if (info.other) counts.other += 1;
      if (info.over) counts.over += 1;
      if (info.heic) counts.heic += 1;
      if (!info.change) continue;
      counts.wouldChange += 1;
      if (!apply) continue;

      const dest = replacementPath(name, outputKind(name, contentType, info.heic));
      if (dest !== name) {
        const [exists] = await bucket.file(dest).exists();
        if (exists) throw new Error('ya existe un archivo con la extensión nueva');
      }

      const backup = resolve(backupDir(), name);
      mkdirSync(dirname(backup), { recursive: true });
      writeFileSync(backup, buffer);

      const rendered = await render(buffer, name, contentType, info);
      const still = await inspect(rendered.buffer, dest, rendered.contentType);
      if (still.gps || still.other || still.heic || still.over) {
        throw new Error('la imagen reescrita todavía tiene metadatos, HEIC o pasa de 2048 px');
      }

      const token = meta.metadata?.firebaseStorageDownloadTokens;
      const cacheControl =
        meta.cacheControl ||
        (name.startsWith('published/')
          ? 'public, max-age=31536000, immutable'
          : 'private, max-age=0, no-store');
      await bucket.file(dest).save(rendered.buffer, {
        resumable: false,
        metadata: {
          contentType: rendered.contentType,
          cacheControl,
          ...(token ? { metadata: { firebaseStorageDownloadTokens: String(token) } } : {}),
        },
      });

      let urlUpdates = 0;
      if (dest !== name) {
        try {
          urlUpdates = await updateFirestore(firestoreDocs, name, dest);
        } catch (err) {
          await bucket.file(dest).delete({ ignoreNotFound: true });
          throw err;
        }
        try {
          await file.delete({ ignoreNotFound: true });
        } catch {
          console.error(`No se pudo borrar el archivo anterior: ${name}`);
        }
      }
      changed.push({ name, dest, why: reasonLine(info), urlUpdates });
      console.log(`Cambiada: ${name}${dest === name ? '' : ` → ${dest}`} (${reasonLine(info)})`);
    } catch (err) {
      if (!seen.has(name) && !isPhoto(name, contentType)) continue;
      if (!seen.has(name)) seen.add(name);
      const message = err instanceof Error ? err.message : 'error';
      failed.push({ name, message });
      console.error(`Falló: ${name} — ${message}`);
    }
  }
}

console.log('');
console.log(`Fotos: ${counts.total}`);
console.log(`Con GPS: ${counts.gps}`);
console.log(`Con otro EXIF: ${counts.other}`);
console.log(`Superan ${MAX_SIDE} px: ${counts.over}`);
console.log(`Siguen en HEIC: ${counts.heic}`);
if (apply) {
  console.log(`Cambiadas: ${changed.length}`);
  console.log(`Fallidas: ${failed.length}`);
  if (changed.length) {
    console.log('Detalle de cambios:');
    for (const row of changed) {
      const moved = row.dest === row.name ? row.name : `${row.name} → ${row.dest}`;
      console.log(`- ${moved} (${row.why}; URLs actualizadas: ${row.urlUpdates})`);
    }
  }
  if (failed.length) {
    console.log('Detalle de fallos:');
    for (const row of failed) console.log(`- ${row.name} — ${row.message}`);
  }
} else {
  console.log(`Se cambiarían: ${counts.wouldChange}`);
  console.log(`Fallidas al leer: ${failed.length}`);
  if (failed.length) {
    for (const row of failed) console.log(`- ${row.name} — ${row.message}`);
  }
  console.log('Modo prueba. No se modificó nada.');
}

if (failed.length) process.exitCode = 1;
