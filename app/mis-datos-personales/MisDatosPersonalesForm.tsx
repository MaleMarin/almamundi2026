'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TurnstileWidget } from '@/components/home/TurnstileWidget';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { LEGAL_CHROME } from '@/lib/i18n/legal-documents';
import { opcionesDePais } from '@/lib/i18n/paises';
import { MIS_DATOS } from '@/lib/i18n/mis-datos-messages';
import { getTurnstileSiteKey } from '@/lib/turnstile-client';

const fieldClass =
  'mt-1 w-full rounded-xl border border-gray-300/50 bg-[#FBFAF8] px-3 py-2.5 text-[length:var(--fs-pequeno)] text-gray-900 shadow-[inset_2px_2px_6px_rgba(120,110,100,0.28),inset_-2px_-2px_6px_rgba(255,255,255,0.85)] outline-none focus:ring-2 focus:ring-orange-400/35';

const labelClass = 'block text-[length:var(--fs-pequeno)] font-medium text-gray-700';

export function MisDatosPersonalesForm() {
  const { locale } = useHomeLocale();
  const copy = MIS_DATOS[locale];
  const paises = useMemo(() => opcionesDePais(locale), [locale]);
  const [requestType, setRequestType] = useState<string>(copy.opciones[0].value);
  const [description, setDescription] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<string>('');
  const [ownData, setOwnData] = useState<'yes' | 'no' | ''>('');
  const [website, setWebsite] = useState('');
  const [formToken, setFormToken] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const siteKey = getTurnstileSiteKey();

  useEffect(() => {
    setCountry((actual) => actual || paises[0]?.value || 'Otro');
  }, [paises]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/privacy-data-request', { method: 'GET' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { token?: string } | null) => {
        if (!cancelled && data?.token) setFormToken(data.token);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg('');
    setStatus('sending');
    try {
      const res = await fetch('/api/privacy-data-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          description,
          fullName,
          email,
          phone: phone.trim() || undefined,
          country,
          ownData,
          website,
          formToken,
          turnstileToken }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErrMsg(data.error ?? copy.errorEnvio);
        setStatus('err');
        return;
      }
      setStatus('ok');
    } catch {
      setErrMsg(copy.errorRed);
      setStatus('err');
    }
  }

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-8 px-6 py-10 pb-16" style={{ fontFamily: 'inherit' }}>
      <Link href="/" className="text-[length:var(--fs-pequeno)] font-medium text-[#3c4655]">
        {LEGAL_CHROME[locale].back}
      </Link>
      <header className="space-y-3 text-left">
        <p className="text-[length:var(--fs-etiqueta)] font-semibold uppercase text-orange-600 tracking-[0.12em]">{copy.kicker}</p>
        <h1 id="solicitud-datos-personales" className="text-[length:var(--fs-titular)] font-normal text-gray-900 ">
          {copy.title}
        </h1>
        <div className="space-y-3 text-[length:var(--fs-pequeno)] leading-relaxed text-gray-600 ">
          <p>
            {copy.intro}{' '}
            <Link href="/privacidad" className="font-semibold text-orange-600 underline underline-offset-2">
              {copy.introLink}
            </Link>
            .
          </p>
          <p>{copy.cuidado}</p>
        </div>
      </header>

      {status === 'ok' ? (
        <div
          className="rounded-2xl border border-white/60 bg-[#FBFAF8] p-6 text-center text-[length:var(--fs-pequeno)] text-gray-700 shadow-[6px_6px_14px_rgba(120,110,100,0.28),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
          role="status"
        >
          <p className="font-medium text-gray-900">{copy.okTitle}</p>
          <p className="mt-2 leading-relaxed">{copy.okBody}</p>
          <p className="mt-3 text-[length:var(--fs-etiqueta)] text-[#646E7E]">
            {copy.okMail}{' '}
            <a href="mailto:hola@almamundi.org" className="font-semibold text-orange-600 underline underline-offset-2">
              hola@almamundi.org
            </a>{' '}
            con la misma información.
          </p>
          <Link
            href="/"
            className="btn-am-neutro mt-6 inline-block px-5 py-2.5 text-[length:var(--fs-pequeno)] font-semibold"
          >
            {copy.back}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="relative space-y-8">
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
            <label htmlFor="website">{copy.honeypot}</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <section
            className="rounded-2xl border border-white/60 bg-[#FBFAF8] p-6 shadow-[6px_6px_14px_rgba(120,110,100,0.28),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
            aria-labelledby="campos-solicitud"
          >
            <h2 id="campos-solicitud" className="sr-only">
              Detalle de la solicitud
            </h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="tipo-solicitud" className={labelClass}>
                  {copy.tipo}
                </label>
                <select
                  id="tipo-solicitud"
                  required
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className={fieldClass}
                >
                  {copy.opciones.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="descripcion" className={labelClass}>
                  {copy.descripcion}
                </label>
                <textarea
                  id="descripcion"
                  required
                  minLength={1}
                  maxLength={2000}
                  rows={7}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={fieldClass}
                  placeholder=""
                />
                <p className="mt-2 text-[length:var(--fs-etiqueta)] leading-relaxed text-[#646E7E]">
                  {copy.ayuda}
                </p>
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl border border-white/60 bg-[#FBFAF8] p-6 shadow-[6px_6px_14px_rgba(120,110,100,0.28),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
            aria-labelledby="identificacion"
          >
            <h2 id="identificacion" className="text-[length:var(--fs-pequeno)] font-semibold text-gray-900">
              {copy.identificacion}
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="nombre" className={labelClass}>
                  {copy.nombre}
                </label>
                <input
                  id="nombre"
                  required
                  minLength={2}
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={fieldClass}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="correo" className={labelClass}>
                  {copy.correo}
                </label>
                <input
                  id="correo"
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="telefono" className={labelClass}>
                  {copy.telefono} <span className="font-normal text-[#646E7E]">{copy.opcional}</span>
                </label>
                <input
                  id="telefono"
                  type="tel"
                  inputMode="numeric"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldClass}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label htmlFor="pais" className={labelClass}>
                  {copy.pais}
                </label>
                <select
                  id="pais"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={fieldClass}
                  autoComplete="country-name"
                >
                  {paises.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className={`${labelClass} mb-2`}>
                  {copy.propios}
                </legend>
                <div className="flex flex-wrap gap-4 text-[length:var(--fs-pequeno)] text-gray-800">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="radio" name="ownData" value="yes" checked={ownData === 'yes'} onChange={() => setOwnData('yes')} required className="h-4 w-4 accent-orange-600" />
                    {copy.si}
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="radio" name="ownData" value="no" checked={ownData === 'no'} onChange={() => setOwnData('no')} className="h-4 w-4 accent-orange-600" />
                    {copy.no}
                  </label>
                </div>
              </fieldset>
              {ownData === 'no' ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[length:var(--fs-etiqueta)] leading-relaxed text-amber-950">
                  {copy.representacion}
                </p>
              ) : null}
            </div>
          </section>

          <section
            className="rounded-2xl border border-white/60 bg-[#FBFAF8] p-6 shadow-[6px_6px_14px_rgba(120,110,100,0.28),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
            aria-labelledby="verificacion"
          >
            <h2 id="verificacion" className="text-[length:var(--fs-pequeno)] font-semibold text-gray-900">
              {copy.verificacion}
            </h2>
            <p className="mt-3 text-[length:var(--fs-pequeno)] leading-relaxed text-gray-600">
              {copy.verificacionCuerpo}
            </p>
            {siteKey ? (
              <div className="mt-4">
                <TurnstileWidget
                  onTokenChange={setTurnstileToken}
                  onGateChange={() => {}}
                />
              </div>
            ) : null}
          </section>

          <div className="space-y-3 rounded-2xl border border-gray-300/40 bg-[#FBFAF8]/90 p-5 text-[length:var(--fs-pequeno)] leading-relaxed text-gray-600 ">
            <p>
              {copy.confirma}
            </p>
            <p>
              {copy.uso}
            </p>
          </div>

          {errMsg ? (
            <p className="text-[length:var(--fs-pequeno)] font-medium text-red-700" role="alert">
              {errMsg}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="submit"
              disabled={status === 'sending' || ownData === '' || !formToken}
              className="btn-am-principal px-8 py-3 text-[length:var(--fs-pequeno)] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'sending' ? copy.enviando : copy.enviar}
            </button>
            <Link href="/privacidad" className="inline-flex justify-center rounded-full border border-gray-400/50 px-6 py-3 text-center text-[length:var(--fs-pequeno)] font-semibold text-gray-800 hover:bg-white/50">
              {copy.aviso}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
