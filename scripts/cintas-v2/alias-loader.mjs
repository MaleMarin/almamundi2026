import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolvePath(import.meta.dirname, '../..');

function tryFile(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.json`,
    resolvePath(base, 'index.ts'),
  ];
  for (const c of candidates) {
    if (existsSync(c) && extname(c)) return c;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const file = tryFile(resolvePath(ROOT, specifier.slice(2)));
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  if (specifier.startsWith('.') && context.parentURL) {
    const parent = new URL(context.parentURL);
    const base = resolvePath(parent.pathname, '..', specifier);
    const file = tryFile(base);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const source = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'json', shortCircuit: true, source };
  }
  return nextLoad(url, context);
}
