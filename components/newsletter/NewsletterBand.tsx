'use client';

import { useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { TurnstileWidget } from '@/components/home/TurnstileWidget';
import { getTurnstileSiteKey } from '@/lib/turnstile-client';
import { newsletterBandCopy } from '@/lib/newsletter/copy';
import { SITE_FONT_STACK } from '@/lib/typography';

const RESERVED = new Set(['videos', 'audios', 'escrito', 'fotos', 'mi-coleccion']);

function showsBand(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (path === '/' || path === '/historias') return true;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'historias' || parts.length < 2) return false;
  return !RESERVED.has(parts[1] ?? '');
}

export function NewsletterBand() {
  const pathname = usePathname() || '/';
  const { locale } = useHomeLocale();
  const copy = newsletterBandCopy(locale);
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!showsBand(pathname)) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (sending || sent) return;
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError(copy.emailInvalid);
      return;
    }
    if (!accepted) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          locale,
          origin: 'franja',
          ...(captchaToken ? { captchaToken } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 429 || data.error === 'limit') setError(copy.limit);
        else if (data.error === 'verify') setError(copy.verify);
        else if (data.error === 'email' || data.error === 'invalid') setError(copy.emailInvalid);
        else setError(copy.send);
        return;
      }
      setSent(true);
    } catch {
      setError(copy.send);
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      aria-labelledby="newsletter-band-title"
      className="relative z-20 w-full bg-[#050811] px-6 py-16 text-[#F7F8FC] md:py-20"
      style={{ fontFamily: SITE_FONT_STACK }}
    >
      <div className="mx-auto w-full max-w-xl">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF4A1C]">{copy.eyebrow}</p>
        <h2 id="newsletter-band-title" className="mt-3 text-[length:var(--fs-subtitulo)] font-semibold leading-snug">
          {copy.title}
        </h2>
        <p className="mt-3 text-[length:var(--fs-pequeno)] font-normal leading-relaxed text-[#F7F8FC]">{copy.text}</p>
        {sent ? (
          <p className="mt-6 text-[length:var(--fs-pequeno)] font-semibold leading-relaxed" role="status">
            {copy.sent}
          </p>
        ) : (
          <form className="mt-6" onSubmit={onSubmit}>
            <label htmlFor="newsletter-email" className="mb-2 block text-[length:var(--fs-etiqueta)] font-semibold">
              {copy.email}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                id="newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.email}
                className="min-h-11 w-full rounded-full bg-[#F7F8FC] px-4 text-[length:var(--fs-pequeno)] text-[#1C1C2E] outline-none placeholder:text-[#4A5568] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
              />
              <button
                type="submit"
                disabled={sending}
                className="btn-am-principal inline-flex min-h-11 shrink-0 items-center justify-center px-6 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C] disabled:opacity-60"
              >
                {copy.button}
              </button>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <input
                id="newsletter-consent"
                type="checkbox"
                required
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#FF4A1C] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
              />
              <label htmlFor="newsletter-consent" className="text-[length:var(--fs-etiqueta)] font-normal leading-snug">
                {copy.consentBefore}
                <a
                  href="/privacidad"
                  className="font-semibold text-[#FF4A1C] underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
                >
                  {copy.privacy}
                </a>
                {copy.consentAfter}
              </label>
            </div>
            {getTurnstileSiteKey() ? (
              <div className="mt-3 rounded-xl bg-[#F7F8FC] px-3 py-2 text-[#1C1C2E] has-[.h-0]:hidden">
                <TurnstileWidget onTokenChange={setCaptchaToken} onGateChange={() => {}} />
              </div>
            ) : null}
            {error ? (
              <p className="mt-3 text-[length:var(--fs-etiqueta)] font-semibold text-[#FFB4A8]" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
