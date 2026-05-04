'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SITE_FONT_STACK } from '@/lib/typography';

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

const fieldClass =
  'mt-1 w-full rounded-xl border border-gray-300/50 bg-[#f0f2f7] px-3 py-2.5 text-sm text-gray-900 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.35),inset_-2px_-2px_6px_rgba(255,255,255,0.85)] outline-none focus:ring-2 focus:ring-orange-400/35';

const labelClass = 'block text-sm font-medium text-gray-700';

export function MisDatosPersonalesForm() {
  const [requestType, setRequestType] = useState<string>(REQUEST_OPTIONS[0].value);
  const [description, setDescription] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [ownData, setOwnData] = useState<'yes' | 'no' | ''>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');

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
          country: country.trim() || undefined,
          ownData,
        }),
      });
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
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 pb-16" style={{ fontFamily: SITE_FONT_STACK }}>
      <header className="space-y-3 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Privacidad</p>
        <h1 id="solicitud-datos-personales" className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
          Solicitud sobre tus datos personales
        </h1>
        <div className="space-y-3 text-sm leading-relaxed text-gray-600 md:text-[0.9375rem]">
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
          className="rounded-2xl border border-white/60 bg-[#eceff4] p-6 text-center text-sm text-gray-700 shadow-[6px_6px_14px_rgba(163,177,198,0.35),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
          role="status"
        >
          <p className="font-medium text-gray-900">Recibimos tu solicitud.</p>
          <p className="mt-2 leading-relaxed">
            La enviamos al equipo de AlmaMundi. Si necesitamos aclarar algo, te escribiremos al correo que indicaste.
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Si el envío automático no estuviera disponible en este momento, puedes escribir a{' '}
            <a href="mailto:hola@almamundi.org" className="font-semibold text-orange-600 underline underline-offset-2">
              hola@almamundi.org
            </a>{' '}
            con la misma información.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full border border-gray-400/40 bg-[#e4e7ee] px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-[#dde1ea]"
          >
            Volver al inicio
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-8">
          <section
            className="rounded-2xl border border-white/60 bg-[#eceff4] p-6 shadow-[6px_6px_14px_rgba(163,177,198,0.35),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
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
                  minLength={10}
                  maxLength={12000}
                  rows={7}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={fieldClass}
                  placeholder=""
                />
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Describe tu solicitud con el mayor detalle posible para poder ayudarte mejor. Puedes indicar qué datos
                  quieres revisar, corregir o eliminar; en qué parte del sitio participaste; si enviaste una historia,
                  fotografía, audio, texto o video; y el correo que usaste al participar.
                </p>
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl border border-white/60 bg-[#eceff4] p-6 shadow-[6px_6px_14px_rgba(163,177,198,0.35),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
            aria-labelledby="identificacion"
          >
            <h2 id="identificacion" className="text-base font-semibold text-gray-900">
              Identificación de la persona solicitante
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="nombre" className={labelClass}>
                  Nombre completo
                </label>
                <input id="nombre" required minLength={2} maxLength={200} value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldClass} autoComplete="name" />
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
                  Teléfono o medio de contacto alternativo <span className="font-normal text-gray-500">(opcional)</span>
                </label>
                <input id="telefono" type="text" maxLength={120} value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="pais" className={labelClass}>
                  País <span className="font-normal text-gray-500">(opcional)</span>
                </label>
                <input id="pais" type="text" maxLength={120} value={country} onChange={(e) => setCountry(e.target.value)} className={fieldClass} autoComplete="country-name" />
              </div>
              <fieldset>
                <legend className={`${labelClass} mb-2`}>
                  ¿Haces esta solicitud sobre tus propios datos?
                </legend>
                <div className="flex flex-wrap gap-4 text-sm text-gray-800">
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
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
                  Si actúas en representación de otra persona, podremos pedir información adicional para verificar que
                  tienes autorización.
                </p>
              ) : null}
            </div>
          </section>

          <section
            className="rounded-2xl border border-white/60 bg-[#eceff4] p-6 shadow-[6px_6px_14px_rgba(163,177,198,0.35),-4px_-4px_12px_rgba(255,255,255,0.9)] md:p-8"
            aria-labelledby="verificacion"
          >
            <h2 id="verificacion" className="text-base font-semibold text-gray-900">
              Verificación de identidad
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Para proteger tu privacidad, es posible que solicitemos una verificación mínima de identidad antes de
              responder ciertas solicitudes.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              No envíes documentos sensibles salvo que te los pidamos expresamente. Si fuera necesario confirmar tu
              identidad, te indicaremos qué información enviar y cómo hacerlo de forma segura.
            </p>
          </section>

          <div className="space-y-3 rounded-2xl border border-gray-300/40 bg-[#e8ebf2]/90 p-5 text-xs leading-relaxed text-gray-600 md:text-sm">
            <p>
              Al enviar esta solicitud, confirmas que la información entregada es correcta y que AlmaMundi puede
              contactarte para gestionar tu requerimiento.
            </p>
            <p>
              Usaremos estos datos solo para responder a tu solicitud y proteger tus derechos de privacidad.
            </p>
          </div>

          {errMsg ? (
            <p className="text-sm font-medium text-red-700" role="alert">
              {errMsg}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="submit"
              disabled={status === 'sending' || ownData === ''}
              className="rounded-full bg-[#ff6b2b] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar solicitud'}
            </button>
            <Link href="/privacidad" className="inline-flex justify-center rounded-full border border-gray-400/50 px-6 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-white/50">
              Aviso de privacidad
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
