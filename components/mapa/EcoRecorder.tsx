'use client';

import { useRef, useState } from 'react';

export function EcoRecorder({
  storyId,
  onDone,
}: {
  storyId: string;
  onDone: () => void;
}) {
  const [state, setState] = useState<'idle' | 'recording' | 'done' | 'sending'>('idle');
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recRef.current?.stop();
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setState('sending');

        const fd = new FormData();
        fd.append('audio', new File([blob], 'eco.webm', { type: 'audio/webm' }));
        fd.append('storyId', storyId);

        try {
          await fetch('/api/stories/eco', { method: 'POST', body: fd });
        } catch {}

        setState('done');
        setTimeout(onDone, 1500);
      };

      rec.start();
      setState('recording');
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s >= 9) {
            stop();
            return 10;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      // Sin permiso de micrófono
    }
  };

  if (state === 'done') {
    return (
      <p
        style={{
          fontSize: 13,
          color: 'rgba(249,115,22,0.80)',
          margin: 0,
          fontFamily: "'Avenir Light', Avenir, sans-serif",
        }}
      >
        Eco enviado. Gracias.
      </p>
    );
  }

  if (state === 'sending') {
    return (
      <p
        style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.40)',
          margin: 0,
          fontFamily: "'Avenir Light', Avenir, sans-serif",
        }}
      >
        Enviando...
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <button
        type="button"
        onClick={state === 'idle' ? start : stop}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background:
            state === 'recording' ? 'rgba(239,68,68,0.20)' : 'rgba(249,115,22,0.15)',
          border: `1px solid ${
            state === 'recording' ? 'rgba(239,68,68,0.50)' : 'rgba(249,115,22,0.35)'
          }`,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 200ms ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: state === 'recording' ? 'noticiaPulse 1s ease infinite' : 'none',
        }}
      >
        <div
          style={{
            width: state === 'recording' ? 14 : 18,
            height: state === 'recording' ? 14 : 18,
            borderRadius: state === 'recording' ? 3 : '50%',
            background: state === 'recording' ? '#ef4444' : '#f97316',
            transition: 'all 200ms ease',
          }}
        />
      </button>

      {state === 'recording' && (
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 3,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 999,
                background: '#ef4444',
                width: `${(seconds / 10) * 100}%`,
                transition: 'width 1s linear',
              }}
            />
          </div>
          <p
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.35)',
              margin: '4px 0 0',
              fontFamily: "'Avenir Light', Avenir, sans-serif",
            }}
          >
            {10 - seconds}s restantes · toca para terminar
          </p>
        </div>
      )}

      {state === 'idle' && (
        <p
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.35)',
            margin: 0,
            fontFamily: "'Avenir Light', Avenir, sans-serif",
          }}
        >
          Toca para grabar
        </p>
      )}
    </div>
  );
}
