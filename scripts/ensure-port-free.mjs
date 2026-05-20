#!/usr/bin/env node
/**
 * Libera el puerto antes de `npm run dev` (evita EADDRINUSE en 3005).
 * macOS/Linux: usa lsof; en otros SO no hace nada destructivo.
 */
import { execSync } from 'node:child_process';

const port = process.argv[2] ?? '3005';

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

try {
  const pids = run(`lsof -ti:${port}`);
  if (!pids) process.exit(0);
  const list = pids.split(/\s+/).filter(Boolean);
  for (const pid of list) {
    try {
      process.kill(Number(pid), 'SIGKILL');
    } catch {
      /* ya terminó */
    }
  }
  console.log(`[ensure-port-free] Puerto ${port} liberado (${list.length} proceso(s)).`);
} catch {
  /* lsof sin resultados: puerto libre */
}
