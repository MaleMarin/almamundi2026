'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TurnstileWidget } from '@/components/home/TurnstileWidget';
import { getTurnstileSiteKey } from '@/lib/turnstile-client';

const REQUEST_OPTIONS = [
  { value: 'confirmar_tratamiento', label: 'Confirmar si tratamos datos personales tuyos.' },
  { value: 'acceder', label: 'Acceder a los datos personales que tenemos sobre ti.' },
  { value: 'corregir', label: 'Corregir datos incompletos, incorrectos o desactualizados.' },
  { value: 'eliminar', label: 'Solicitar la eliminación de tus datos personales.' },
  { value: 'anonimizar_bloquear', label: 'Solicitar la anonimización o bloqueo de datos que ya no sean necesarios.' },
  { value: 'retirar_consentimiento', label: 'Retirar tu consentimiento para el uso de tus datos.' },
  { value: 'informacion_uso', label: 'Solicitar información sobre cómo usamos o compartimos tus datos.' },
  { value: 'limitar_fines', label: 'Solicitar que dejemos de usar tus datos para ciertos fines.' },
  { value: 'otro', label: 'Otro tipo de solicitud.' },
] as const;

const PRIVACY_COUNTRIES = [
  'Chile',
  'México',
  'Argentina',
  'Bolivia',
  'Brasil',
  'Canadá',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'España',
  'Estados Unidos',
  'Francia',
  'Guatemala',
  'Honduras',
  'Italia',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Portugal',
  'Puerto Rico',
  'Reino Unido',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
  'Alemania',
] as const;

const fieldClass =
  'mt-1 w-full rounded-xl border border-gray-300/50 bg-[#FBFAF8] px-3 py-2.5 text-[length:var(--fs-pequeno)] text-gray-900 shadow-[inset_2px_2px_6px_rgba(120,110,100,0.28),inset_-2px_-2px_6px_rgba(255,255,255,0.85)] outline-none focus:ring-2 focus:ring-orange-400/35';

const labelClass = 'block text-[length:var(--fs-pequeno)] font-medium text-gray-700';

