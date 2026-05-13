'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';

const SOFT_BG = '#E0E5EC';

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

function hslFromHash(h: number, offset = 0) {
  const hue = (h + offset) % 360;
  return `hsl(${hue} 85% 55%)`;
}

async function blobToAmplitudeSamples(blob: Blob, target = 160) {
  try {
    const arr = await blob.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return Array.from({ length: target }, () => 0.2);

    const ctx = new AudioCtx();
    const audio = await ctx.decodeAudioData(arr.slice(0));
    const data = audio.getChannelData(0);
    const step = Math.floor(data.length / target) || 1;

    const out: number[] = [];
    for (let i = 0; i < target; i++) {
      const start = i * step;
      let sum = 0;
      let count = 0;
      for (let j = 0; j < step && start + j < data.length; j++) {
        sum += Math.abs(data[start + j]);
        count++;
      }
      out.push(clamp(sum / Math.max(1, count), 0, 1));
    }

    await ctx.close?.().catch(() => {});
    return out;
  } catch {
    return Array.from({ length: target }, () => 0.2);
  }
}

function ImprontaVisualizer({
  isActive,
  seedText,
  audioBlob,
  canvasId,
}: {
  isActive: boolean;
  seedText: string;
  audioBlob: Blob | null;
  canvasId?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [amps, setAmps] = useState<number[] | null>(null);

  useEffect(() => {
    let alive = true;
    if (!audioBlob) {
      queueMicrotask(() => setAmps(null));
      return;
    }
    blobToAmplitudeSamples(audioBlob).then((a) => {
      if (alive) setAmps(a);
    });
    return () => {
      alive = false;
    };
  }, [audioBlob]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;

    const h = hashString(seedText || 'almamundi');
    const c1 = hslFromHash(h, 10);
    const c2 = hslFromHash(h, 120);
    const c3 = hslFromHash(h, 220);

    const draw = () => {
      const w = canvas.width;
      const hh = canvas.height;

      ctx.clearRect(0, 0, w, hh);
      if (!isActive) return;

      ctx.fillStyle = SOFT_BG;
      ctx.fillRect(0, 0, w, hh);

      t += 0.03;

      const grad = ctx.createRadialGradient(w * 0.5, hh * 0.45, 20, w * 0.5, hh * 0.45, Math.max(w, hh));
      grad.addColorStop(0, 'rgba(249,115,22,0.15)');
      grad.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, hh);

      ctx.beginPath();
      ctx.moveTo(0, hh / 2);
      for (let x = 0; x < w; x++) {
        const base = Math.sin(x * 0.018 + t) * 18;
        const mod = Math.cos(x * 0.04 - t * 1.2) * 9;
        const y = hh / 2 + base + mod + Math.sin(t * 0.6) * 3;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = c1;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, hh / 2);
      for (let x = 0; x < w; x++) {
        const y = hh / 2 + Math.sin(x * 0.03 - t * 1.8) * 12;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.30)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const dots = 18;
      for (let i = 0; i < dots; i++) {
        const px = ((h % 997) / 997) * w;
        const phase = (i * 0.7 + (h % 100) / 50) * 2;
        const x = (px + i * 19 + Math.sin(t + phase) * 16) % w;
        const y = hh * 0.25 + ((i * 37 + h) % 120) + Math.cos(t * 1.2 + i) * 10;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? c2 : i % 3 === 1 ? c3 : 'rgba(249,115,22,0.65)';
        ctx.fill();
      }

      if (amps && amps.length) {
        const mid = hh * 0.78;
        const maxH = 34;
        ctx.beginPath();
        for (let i = 0; i < amps.length; i++) {
          const x = (i / (amps.length - 1)) * w;
          const a = amps[i] ?? 0.2;
          const y = mid - a * maxH;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(74,85,104,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [isActive, seedText, amps]);

  return <canvas id={canvasId} ref={canvasRef} width={520} height={260} className="h-full w-full object-cover opacity-90" />;
}

export default function DemoImprontaPage() {
  const [seed, setSeed] = useState('almamundi-seed-demo-mi-historia');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [err, setErr] = useState('');

  const onAudioPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setAudioBlob(null);
      return;
    }
    setAudioBlob(f);
  }, []);

  const downloadPng = useCallback(() => {
    const canvas = document.getElementById('resonancia-canvas-demo') as HTMLCanvasElement | null;
    if (!canvas) {
      setErr('No se encontró el lienzo.');
      window.setTimeout(() => setErr(''), 2000);
      return;
    }
    try {
      const png = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = png;
      a.download = 'AlmaMundi-resonancia-visual-demo.png';
      a.click();
    } catch {
      setErr('No se pudo descargar en este navegador.');
      window.setTimeout(() => setErr(''), 2000);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-sm text-gray-500">
          <HomeHardLink href="/" className="text-orange-600 underline hover:text-orange-700">
            Volver al inicio
          </HomeHardLink>
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-800">Demo resonancia visual (histórica)</h1>
        <p className="mt-2 text-gray-600">
          Animación de canvas de referencia, heredada de versiones anteriores. Solo para mirar o probar; no está enlazada al flujo real de subida.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Texto semilla (cambia colores y patrón)</span>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-400"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Audio opcional (muestra la línea inferior como en el modal antiguo)</span>
        <input type="file" accept="audio/*" onChange={onAudioPick} className="text-sm" />
      </label>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm" style={{ height: 220 }}>
        <ImprontaVisualizer isActive seedText={seed} audioBlob={audioBlob} canvasId="resonancia-canvas-demo" />
      </div>

      <button
        type="button"
        onClick={downloadPng}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-[#E0E5EC] px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-700 shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.8)] hover:text-gray-900 active:scale-[0.98]"
      >
        <Download size={16} />
        Descargar PNG
      </button>
    </main>
  );
}
