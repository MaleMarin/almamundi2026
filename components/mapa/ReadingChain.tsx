'use client';

import { useEffect, useRef, useState } from 'react';
import { SITE_FONT_STACK } from '@/lib/typography';

type Pulse = { lat: number; lng: number };

export function ReadingChain({ storyId }: { storyId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pulses, setPulses] = useState<Pulse[]>([]);

  useEffect(() => {
    fetch(`/api/pulse?storyId=${encodeURIComponent(storyId)}`)
      .then((r) => r.json())
      .then((d: { pulses?: Pulse[] }) => setPulses(d.pulses ?? []))
      .catch(() => {});
  }, [storyId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pulses.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = (canvas.width = canvas.offsetWidth);
    const H = (canvas.height = canvas.offsetHeight);

    ctx.clearRect(0, 0, W, H);

    const project = (lat: number, lng: number) => ({
      x: ((lng + 180) / 360) * W,
      y: ((90 - lat) / 180) * H,
    });

    ctx.fillStyle = 'rgba(8,12,25,0.0)';
    ctx.fillRect(0, 0, W, H);

    pulses.forEach((p) => {
      const { x, y } = project(p.lat, p.lng);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
      g.addColorStop(0, 'rgba(249,115,22,0.6)');
      g.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(249,115,22,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [pulses]);

  if (pulses.length === 0) return null;

  return (
    <div style={{ marginTop: 28 }}>
      <p
        style={{
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
          margin: '0 0 10px',
          fontFamily: SITE_FONT_STACK,
        }}
      >
        Esta historia llegó a
      </p>
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(8,12,25,0.60)',
          position: 'relative',
          height: 100,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        <p
          style={{
            position: 'absolute',
            bottom: 6,
            right: 10,
            fontSize: 10,
            color: 'rgba(255,255,255,0.20)',
            margin: 0,
            fontFamily: SITE_FONT_STACK,
          }}
        >
          {pulses.length} {pulses.length === 1 ? 'lugar' : 'lugares'}
        </p>
      </div>
    </div>
  );
}
