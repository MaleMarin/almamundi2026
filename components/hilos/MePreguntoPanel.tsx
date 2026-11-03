'use client';

import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Camera, Mic, PenLine } from 'lucide-react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/home/TurnstileWidget';
import { PreguntaFormForQuestion } from '@/components/pregunta/PreguntaForm';
import { HILOS_UI } from '@/lib/i18n/hilos-messages';
import { ME_PREGUNTO_UI } from '@/lib/i18n/me-pregunto';
import { formatPublicPlace } from '@/lib/historias/story-ubicacion';
import { ME_PREGUNTA_MAX, type MePreguntaPublica } from '@/lib/me-pregunto/shared';
import type { PreguntaSemana } from '@/lib/pregunta-semana';
import { getTurnstileSiteKey, type TurnstileGate } from '@/lib/turnstile-client';
import { isValidRecipientEmail } from '@/lib/email-html';
import type { AlmaLocale } from '@/lib/i18n/locale';

type Formato = 'texto' | 'voz' | 'foto';

const campo =
  'cortina-campo min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[length:var(--fs-texto)] font-normal text-[#1C1C2E]';

function comoFormulario(p: MePreguntaPublica, locale: AlmaLocale): PreguntaSemana {
  const texto = { es: p.texto, pt: p.texto, en: p.texto };
  const tema = { es: ME_PREGUNTO_UI.es.capa, pt: ME_PREGUNTO_UI.pt.capa, en: ME_PREGUNTO_UI.en.capa };
  void locale;
  return { id: p.id as PreguntaSemana['id'], tema, tu: texto, alguien: texto };
}

