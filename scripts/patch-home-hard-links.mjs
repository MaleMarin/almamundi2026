/**
 * Reemplaza <Link href="/…"> de inicio por <HomeHardLink> y ajusta cierres.
 * Ejecutar desde la raíz: node scripts/patch-home-hard-links.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function isHomeHref(h) {
  if (h === '/') return true;
  if (h.startsWith('/#')) return true;
  if (h.startsWith('/?')) return true;
  return false;
}

function transform(content) {
  const stack = [];
  let out = '';
  let i = 0;

  while (i < content.length) {
    const rest = content.slice(i);

    if (rest.startsWith('</Link>')) {
      const kind = stack.pop();
      out += kind === 'home' ? '</HomeHardLink>' : '</Link>';
      i += 7;
      continue;
    }

    if (rest.startsWith('<Link') && (i === 0 || !/[A-Za-z0-9_]/.test(content[i - 1]))) {
      let j = i + 5;
      let quote = null;
      while (j < content.length) {
        const c = content[j];
        if (quote) {
          if (c === quote && content[j - 1] !== '\\') quote = null;
          j++;
          continue;
        }
        if (c === '"' || c === "'" || c === '`') {
          quote = c;
          j++;
          continue;
        }
        if (c === '>') break;
        j++;
      }
      if (j >= content.length || content[j] !== '>') {
        out += content[i];
        i++;
        continue;
      }
      const openTag = content.slice(i, j + 1);
      const hrefM = openTag.match(/\bhref=(["'])([^"']*)\1/);
      const href = hrefM ? hrefM[2] : null;
      if (href && isHomeHref(href)) {
        out += openTag.replace('<Link', '<HomeHardLink');
        stack.push('home');
      } else {
        out += openTag;
        stack.push('other');
      }
      i = j + 1;
      continue;
    }

    out += content[i];
    i++;
  }

  if (stack.length !== 0) {
    throw new Error(`Stack desbalanceado (${stack.length})`);
  }

  return out;
}

function ensureImport(content) {
  if (!content.includes('HomeHardLink')) return content;
  if (content.includes("@/components/layout/HomeHardLink")) return content;

  const line =
    "import { HomeHardLink } from '@/components/layout/HomeHardLink';\n";
  const useClient = content.startsWith("'use client'");
  if (useClient) {
    const nl = content.indexOf('\n');
    return content.slice(0, nl + 1) + line + content.slice(nl + 1);
  }
  return line + content;
}

function dropUnusedLinkImport(content) {
  if (content.includes('<Link') || content.includes('</Link>')) return content;
  return content.replace(/^import Link from ['"]next\/link['"];\n/gm, '');
}

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith('.')) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === '.next') continue;
      walk(p, acc);
    } else if (name.name.endsWith('.tsx')) acc.push(p);
  }
}

const targets = [];
walk(path.join(ROOT, 'app'), targets);
walk(path.join(ROOT, 'components'), targets);

const skip = new Set([
  path.join(ROOT, 'components/layout/HomeHardLink.tsx'),
]);

let changed = 0;
for (const file of targets) {
  if (skip.has(file)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.includes('Link') || !raw.includes('href=')) continue;
  if (!/<Link\b/.test(raw)) continue;

  let next;
  try {
    next = transform(raw);
  } catch (e) {
    console.error(file, e.message);
    process.exit(1);
  }
  if (next === raw) continue;
  next = ensureImport(next);
  next = dropUnusedLinkImport(next);
  fs.writeFileSync(file, next, 'utf8');
  changed++;
  console.log('patched', path.relative(ROOT, file));
}

console.log('done, files changed:', changed);
