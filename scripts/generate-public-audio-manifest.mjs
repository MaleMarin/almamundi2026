/**
 * Genera `lib/public-audio-manifest.json` para `/api/public-audio`.
 * Evita que Next/Vercel empaquete todo `public/` en la función serverless.
 */
import { readdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const AUDIO_EXT = new Set([".mp3", ".wav", ".m4a", ".ogg", ".webm", ".mp4"]);

function toUrlPath(absFile, publicRoot) {
  let rel = absFile.slice(publicRoot.length).replace(/\\/g, "/");
  if (!rel.startsWith("/")) rel = `/${rel}`;
  return rel;
}

async function walkAudioFiles(dir, publicRoot, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walkAudioFiles(full, publicRoot, out);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (AUDIO_EXT.has(ext)) out.add(toUrlPath(full, publicRoot));
    }
  }
}

async function main() {
  const publicRoot = path.join(root, "public");
  const audioDir = path.join(publicRoot, "audio");
  const paths = new Set();

  await walkAudioFiles(audioDir, publicRoot, paths);

  try {
    const rootEntries = await readdir(publicRoot, { withFileTypes: true });
    for (const e of rootEntries) {
      if (!e.isFile()) continue;
      const ext = path.extname(e.name).toLowerCase();
      if (AUDIO_EXT.has(ext)) paths.add(`/${e.name}`);
    }
  } catch {
    /* ignore */
  }

  const sorted = [...paths].sort((a, b) => a.localeCompare(b, "es"));
  const outPath = path.join(root, "lib", "public-audio-manifest.json");
  await writeFile(
    outPath,
    `${JSON.stringify({ paths: sorted }, null, 2)}\n`,
    "utf8"
  );
  console.log(`public-audio manifest: ${sorted.length} paths → ${path.relative(root, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