/** Panel de la cinta «Me pregunto…»: preguntas de la gente y formulario para dejar una. */
export function MePreguntoPanel({
  locale,
  initialPregunta = null,
  onClose,
  onEnviada,
}: {
  locale: AlmaLocale;
  initialPregunta?: string | null;
  onClose: () => void;
  onEnviada?: (enviada: boolean) => void;
}) {
  const copy = ME_PREGUNTO_UI[locale];
  const [enviada, setEnviada] = useState(false);
  // Al cerrar el panel, el título vuelve a mostrarse la próxima vez.
  const onEnviadaRef = useRef(onEnviada);
  useEffect(() => {
    onEnviadaRef.current = onEnviada;
  });
  useEffect(() => () => onEnviadaRef.current?.(false), []);
  const hilos = HILOS_UI[locale];
  const [items, setItems] = useState<MePreguntaPublica[] | null>(null);
  const [abiertaId, setAbiertaId] = useState<string | null>(initialPregunta);
  const [formato, setFormato] = useState<Formato | null>(null);
  const [dejando, setDejando] = useState(false);

  useEffect(() => {
    let cancel = false;
    void fetch('/api/me-pregunto')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: MePreguntaPublica[] }) => {
        if (!cancel) setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancel) setItems([]);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const abierta = items?.find((item) => item.id === abiertaId) ?? null;

  return (
    <>
      {enviada ? null : <p className="cortina-indice-ayuda">{copy.bajada}</p>}
      {dejando ? (
        <DejarPregunta
          locale={locale}
          onCancel={() => setDejando(false)}
          onSent={() => {
            setEnviada(true);
            onEnviada?.(true);
          }}
        />
      ) : (
        <button type="button" className="cortina-formato me-pregunto-dejar" onClick={() => setDejando(true)}>
          <PenLine size={20} strokeWidth={1.75} aria-hidden />
          {copy.dejar}
        </button>
      )}
      {items && items.length === 0 && !dejando ? <p className="cortina-indice-ayuda">{copy.vacio}</p> : null}
      <ul className="cortina-indice">
        {(items ?? []).map((pregunta) => {
          const open = pregunta.id === abiertaId;
          const lugar = formatPublicPlace(pregunta.city, pregunta.country, locale);
          return (
            <li key={pregunta.id}>
              <button
                type="button"
                className="cortina-indice-pregunta"
                aria-expanded={open}
                onClick={() => {
                  setFormato(null);
                  setAbiertaId((actual) => (actual === pregunta.id ? null : pregunta.id));
                }}
              >
                {pregunta.texto}
                <span className="me-pregunto-autor">{copy.loPregunta(pregunta.alias, lugar)}</span>
              </button>
              {open && abierta ? (
                <div className="cortina-indice-respuesta">
                  {formato ? (
                    <PreguntaFormForQuestion pregunta={comoFormulario(abierta, locale)} formato={formato} onAnother={onClose} />
                  ) : (
                    <div className="cortina-formatos">
                      <button type="button" className="cortina-formato" onClick={() => setFormato('texto')}>
                        <PenLine size={20} strokeWidth={1.75} aria-hidden />
                        {hilos.escribir}
                      </button>
                      <button type="button" className="cortina-formato" onClick={() => setFormato('voz')}>
                        <Mic size={20} strokeWidth={1.75} aria-hidden />
                        {hilos.contarVoz}
                      </button>
                      <button type="button" className="cortina-formato" onClick={() => setFormato('foto')}>
                        <Camera size={20} strokeWidth={1.75} aria-hidden />
                        {hilos.conFoto}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function DejarPregunta({ locale, onCancel, onSent }: { locale: AlmaLocale; onCancel: () => void; onSent?: () => void }) {
  const { t } = useHomeLocale();
  const copy = ME_PREGUNTO_UI[locale];
  const [texto, setTexto] = useState('');
  const [alias, setAlias] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [adult, setAdult] = useState(false);
  const [publish, setPublish] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sentAlias, setSentAlias] = useState<string | null>(null);
  const [captchaGate, setCaptchaGate] = useState<TurnstileGate>(getTurnstileSiteKey() ? 'wait' : 'skip');
  const tokenRef = useRef('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    setError('');
    const pregunta = texto.trim();
    if (pregunta.length < 8) return setError(copy.errores.question_required);
    if (alias.trim().length < 2) return setError(copy.errores.alias_required);
    if (country.trim().length < 2) return setError(copy.errores.country_required);
    if (!city.trim()) return setError(copy.errores.city_required);
    if (email.trim() && !isValidRecipientEmail(email.trim())) return setError(copy.errores.email_required);
    if (!adult || !publish || !terms) return setError(copy.errores.consent_required);
    if (captchaGate === 'need' || captchaGate === 'wait') return setError(copy.errores.captcha_required);
    setSaving(true);
    try {
      const res = await fetch('/api/me-pregunto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: pregunta,
          alias: alias.trim(),
          country: country.trim(),
          city: city.trim(),
          email: email.trim(),
          consentAdult: adult,
          consentPublicacion: publish,
          consentTerminos: terms,
          consentPrivacyPolicy: terms,
          captchaToken: tokenRef.current || undefined,
          locale,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.status === 429) throw new Error('rate_limited');
      if (!res.ok || !data.ok) throw new Error(data.error || 'send_failed');
      setSentAlias(alias.trim());
      onSent?.();
    } catch (err) {
      const code = err instanceof Error ? err.message : 'send_failed';
      setError(copy.errores[code] ?? copy.errores.send_failed);
      tokenRef.current = '';
      turnstileRef.current?.reset();
      setCaptchaGate(getTurnstileSiteKey() ? 'wait' : 'skip');
    } finally {
      setSaving(false);
    }
  }

  if (sentAlias) {
    const nombre = sentAlias.charAt(0).toUpperCase() + sentAlias.slice(1);
    return (
      <div className="me-pregunto-gracias" role="status">
        <h3>{copy.gracias(nombre)}</h3>
        <p>{copy.graciasTexto}</p>
        <div className="cortina-formatos">
          <HomeHardLink className="cortina-formato" href="/#historias">{t.navTellStory}</HomeHardLink>
          <HomeHardLink className="cortina-formato" href="/#cintas">{HILOS_UI[locale].nav}</HomeHardLink>
          <HomeHardLink className="cortina-formato" href="/?capa=me-pregunto#mapa">{t.modalBackToMap}</HomeHardLink>
        </div>
      </div>
    );
  }

  const termsBits = t.modalConsentTermsAndPrivacy.split('{terminos}');
  const afterTerms = (termsBits[1] ?? '').split('{privacidad}');

  return (
    <form noValidate onSubmit={(event) => void enviar(event)} className="cortina-form me-pregunto-form flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-[length:var(--fs-pequeno)] font-semibold">
        {copy.campo}
        <textarea
          value={texto}
          maxLength={ME_PREGUNTA_MAX}
          rows={3}
          onChange={(event) => setTexto(event.target.value)}
          className={campo}
        />
        <span className="text-[length:var(--fs-etiqueta)] font-normal leading-snug">
          {copy.ayuda} ({texto.length}/{ME_PREGUNTA_MAX})
        </span>
      </label>
      <label className="flex flex-col gap-1 text-[length:var(--fs-pequeno)] font-semibold">
        {copy.alias}
        <input value={alias} onChange={(event) => setAlias(event.target.value)} autoComplete="nickname" className={campo} />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[length:var(--fs-pequeno)] font-semibold">
          {copy.pais}
          <input value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country-name" className={campo} />
        </label>
        <label className="flex flex-col gap-1 text-[length:var(--fs-pequeno)] font-semibold">
          {copy.ciudad}
          <input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" className={campo} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[length:var(--fs-pequeno)] font-semibold">
        {copy.correo}
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className={campo} />
        <span className="text-[length:var(--fs-etiqueta)] font-normal leading-snug">{copy.correoAyuda}</span>
      </label>
      <div className="flex flex-col gap-2 text-[length:var(--fs-pequeno)]">
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} className="mt-1" />
          <span>{copy.consentAdulto}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} className="mt-1" />
          <span>{copy.consentPublicar}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-1" />
          <span>
            {termsBits[0]}
            <a className="underline" href="/terminos" target="_blank" rel="noopener noreferrer">
              {t.modalConsentTermsLink}
            </a>
            {afterTerms[0]}
            <a className="underline" href="/privacidad" target="_blank" rel="noopener noreferrer">
              {t.modalConsentPrivacyLink}
            </a>
            {afterTerms[1] ?? ''}
          </span>
        </label>
      </div>
      <TurnstileWidget
        ref={turnstileRef}
        onTokenChange={(token) => {
          tokenRef.current = token;
        }}
        onGateChange={setCaptchaGate}
      />
      {error ? (
        <p className="m-0 text-[length:var(--fs-pequeno)] font-semibold" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={saving} className="cortina-formato me-pregunto-enviar disabled:opacity-60">
          {saving ? copy.enviando : copy.enviar}
        </button>
        <button type="button" className="cortina-formato" onClick={onCancel}>
          {copy.cancelar}
        </button>
      </div>
    </form>
  );
}
