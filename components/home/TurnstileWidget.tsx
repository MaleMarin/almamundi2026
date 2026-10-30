'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
      appearance?: 'always' | 'execute' | 'interaction-only';
      'refresh-expired'?: 'auto' | 'manual' | 'never';
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      'timeout-callback'?: () => void;
    }
  ) => string;
  reset: (widgetId?: string) => void;
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
        once: true });
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

export type TurnstileWidgetHandle = {
  reset: () => void;
};

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onTokenChange, onGateChange }, ref) {
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

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current('');
      onGateRef.current('wait');
      setStatus('ready');
      const widgetId = widgetIdRef.current;
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
    } }));

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
        let issued = 0;
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          theme: 'light',
          appearance: 'interaction-only',
          'refresh-expired': 'auto',
          callback: (token: string) => {
            issued += 1;
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
            const atExpiry = issued;
            window.setTimeout(() => {
              if (cancelled || issued !== atExpiry) return;
              onTokenRef.current('');
              onGateRef.current('wait');
              setStatus('ready');
            }, 50);
          },
          'timeout-callback': () => {
            onTokenRef.current('');
            onGateRef.current('degraded');
            setStatus('timeout');
          } });
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
    <div className={status === 'solved' ? 'h-0 overflow-hidden' : 'space-y-1.5'}>
      <div ref={hostRef} />
      {status === 'loading' ? (
        <p className="text-[length:var(--fs-etiqueta)] leading-tight text-[#646E7E] ">
          Cargando verificación de seguridad…
        </p>
      ) : null}
      {status === 'error' || status === 'timeout' ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[length:var(--fs-etiqueta)] leading-tight text-red-600 " role="status">
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
            className="text-[length:var(--fs-etiqueta)] font-bold uppercase text-orange-600 underline tracking-[0.12em]"
          >
            Reintentar
          </button>
        </div>
      ) : null}
    </div>
  );
});