export function MisDatosPersonalesForm() {
  const [requestType, setRequestType] = useState<string>(REQUEST_OPTIONS[0].value);
  const [description, setDescription] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<string>(PRIVACY_COUNTRIES[0]);
  const [ownData, setOwnData] = useState<'yes' | 'no' | ''>('');
  const [website, setWebsite] = useState('');
  const [formToken, setFormToken] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const siteKey = getTurnstileSiteKey();

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
        setErrMsg(data.error ?? 'No se pudo enviar. Prueba de nuevo.');
        setStatus('err');
        return;
      }
      setStatus('ok');
    } catch {
      setErrMsg('Error de red. Prueba de nuevo.');
      setStatus('err');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 pb-16" style={{ fontFamily: 'inherit' }}>
      <header className="space-y-3 text-center sm:text-left">
        <p className="text-[length:var(--fs-etiqueta)] font-semibold uppercase text-orange-600 tracking-[0.12em]">Privacidad</p>
        <h1 id="solicitud-datos-personales" className="text-[length:var(--fs-titular)] font-normal text-gray-900 ">
          Solicitud sobre tus datos personales
        </h1>
        <div className="space-y-3 text-[length:var(--fs-pequeno)] leading-relaxed text-gray-600 ">
          <p>
            Puedes usar este formulario para solicitar información o ejercer tus derechos sobre los datos personales
            que hayas compartido con AlmaMundi. Es el mismo canal que describe el{' '}
            <Link href="/privacidad" className="font-semibold text-orange-600 underline underline-offset-2">
              Aviso de Privacidad
            </Link>
            .
          </p>
          <p>
            Atenderemos tu solicitud con cuidado, verificando tu identidad solo cuando sea necesario para proteger tu
            privacidad y evitar accesos no autorizados.
          </p>
        </div>
      </header>

      {status === 'ok' ? (
        <div
          className="rounded-2xl border border-white/60 bg-[#FBFAF8] p-6 text-center text-[length:var(--fs-pequeno)] text-gray-700 shadow-[6px_6px_14px_rgba(120,110,100,0.28),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
          role="status"
        >
          <p className="font-medium text-gray-900">Recibimos tu solicitud.</p>
          <p className="mt-2 leading-relaxed">
            La enviamos al equipo de AlmaMundi. Si necesitamos aclarar algo, te escribiremos al correo que indicaste.
          </p>
          <p className="mt-3 text-[length:var(--fs-etiqueta)] text-[#646E7E]">
            Si el envío automático no estuviera disponible en este momento, puedes escribir a{' '}
            <a href="mailto:hola@almamundi.org" className="font-semibold text-orange-600 underline underline-offset-2">
              hola@almamundi.org
            </a>{' '}
            con la misma información.
          </p>
          <Link
            href="/"
            className="btn-am-neutro mt-6 inline-block px-5 py-2.5 text-[length:var(--fs-pequeno)] font-semibold"
          >
            Volver al inicio
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="relative space-y-8">
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
            <label htmlFor="website">Sitio web</label>
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
                  Tipo de solicitud
                </label>
                <select
                  id="tipo-solicitud"
                  required
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className={fieldClass}
                >
                  {REQUEST_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="descripcion" className={labelClass}>
                  Descripción de la solicitud
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
                  Describe tu solicitud con el mayor detalle posible para poder ayudarte mejor. Puedes indicar qué datos
                  quieres revisar, corregir o eliminar; en qué parte del sitio participaste; si enviaste una historia,
                  fotografía, audio, texto o video; y el correo que usaste al participar.
                </p>
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl border border-white/60 bg-[#FBFAF8] p-6 shadow-[6px_6px_14px_rgba(120,110,100,0.28),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
            aria-labelledby="identificacion"
          >
            <h2 id="identificacion" className="text-[length:var(--fs-pequeno)] font-semibold text-gray-900">
              Identificación de la persona solicitante
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="nombre" className={labelClass}>
                  Nombre completo
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
                  Correo electrónico
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
                  Teléfono o medio de contacto alternativo <span className="font-normal text-[#646E7E]">(opcional)</span>
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
                  País
                </label>
                <select
                  id="pais"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={fieldClass}
                  autoComplete="country-name"
                >
                  {PRIVACY_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className={`${labelClass} mb-2`}>
                  ¿Haces esta solicitud sobre tus propios datos?
                </legend>
                <div className="flex flex-wrap gap-4 text-[length:var(--fs-pequeno)] text-gray-800">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="radio" name="ownData" value="yes" checked={ownData === 'yes'} onChange={() => setOwnData('yes')} required className="h-4 w-4 accent-orange-600" />
                    Sí
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="radio" name="ownData" value="no" checked={ownData === 'no'} onChange={() => setOwnData('no')} className="h-4 w-4 accent-orange-600" />
                    No
                  </label>
                </div>
              </fieldset>
              {ownData === 'no' ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[length:var(--fs-etiqueta)] leading-relaxed text-amber-950">
                  Si actúas en representación de otra persona, podremos pedir información adicional para verificar que
                  tienes autorización.
                </p>
              ) : null}
            </div>
          </section>

          <section
            className="rounded-2xl border border-white/60 bg-[#FBFAF8] p-6 shadow-[6px_6px_14px_rgba(120,110,100,0.28),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
            aria-labelledby="verificacion"
          >
            <h2 id="verificacion" className="text-[length:var(--fs-pequeno)] font-semibold text-gray-900">
              Verificación de identidad
            </h2>
            <p className="mt-3 text-[length:var(--fs-pequeno)] leading-relaxed text-gray-600">
              Para proteger tu privacidad, es posible que solicitemos una verificación mínima de identidad antes de
              responder ciertas solicitudes.
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
              Al enviar esta solicitud, confirmas que la información entregada es correcta y que AlmaMundi puede
              contactarte para gestionar tu requerimiento.
            </p>
            <p>
              Usaremos estos datos solo para responder a tu solicitud y proteger tus derechos de privacidad.
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
              {status === 'sending' ? 'Enviando…' : 'Enviar solicitud'}
            </button>
            <Link href="/privacidad" className="inline-flex justify-center rounded-full border border-gray-400/50 px-6 py-3 text-center text-[length:var(--fs-pequeno)] font-semibold text-gray-800 hover:bg-white/50">
              Aviso de privacidad
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
