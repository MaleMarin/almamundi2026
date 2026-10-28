'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Image as ImageIcon, Mic, PenLine } from 'lucide-react';
import { useHomeLocale } from '@/components/i18n/LocaleProvider';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/home/TurnstileWidget';
import { PREGUNTA_COPY, preguntaShareText, preguntaThanks } from '@/lib/i18n/pregunta-messages';
import { probeAudioFileDurationSeconds } from '@/lib/media-duration-rules';
import {
  isQuestionMode,
  preguntaPageHref,
  preguntaPorId,
  preguntasDeLaSemana,
  resolveQuestionId,
  type PreguntaSemana,
  type QuestionMode,
} from '@/lib/pregunta-semana';
import {
  RESPUESTA_CAPTION_MAX,
  RESPUESTA_PHOTO_MAX_BYTES,
  RESPUESTA_TEXT_MAX,
  RESPUESTA_VOICE_MAX_BYTES,
  RESPUESTA_VOICE_MAX_SECONDS,
} from '@/lib/respuestas/constants';
import { getTurnstileSiteKey, type TurnstileGate } from '@/lib/turnstile-client';

type Kind = 'texto' | 'voz' | 'foto';

const fieldClass =
  'w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-base text-[#1C1C2E] outline-none focus:border-[#D13D17]';

function pickClass(on: boolean): string {
  return on
    ? 'border-2 border-[#D13D17] bg-transparent text-[#D13D17]'
    : 'border-2 border-black/15 bg-transparent text-[#1C1C2E]';
}

function mmss(seconds: number): string {
  const s = Math.min(RESPUESTA_VOICE_MAX_SECONDS, Math.max(0, Math.floor(seconds)));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function uploadMedia(
  file: File,
  kind: 'voz' | 'foto',
  token: string,
  onProgress: (value: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/respuestas/media');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let data: { storagePath?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText) as { storagePath?: string; error?: string };
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.storagePath) {
        onProgress(100);
        resolve(data.storagePath);
        return;
      }
      reject(new Error(data.error || 'send_failed'));
    };
    xhr.onerror = () => reject(new Error('send_failed'));
    const body = new FormData();
    body.set('file', file);
    body.set('kind', kind);
    body.set('captchaToken', token);
    xhr.send(body);
  });
}

