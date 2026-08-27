'use client';

import { useEffect, useRef, useState } from 'react';
import { getTurnstileSiteKey, type TurnstileGate } from '@/lib/turnstile-client';

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_ID = 'cf-turnstile-script';
const LOAD_TIMEOUT_MS = 12_000;

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: 'light' | 'dark' | 'auto';
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      'timeout-callback'?: () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.turnstile) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('script_error')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('script_error'));
    document.head.appendChild(script);
  });
}

export type TurnstileWidgetProps = {
  onTokenChange: (token: string) => void;
  onGateChange: (gate: TurnstileGate) => void;
};

export function TurnstileWidget({ onTokenChange, onGateChange }: TurnstileWidgetProps) {
  const siteKey = getTurnstileSiteKey();
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onTokenChange);
  const onGateRef = useRef(onGateChange);
  onTokenRef.current = onTokenChange;
  onGateRef.current = onGateChange;

  const [status, setStatus] = useState<'loading' | 'ready' | 'solved' | 'error' | 'timeout'>(
    'loading'
  );
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!siteKey) {
      onTokenRef.current('');
      onGateRef.current('skip');
      return;
    }

    onTokenRef.current('');
    onGateRef.current('wait');
    setStatus('loading');

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setStatus((prev) => {
        if (prev === 'solved' || prev === 'ready') return prev;
        onGateRef.current('degraded');
        return 'timeout';
      });
    }, LOAD_TIMEOUT_MS);

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          theme: 'light',
          callback: (token: string) => {
            onTokenRef.current(token);
            onGateRef.current('ok');
            setStatus('solved');
          },
          'error-callback': () => {
            onTokenRef.current('');
            onGateRef.current('degraded');
            setStatus('error');
          },
          'expired-callback': () => {
            onTokenRef.current('');
            onGateRef.current('need');
            setStatus('ready');
          },
          'timeout-callback': () => {
            onTokenRef.current('');
            onGateRef.current('degraded');
            setStatus('timeout');
          },
        });
        onGateRef.current('need');
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        onTokenRef.current('');
        onGateRef.current('degraded');
        setStatus('error');
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, retryKey]);

  if (!siteKey) return null;

  return (
    <div className="space-y-1.5">
      <div ref={hostRef} className="min-h-[65px]" />
      {status === 'loading' ? (
        <p className="text-[10px] leading-tight text-gray-500 md:text-[11px]">
          Cargando verificación de seguridad…
        </p>
      ) : null}
      {status === 'error' || status === 'timeout' ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] leading-tight text-red-600 md:text-[11px]" role="status">
            {status === 'timeout'
              ? 'La verificación tardó demasiado. Puedes reintentar o enviar; si el servidor la exige, te avisará.'
              : 'No se pudo cargar la verificación. Reintenta; el envío no queda bloqueado.'}
          </p>
          <button
            type="button"
            onClick={() => {
              onTokenRef.current('');
              onGateRef.current('wait');
              setRetryKey((k) => k + 1);
            }}
            className="text-[10px] font-bold uppercase tracking-wide text-orange-600 underline md:text-[11px]"
          >
            Reintentar
          </button>
        </div>
      ) : null}
    </div>
  );
}
