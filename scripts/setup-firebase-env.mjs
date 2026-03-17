#!/usr/bin/env node
/**
 * Rellena FIREBASE_SERVICE_ACCOUNT_BASE64 en .env.local automáticamente.
 *
 * 1. En Firebase Console → Cuentas de servicio → Generar nueva clave privada (descarga el JSON).
 * 2. Guarda ese archivo en la raíz del proyecto con el nombre: firebase-service-account.json
 * 3. Ejecuta: node scripts/setup-firebase-env.mjs
 * 4. (Opcional) Borra firebase-service-account.json por seguridad.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const projectRoot = resolve(import.meta.dirname, '..');
const defaultJsonPath = resolve(projectRoot, 'firebase-service-account.json');
const envPath = resolve(projectRoot, '.env.local');

const jsonPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultJsonPath;

if (!existsSync(jsonPath)) {
  console.error('');
  console.error('No se encontró el archivo JSON de Firebase.');
  console.error('');
  console.error('Haz esto:');
  console.error('  1. Firebase Console → tu proyecto → Cuentas de servicio → Generar nueva clave privada');
  console.error('  2. Guarda el archivo descargado en la raíz del proyecto con este nombre exacto:');
  console.error('     firebase-service-account.json');
  console.error('  3. Vuelve a ejecutar: node scripts/setup-firebase-env.mjs');
  console.error('');
  process.exit(1);
}

let json;
try {
  json = readFileSync(jsonPath, 'utf8');
} catch (e) {
  console.error('Error leyendo el archivo:', jsonPath, e.message);
  process.exit(1);
}

const base64 = Buffer.from(json, 'utf8').toString('base64').replace(/\n/g, '');

let envContent = '';
if (existsSync(envPath)) {
  envContent = readFileSync(envPath, 'utf8');
}

// Reemplazar línea existente o añadir al final
if (/FIREBASE_SERVICE_ACCOUNT_BASE64=/.test(envContent)) {
  envContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT_BASE64=.*/m, `FIREBASE_SERVICE_ACCOUNT_BASE64=${base64}`);
} else {
  envContent = envContent.trimEnd() + (envContent.endsWith('\n') ? '' : '\n') + `FIREBASE_SERVICE_ACCOUNT_BASE64=${base64}\n`;
}

writeFileSync(envPath, envContent);

console.log('');
console.log('Listo. Se ha guardado FIREBASE_SERVICE_ACCOUNT_BASE64 en .env.local');
console.log('');
console.log('Reinicia el servidor (npm run dev) para que se aplique.');
console.log('');
console.log('Por seguridad, borra el JSON del proyecto si quieres:');
console.log('  rm firebase-service-account.json');
console.log('');
