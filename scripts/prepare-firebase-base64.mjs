#!/usr/bin/env node
/**
 * Opción A: genera el valor para FIREBASE_SERVICE_ACCOUNT_BASE64.
 * Uso: node scripts/prepare-firebase-base64.mjs <ruta-al-json>
 * Ejemplo: node scripts/prepare-firebase-base64.mjs ~/Downloads/tu-proyecto-firebase-adminsdk.json
 *
 * 1. En Firebase Console → tu proyecto → Configuración → Cuentas de servicio → Generar nueva clave privada.
 * 2. Guarda el JSON descargado (no lo subas a git).
 * 3. Ejecuta este script con la ruta al archivo.
 * 4. Copia la línea que imprime y pégala en .env.local (o solo el valor después del =).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const pathArg = process.argv[2];
if (!pathArg) {
  console.error('Uso: node scripts/prepare-firebase-base64.mjs <ruta-al-json>');
  console.error('Ejemplo: node scripts/prepare-firebase-base64.mjs ./mi-cuenta-servicio.json');
  process.exit(1);
}

const absolutePath = resolve(pathArg);
let json;
try {
  json = readFileSync(absolutePath, 'utf8');
} catch (e) {
  console.error('No se pudo leer el archivo:', absolutePath);
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

const base64 = Buffer.from(json, 'utf8').toString('base64');
const oneLine = base64.replace(/\n/g, '');

console.log('\nPega esta línea en tu .env.local:\n');
console.log(`FIREBASE_SERVICE_ACCOUNT_BASE64=${oneLine}`);
console.log('\n(O solo el valor después del = si ya tienes la variable.)\n');