function PreguntaFormInner({
  pregunta,
  initialMode,
}: {
  pregunta: PreguntaSemana;
  initialMode: QuestionMode;
}) {
  const { locale, t } = useHomeLocale();
  const copy = PREGUNTA_COPY;
  const [mode, setMode] = useState<QuestionMode>(initialMode);
  const [kind, setKind] = useState<Kind>('texto');
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [alias, setAlias] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [adult, setAdult] = useState(false);
  const [publish, setPublish] = useState(false);
  const [terms, setTerms] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sentAlias, setSentAlias] = useState<string | null>(null);
  const [captchaGate, setCaptchaGate] = useState<TurnstileGate>(getTurnstileSiteKey() ? 'wait' : 'skip');
  const captchaTokenRef = useRef('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      const rec = recRef.current;
      if (rec && rec.state !== 'inactive') rec.stop();
      rec?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    if (!audioFile) {
      setAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  function messageFor(code: string): string {
    if (code === 'text_too_long') return copy.errText[locale];
    if (code === 'audio_too_long') return copy.errAudio[locale];
    if (code === 'audio_too_large') return copy.errAudioSize[locale];
    if (code === 'photo_type') return copy.errPhotoType[locale];
    if (code === 'photo_too_large') return copy.errPhotoSize[locale];
    if (code === 'caption_required') return copy.errCaption[locale];
    if (code === 'caption_too_long') return copy.errCaptionLong[locale];
    if (code === 'captcha_required') return t.modalCaptchaFailed;
    if (code === 'consent_required') return t.modalMarkThreeToSend;
    if (code === 'alias_required') return t.modalFieldAliasMissing;
    if (code === 'country_required') return t.modalFieldCountryMissing;
    if (code === 'city_required') return t.modalFieldCityMissing;
    if (code === 'email_required') return t.modalFieldEmailMissing;
    if (code === 'audio_type') return t.modalFileTypeAudio;
    return copy.errSend[locale];
  }

  function stopRecording() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    const rec = recRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    setRecording(false);
  }

  async function startRecording() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(t.modalMicUnsupported);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      const chunks: Blob[] = [];
      rec.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || mime });
        const ext = (rec.mimeType || mime).includes('mp4') ? 'm4a' : 'webm';
        setAudioFile(new File([blob], `voz.${ext}`, { type: blob.type || mime }));
      };
      setAudioFile(null);
      recRef.current = rec;
      rec.start();
      setRecording(true);
      setElapsed(0);
      const started = performance.now();
      timerRef.current = window.setInterval(() => {
        const sec = (performance.now() - started) / 1000;
        setElapsed(sec);
        if (sec >= RESPUESTA_VOICE_MAX_SECONDS) stopRecording();
      }, 200);
    } catch {
      setError(t.modalMicDenied);
    }
  }

  async function onAudioPicked(file: File | null) {
    if (recording) {
      const rec = recRef.current;
      if (rec && rec.state !== 'inactive') {
        rec.onstop = () => {
          rec.stream.getTracks().forEach((track) => track.stop());
        };
      }
      stopRecording();
    }
    setError('');
    if (!file) return;
    if (file.size > RESPUESTA_VOICE_MAX_BYTES) {
      setAudioFile(null);
      setError(copy.errAudioSize[locale]);
      return;
    }
    const seconds = await probeAudioFileDurationSeconds(file);
    if (seconds != null && seconds > RESPUESTA_VOICE_MAX_SECONDS) {
      setAudioFile(null);
      setElapsed(0);
      setError(copy.errAudio[locale]);
      return;
    }
    setElapsed(seconds ?? 0);
    setAudioFile(file);
  }

  function onPhotoPicked(file: File | null) {
    setError('');
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    if (!file) {
      setPhotoFile(null);
      setPhotoUrl(null);
      return;
    }
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    const okType =
      type === 'image/jpeg' ||
      type === 'image/png' ||
      type === 'image/webp' ||
      type === 'image/heic' ||
      type === 'image/heif' ||
      (!type && /\.(jpe?g|png|webp|heic|heif)$/.test(name));
    if (!okType) {
      setPhotoFile(null);
      setPhotoUrl(null);
      setError(copy.errPhotoType[locale]);
      return;
    }
    if (file.size > RESPUESTA_PHOTO_MAX_BYTES) {
      setPhotoFile(null);
      setPhotoUrl(null);
      setError(copy.errPhotoSize[locale]);
      return;
    }
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (alias.trim().length < 2) return setError(t.modalFieldAliasMissing);
    if (country.trim().length < 2) return setError(t.modalFieldCountryMissing);
    if (city.trim().length < 1) return setError(t.modalFieldCityMissing);
    if (!email.trim().includes('@')) return setError(t.modalFieldEmailMissing);
    if (!adult || !publish || !terms) return setError(t.modalMarkThreeToSend);
    if (kind === 'texto' && !text.trim()) return;
    if (kind === 'texto' && text.trim().length > RESPUESTA_TEXT_MAX) return setError(copy.errText[locale]);
    if (kind === 'voz' && !audioFile) return;
    if (kind === 'foto' && !photoFile) return;
    if (kind === 'foto' && !caption.trim()) return setError(copy.errCaption[locale]);
    if (kind === 'foto' && caption.trim().length > RESPUESTA_CAPTION_MAX) return setError(copy.errCaptionLong[locale]);
    if (captchaGate === 'need' || captchaGate === 'wait') return setError(t.modalCaptchaFailed);

    setSaving(true);
    setProgress(kind === 'texto' ? null : 0);
    try {
      let storagePath: string | undefined;
      if (kind !== 'texto') {
        const file = kind === 'voz' ? audioFile : photoFile;
        if (!file) throw new Error('send_failed');
        storagePath = await uploadMedia(file, kind, captchaTokenRef.current, setProgress);
      }
      const res = await fetch('/api/respuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: pregunta.id,
          mode,
          kind,
          contenido: kind === 'texto' ? text : kind === 'foto' ? caption : '',
          ...(storagePath ? { storagePath } : {}),
          ...(kind === 'texto' && captchaTokenRef.current ? { captchaToken: captchaTokenRef.current } : {}),
          alias,
          city,
          country,
          email,
          consentPrivacyPolicy: adult,
          consentPublicacion: publish,
          consentTerminos: terms,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || 'send_failed');
      setSentAlias(alias.trim());
    } catch (err) {
      setError(messageFor(err instanceof Error ? err.message : 'send_failed'));
      captchaTokenRef.current = '';
      turnstileRef.current?.reset();
      setCaptchaGate(getTurnstileSiteKey() ? 'wait' : 'skip');
    } finally {
      setSaving(false);
      setProgress(null);
    }
  }

  if (sentAlias) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8 text-[#1C1C2E]">
        <p className="text-lg leading-relaxed">{preguntaThanks(locale, sentAlias)}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-am-secundario inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold"
            onClick={() => {
              const enlace = `${window.location.origin}${preguntaPageHref(pregunta.id)}`;
              const shareText = preguntaShareText(locale, pregunta[mode][locale], enlace);
              const nav = navigator as Navigator & { share?: (data: { text: string }) => Promise<void> };
              if (nav.share) {
                void nav.share({ text: shareText }).catch(() => undefined);
                return;
              }
              void navigator.clipboard?.writeText(shareText);
            }}
          >
            {copy.share[locale]}
          </button>
          <Link
            href={preguntaPageHref(pregunta.id)}
            className="btn-am-secundario inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold"
          >
            {copy.seeWorld[locale]}
          </Link>
        </div>
      </div>
    );
  }

  const termsBits = t.modalConsentTermsAndPrivacy.split('{terminos}');
  const afterTerms = (termsBits[1] ?? '').split('{privacidad}');
  const question = pregunta[mode][locale];

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8 text-[#1C1C2E]">
      <p className="m-0 text-sm leading-relaxed text-[#4A5568] md:text-base">{copy.intro[locale]}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          aria-pressed={mode === 'tu'}
          onClick={() => setMode('tu')}
          className={`${pickClass(mode === 'tu')} flex flex-col items-start gap-1 rounded-2xl px-4 py-3 text-left`}
        >
          <span className="text-base font-semibold">{copy.modeYou[locale]}</span>
          <span className="text-sm font-normal leading-snug">{copy.modeYouLine[locale]}</span>
        </button>
        <button
          type="button"
          aria-pressed={mode === 'alguien'}
          onClick={() => setMode('alguien')}
          className={`${pickClass(mode === 'alguien')} flex flex-col items-start gap-1 rounded-2xl px-4 py-3 text-left`}
        >
          <span className="text-base font-semibold">{copy.modeAsk[locale]}</span>
          <span className="text-sm font-normal leading-snug">{copy.modeAskLine[locale]}</span>
        </button>
      </div>

      <div>
        <p className="m-0 text-sm font-semibold text-[#D13D17]">{pregunta.tema[locale]}</p>
        <h1 className="m-0 mt-2 text-2xl font-semibold leading-snug">{question}</h1>
      </div>

      <div className="flex flex-col gap-2">
        <p className="m-0 text-base font-semibold">{copy.how[locale]}</p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['texto', copy.write[locale], PenLine],
              ['voz', copy.kindVoice[locale], Mic],
              ['foto', copy.kindPhoto[locale], ImageIcon],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={kind === id}
              onClick={() => setKind(id)}
              className={`${pickClass(kind === id)} flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-sm font-semibold`}
            >
              <Icon size={22} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      {kind === 'texto' && (
        <div className="flex flex-col gap-1">
          <textarea
            value={text}
            maxLength={RESPUESTA_TEXT_MAX}
            rows={6}
            aria-label={copy.write[locale]}
            onChange={(event) => setText(event.target.value)}
            className={fieldClass}
          />
          <p className="m-0 text-right text-xs text-[#4A5568]">
            {text.length}/{RESPUESTA_TEXT_MAX}
          </p>
        </div>
      )}

      {kind === 'voz' && (
        <div className="flex flex-col items-center gap-3">
          {audioUrl && !recording ? (
            <>
              <audio controls src={audioUrl} className="w-full" />
              <button
                type="button"
                onClick={() => void startRecording()}
                className="text-sm font-semibold text-[#1C1C2E] underline"
              >
                {copy.recordAgain[locale]}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (recording ? stopRecording() : void startRecording())}
                aria-pressed={recording}
                aria-label={recording ? copy.tapStop[locale] : copy.tapRecord[locale]}
                className={`flex h-20 w-20 items-center justify-center rounded-full border-2 bg-transparent ${
                  recording ? 'border-[#D13D17] text-[#D13D17]' : 'border-black/20 text-[#1C1C2E]'
                }`}
              >
                <Mic size={28} aria-hidden />
              </button>
              <p className="m-0 text-sm">{recording ? copy.tapStop[locale] : copy.tapRecord[locale]}</p>
              <p className="m-0 text-sm font-semibold" aria-live="polite">
                {mmss(elapsed)} / 2:00
              </p>
              {recording && elapsed >= 90 ? (
                <p className="m-0 text-sm font-semibold text-[#B53514]">{t.modalRecordingSoonEnd}</p>
              ) : null}
            </>
          )}
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            className="text-sm text-[#4A5568] underline"
          >
            {copy.orUpload[locale]}
          </button>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.webm"
            className="sr-only"
            onChange={(event) => {
              void onAudioPicked(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />
        </div>
      )}

      {kind === 'foto' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/25 bg-transparent px-4 py-6 text-sm text-[#1C1C2E]"
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="max-h-64 w-full object-contain" />
            ) : (
              copy.choosePhoto[locale]
            )}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic"
            className="sr-only"
            onChange={(event) => {
              onPhotoPicked(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {copy.caption[locale]}
            <input
              value={caption}
              maxLength={RESPUESTA_CAPTION_MAX}
              onChange={(event) => setCaption(event.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t.modalAlias}
        <input value={alias} onChange={(event) => setAlias(event.target.value)} autoComplete="nickname" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t.modalCountry}
        <input value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country-name" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t.modalCity}
        <input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t.modalEmail}
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className={fieldClass} />
      </label>

      <div className="flex flex-col gap-2 text-sm">
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} className="mt-1" />
          <span>{t.modalConsentAdult}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} className="mt-1" />
          <span>{t.modalConsentPublish}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-1" />
          <span>
            {termsBits[0]}
            <a className="text-[#D13D17] underline" href="/terminos" target="_blank" rel="noreferrer">
              {t.modalConsentTermsLink}
            </a>
            {afterTerms[0]}
            <a className="text-[#D13D17] underline" href="/privacidad" target="_blank" rel="noreferrer">
              {t.modalConsentPrivacyLink}
            </a>
            {afterTerms[1] ?? ''}
          </span>
        </label>
      </div>

      <TurnstileWidget
        ref={turnstileRef}
        onTokenChange={(token) => {
          captchaTokenRef.current = token;
        }}
        onGateChange={setCaptchaGate}
      />

      {progress != null && (
        <div className="h-2 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-[#D13D17]" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error ? (
        <p className="m-0 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={saving} className="btn-am-principal inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold disabled:opacity-60">
        {copy.submit[locale]}
      </button>
    </form>
  );
}

export default function PreguntaForm() {
  const params = useSearchParams();
  const id = resolveQuestionId(params.get('pregunta'));
  const modeParam = params.get('modo');
  const pregunta = (id ? preguntaPorId(id) : null) ?? preguntasDeLaSemana().vigente;
  const initialMode: QuestionMode = isQuestionMode(modeParam) ? modeParam : 'tu';
  return <PreguntaFormInner key={`${pregunta.id}:${initialMode}`} pregunta={pregunta} initialMode={initialMode} />;
}
