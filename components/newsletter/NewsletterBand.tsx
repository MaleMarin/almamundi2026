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
      className="relative z-20 w-full bg-transparent px-6 py-6 md:px-10 md:py-8"
      style={{ fontFamily: SITE_FONT_STACK }}
    >
      <div className="mx-auto w-full max-w-[min(100%,1560px)] rounded-[28px] bg-[#FBFAF8] px-5 py-5 shadow-[0_12px_28px_rgba(120,110,100,0.2)] md:px-8 md:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="min-w-0 lg:max-w-[36rem]">
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#B8340F]">{copy.eyebrow}</p>
            <h2
              id="newsletter-band-title"
              className="mt-1 text-[length:var(--fs-subtitulo)] font-bold leading-snug text-[#4A5568]"
            >
              {copy.title}
            </h2>
            <p className="mt-1 text-[length:var(--fs-pequeno)] font-normal leading-snug text-[#616C7C]">{copy.text}</p>
          </div>
          {sent ? (
            <p className="text-[length:var(--fs-pequeno)] font-semibold leading-snug text-[#4A5568]" role="status">
              {copy.sent}
            </p>
          ) : (
            <form className="w-full lg:max-w-[28rem] lg:shrink-0" onSubmit={onSubmit}>
              <label htmlFor="newsletter-email" className="sr-only">
                {copy.email}
              </label>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={copy.email}
                  className="min-h-11 w-full rounded-full border-2 border-[#8A847C] bg-white px-4 text-[length:var(--fs-pequeno)] text-[#4A5568] outline-none placeholder:text-[#4A5568] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-am-principal inline-flex min-h-11 w-full shrink-0 items-center justify-center px-6 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C] disabled:opacity-60 lg:w-auto"
                >
                  {copy.button}
                </button>
              </div>
              <div className="mt-3 flex items-start gap-3">
                <input
                  id="newsletter-consent"
                  type="checkbox"
                  required
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-[#8A847C] accent-[#FF4A1C] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
                />
                <label htmlFor="newsletter-consent" className="text-[length:var(--fs-etiqueta)] font-normal leading-snug text-[#616C7C]">
                  {copy.consentBefore}
                <a
                  href="/privacidad"
                  className="font-semibold underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF4A1C]"
                  style={{ color: '#B8340F' }}
                >
                    {copy.privacy}
                  </a>
                  {copy.consentAfter}
                </label>
              </div>
              {getTurnstileSiteKey() ? (
                <div className="mt-3 has-[.h-0]:hidden">
                  <TurnstileWidget onTokenChange={setCaptchaToken} onGateChange={() => {}} />
                </div>
              ) : null}
              {error ? (
                <p className="mt-3 text-[length:var(--fs-etiqueta)] font-semibold text-[#B8340F]" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
