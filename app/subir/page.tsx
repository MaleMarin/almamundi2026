'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Video, Mic, FileText, Image as ImageIcon, UserCircle } from 'lucide-react';
import { uploadFileToStorage } from '@/lib/firebase/upload';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import {
  MAX_AUDIO_VIDEO_DURATION_SECONDS,
  probeAudioFileDurationSeconds,
  probeAudioUrlDurationSeconds,
  probeVideoFileDurationSeconds,
  fetchVimeoVideoDurationSeconds,
  isDurationWithinMax,
} from '@/lib/media-duration-rules';
import { StoryCaptureStep, type CaptureOutcome } from '@/components/subir/StoryCaptureStep';
import { SubmissionSuccessWithHuella } from '@/components/subir/SubmissionSuccessWithHuella';
import {
  SUBIR_AV_MAX_MINUTES,
  SUBIR_PHOTO_MAX,
  SUBIR_PHOTO_MIN,
  SUBIR_TEXT_MAX_CHARS,
} from '@/lib/subir-limits';
import {
  AGE_RANGE_OPTIONS,
  type AgeRangeId,
} from '@/lib/subir-author-fields';
type Format = 'video' | 'audio' | 'texto' | 'foto';

const FORMAT_LABELS: Record<Format, string> = {
  video: 'Video',
  audio: 'Audio',
  texto: 'Texto',
  foto: 'Foto',
};

const FORMAT_PHRASES: Record<Format, string> = {
  video: `Video: hasta ${SUBIR_AV_MAX_MINUTES} minutos. Puedes grabar, subir desde tu equipo o pegar un enlace; después te pedimos unos datos para acompañar tu relato.`,
  audio: `Audio: hasta ${SUBIR_AV_MAX_MINUTES} minutos. Graba con tu voz o sube un audio; después te pedimos unos datos para acompañar tu relato.`,
  texto: `Texto: máximo ~2 carillas (${SUBIR_TEXT_MAX_CHARS.toLocaleString('es')} caracteres). Un espacio para contar con calma.`,
  foto: `Fotos: entre ${SUBIR_PHOTO_MIN} y ${SUBIR_PHOTO_MAX} imágenes, con un poco de contexto para entender qué cuentan.`,
};

/** Texto para curación cuando ya no hay campos separados “Contexto” / “Texto” en el paso datos. */
function buildSubmissionContext(
  format: Format,
  textBody: string,
  storyTitle: string,
  ciudad: string,
  pais: string,
  extraContext: string
): string {
  const ex = extraContext.trim();
  const tbRaw = textBody.trim();
  const tb =
    ex && tbRaw
      ? `${tbRaw}\n\n— Extras / contexto —\n${ex}`
      : ex && !tbRaw
        ? ex
        : tbRaw;
  if (tb.length >= 30) return tb.slice(0, 2000);
  const geo = [ciudad.trim(), pais.trim()].filter(Boolean).join(', ');
  const pieces = [storyTitle.trim(), geo, `Formato: ${FORMAT_LABELS[format]}`].filter(Boolean);
  let out = pieces.join(' · ');
  if (tb.length > 0) out = `${tb}\n\n${out}`;
  if (out.trim().length >= 30) return out.slice(0, 2000);
  return `${out}\n(Envío AlmaMundi — sin descripción ampliada.)`.slice(0, 2000);
}

const PHOTO_MAX_MB = 5;
const AUDIO_MAX_MB = 10;
/** Foto de perfil opcional (solo identificación del autor; distinta de la foto de la historia). */
const PROFILE_PHOTO_MAX_MB = 8;
const EXTRA_FILE_MAX_MB = 15;
const EXTRA_FILES_MAX = 8;

function isVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /youtube\.com|youtu\.be|vimeo\.com/i.test(u.hostname);
  } catch {
    return false;
  }
}

function SubirPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /** Flujo: tarjetas → captura → revisión y envío → recibido. */
  const [step, setStep] = useState<'cards' | 'capture' | 'form' | 'received'>('cards');
  const [format, setFormat] = useState<Format | null>(null);
  const [capture, setCapture] = useState<CaptureOutcome | null>(null);
  const [captureHydrateKey, setCaptureHydrateKey] = useState(0);
  const captureRef = useRef<CaptureOutcome | null>(null);
  captureRef.current = capture;

  useLayoutEffect(() => {
    if (searchParams.get('sent') === '1') {
      setStep('received');
      return;
    }
    const raw = searchParams.get('format')?.toLowerCase();
    const ok = raw === 'video' || raw === 'audio' || raw === 'texto' || raw === 'foto';
    const st = searchParams.get('step')?.toLowerCase();
    if (!ok) {
      setFormat(null);
      setCapture(null);
      setStep('cards');
      return;
    }
    setFormat(raw as Format);
    if (st === 'impronta') {
      if (!captureRef.current) {
        setStep('capture');
        router.replace(`/subir?format=${raw}&step=capture`, { scroll: false });
        return;
      }
      setStep('form');
      router.replace(`/subir?format=${raw}&step=datos`, { scroll: false });
      return;
    }
    if (st === 'datos') {
      if (!captureRef.current) {
        setStep('capture');
        router.replace(`/subir?format=${raw}&step=capture`, { scroll: false });
        return;
      }
      setStep('form');
      return;
    }
    setStep('capture');
    if (st && st !== 'capture') {
      router.replace(`/subir?format=${raw}&step=capture`, { scroll: false });
    }
  }, [searchParams, router]);

  const [storyTitle, setStoryTitle] = useState('');
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [pais, setPais] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<'femenino' | 'masculino' | 'no-binario' | 'prefiero-no-decir' | 'otro' | ''>('');
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [consentPrivacyPolicy, setConsentPrivacyPolicy] = useState(false);
  const [ageRange, setAgeRange] = useState<AgeRangeId | ''>('');
  const [extraContext, setExtraContext] = useState('');

  const [textBody, setTextBody] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const profileObjectUrlRef = useRef<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  /** Audio: archivo o URL no supera 5 min (o URL no verificable por CORS). */
  const [audioFileWithinMax, setAudioFileWithinMax] = useState(true);
  const [audioUrlWithinMax, setAudioUrlWithinMax] = useState(true);
  const [videoVimeoTooLong, setVideoVimeoTooLong] = useState(false);

  const hasVideoSource =
    capture?.recordedBlob != null ||
    capture?.videoFile != null ||
    (Boolean(capture?.videoUrl) && isVideoUrl(capture!.videoUrl)) ||
    (videoUrl.trim().length > 0 && isVideoUrl(videoUrl));

  const effectiveAudioFile = audioFile ?? capture?.audioFile ?? null;
  const effectiveAudioUrl = (audioUrl.trim() || capture?.audioUrl?.trim() || '').trim();

  const hasAudioSource =
    capture?.recordedBlob != null ||
    effectiveAudioFile != null ||
    (effectiveAudioUrl.length > 0 && /^https?:\/\//i.test(effectiveAudioUrl));

  const canSubmit =
    step === 'form' &&
    Boolean(format) &&
    storyTitle.trim().length >= 2 &&
    alias.trim().length >= 2 &&
    ciudad.trim().length >= 1 &&
    pais.trim().length >= 2 &&
    consentPrivacyPolicy &&
    ageRange !== '' &&
    (format === 'texto'
      ? textBody.trim().length > 0 && textBody.trim().length <= SUBIR_TEXT_MAX_CHARS
      : true) &&
    (format === 'video' ? hasVideoSource : true) &&
    (format === 'foto'
      ? (photoFiles.length >= SUBIR_PHOTO_MIN &&
          photoFiles.length <= SUBIR_PHOTO_MAX) ||
        (photoUrl.trim().length > 0 && /^https?:\/\//.test(photoUrl))
      : true) &&
    (format === 'audio' ? hasAudioSource : true) &&
    (format !== 'audio' || (audioFileWithinMax && audioUrlWithinMax)) &&
    (format !== 'video' || capture?.recordedBlob != null || !videoVimeoTooLong) &&
    sex !== '';

  const submit = useCallback(async () => {
    if (!canSubmit || !format) return;
    setError('');
    if (!email.trim()) {
      setError('El correo es necesario para avisarte cuando tu historia esté en el globo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Indica un correo válido.');
      return;
    }
    setSaving(true);
    try {
      const privateMediaPaths: string[] = [];
      const trackUpload = async (file: File | Blob, prefix: string, name: string) => {
        const r = await uploadFileToStorage(file, prefix, name);
        privateMediaPaths.push(r.storagePath);
        return r.readUrl;
      };

      let profilePhotoUrl: string | undefined;
      if (profilePhotoFile) {
        profilePhotoUrl = await trackUpload(
          profilePhotoFile,
          'submissions/avatars',
          `avatar-${profilePhotoFile.name}`
        );
      }

      const extraAttachmentUrls: string[] = [];
      for (let i = 0; i < extraFiles.length; i++) {
        const f = extraFiles[i]!;
        const url = await trackUpload(f, 'submissions/extras', `extra-${i}-${f.name}`);
        extraAttachmentUrls.push(url);
      }

      const placeCombined = `${ciudad.trim()}, ${pais.trim()}`;

      let payload: {
        textBody?: string;
        photoUrl?: string;
        photoUrls?: string[];
        audioUrl?: string;
        videoUrl?: string;
      } = {};
      if (format === 'texto') {
        payload = { textBody: textBody.trim() };
      } else if (format === 'video') {
        if (capture?.recordedBlob) {
          const ext = capture.recordedMime.includes('mp4') ? 'mp4' : 'webm';
          const url = await trackUpload(
            capture.recordedBlob,
            'submissions',
            `video-grabado.${ext}`
          );
          payload = { videoUrl: url };
        } else if (capture?.videoFile) {
          const vf = capture.videoFile;
          const sec = await probeVideoFileDurationSeconds(vf);
          if (sec != null && !isDurationWithinMax(sec)) {
            setError(`El video supera los ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
            setSaving(false);
            return;
          }
          const extRaw = vf.name.split('.').pop()?.toLowerCase() || '';
          const safeExt = extRaw && /^[a-z0-9]+$/.test(extRaw) ? extRaw : 'mp4';
          const url = await trackUpload(vf, 'submissions', `video-subido.${safeExt}`);
          payload = { videoUrl: url };
        } else {
          const vu = (videoUrl.trim() || capture?.videoUrl?.trim() || '').trim();
          payload = { videoUrl: vu };
        }
      } else if (format === 'audio') {
        const blobRec = capture?.recordedBlob;
        const fileUse = audioFile ?? capture?.audioFile ?? null;
        if (blobRec) {
          const af = new File([blobRec], 'grabacion.webm', { type: capture.recordedMime || 'audio/webm' });
          const sec = await probeAudioFileDurationSeconds(af);
          if (sec != null && !isDurationWithinMax(sec)) {
            setError(`El audio supera los ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
            setSaving(false);
            return;
          }
          const ext = capture.recordedMime.includes('mp4') ? 'm4a' : 'webm';
          const url = await trackUpload(blobRec, 'submissions', `audio-grabado.${ext}`);
          payload = { audioUrl: url };
        } else if (fileUse) {
          const sec = await probeAudioFileDurationSeconds(fileUse);
          if (sec != null && !isDurationWithinMax(sec)) {
            setError(`El audio supera los ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos.`);
            setSaving(false);
            return;
          }
          const url = await trackUpload(
            fileUse,
            'submissions',
            `audio.${fileUse.name.split('.').pop() || 'mp3'}`
          );
          payload = { audioUrl: url };
        } else {
          const au = (audioUrl.trim() || capture?.audioUrl?.trim() || '').trim();
          payload = { audioUrl: au };
        }
      } else if (format === 'foto') {
        if (photoFiles.length > 0) {
          const urls = await Promise.all(
            photoFiles.map((f, i) =>
              trackUpload(f, 'submissions', `photo-${i}-${f.name}`)
            )
          );
          const first = urls[0];
          if (first) payload = { photoUrl: first, photoUrls: urls };
        } else if (photoUrl.trim() && /^https?:\/\//.test(photoUrl)) {
          payload = { photoUrl: photoUrl.trim() };
        }
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: format,
          storyTitle: storyTitle.trim(),
          alias: alias.trim(),
          email: email.trim(),
          themeId: '',
          date: '',
          dateApprox: false,
          placeLabel: placeCombined,
          countryLabel: pais.trim(),
          context: buildSubmissionContext(format, textBody, storyTitle, ciudad, pais, extraContext),
          payload,
          consentRights: true,
          consentCurate: true,
          consentPostales: true,
          consentPrivacyPolicy: true,
          ...(profilePhotoUrl ? { profilePhotoUrl } : {}),
          ...(birthDate.trim() ? { birthDate: birthDate.trim() } : {}),
          ...(sex ? { sex } : {}),
          ...(ageRange ? { ageRange } : {}),
          ...(extraAttachmentUrls.length ? { extraAttachmentUrls } : {}),
          ...(privateMediaPaths.length ? { privateMediaPaths } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Error ${res.status}. Intenta de nuevo.`);
        return;
      }
      const sid = typeof data.id === 'string' && data.id ? data.id : null;
      setLastSubmissionId(sid);
      setStep('received');
      router.replace('/subir?sent=1', { scroll: false });
    } catch (e) {
      console.error('submit', e);
      setError(
        e instanceof Error && e.message.includes('Firebase')
          ? 'Subida no configurada. Configura Firebase en .env.local.'
          : 'No pudimos enviar. Revisa tu conexión e intenta de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  }, [
    canSubmit,
    format,
    capture,
    storyTitle,
    alias,
    email,
    ciudad,
    pais,
    birthDate,
    sex,
    ageRange,
    extraContext,
    textBody,
    videoUrl,
    audioUrl,
    photoUrl,
    audioFile,
    photoFiles,
    profilePhotoFile,
    extraFiles,
    router,
  ]);

  const clearProfilePhoto = useCallback(() => {
    if (profileObjectUrlRef.current) {
      URL.revokeObjectURL(profileObjectUrlRef.current);
      profileObjectUrlRef.current = null;
    }
    setProfilePhotoFile(null);
    setProfilePhotoPreview(null);
  }, []);

  useEffect(() => {
    return () => {
      if (profileObjectUrlRef.current) {
        URL.revokeObjectURL(profileObjectUrlRef.current);
        profileObjectUrlRef.current = null;
      }
    };
  }, []);

  const selectFormat = useCallback(
    (f: Format) => {
      setLastSubmissionId(null);
      setCapture(null);
      setCaptureHydrateKey(0);
      setFormat(f);
      setStep('capture');
      router.replace(`/subir?format=${f}&step=capture`, { scroll: false });
    },
    [router]
  );

  const backToCards = useCallback(() => {
    setLastSubmissionId(null);
    setExtraContext('');
    setPhotoFiles([]);
    setAudioFile(null);
    setAudioFileWithinMax(true);
    setAudioUrlWithinMax(true);
    setVideoVimeoTooLong(false);
    clearProfilePhoto();
    setCapture(null);
    setCaptureHydrateKey(0);
    setExtraFiles([]);
    setFormat(null);
    setStep('cards');
    router.replace('/subir', { scroll: false });
  }, [router, clearProfilePhoto]);

  useEffect(() => {
    if (step !== 'form' || !capture || !format) return;
    if (format === 'video' && capture.videoUrl) setVideoUrl(capture.videoUrl);
    if (format === 'audio') {
      if (capture.audioUrl) setAudioUrl(capture.audioUrl);
      if (capture.audioFile) setAudioFile(capture.audioFile);
    }
    if (format === 'texto' && capture.narrativeText) setTextBody(capture.narrativeText);
    if (format === 'foto' && capture.photoFiles?.length) setPhotoFiles(capture.photoFiles);
  }, [step, capture, format]);

  useEffect(() => {
    if (format !== 'audio' || audioFile != null || capture?.audioFile != null || capture?.recordedBlob != null) {
      setAudioUrlWithinMax(true);
      return;
    }
    const url = (audioUrl.trim() || capture?.audioUrl?.trim() || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      setAudioUrlWithinMax(true);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      void probeAudioUrlDurationSeconds(url).then((sec) => {
        if (cancelled) return;
        if (sec != null && !isDurationWithinMax(sec)) setAudioUrlWithinMax(false);
        else setAudioUrlWithinMax(true);
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [format, audioFile, audioUrl, capture]);

  useEffect(() => {
    if (format !== 'video') {
      setVideoVimeoTooLong(false);
      return;
    }
    const url = (videoUrl.trim() || capture?.videoUrl?.trim() || '').trim();
    setVideoVimeoTooLong(false);
    if (!isVideoUrl(url)) return;
    let cancelled = false;
    const t = setTimeout(() => {
      void fetchVimeoVideoDurationSeconds(url).then((sec) => {
        if (cancelled || sec == null) return;
        if (!isDurationWithinMax(sec)) setVideoVimeoTooLong(true);
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [format, videoUrl, capture]);

  const fmtForSuccess = (format ?? 'texto') as Format;
  const narrativeForHuellaSuccess =
    capture?.narrativeText?.trim() ||
    buildSubmissionContext(fmtForSuccess, textBody, storyTitle, ciudad, pais, extraContext);
  const huellaSlug = (lastSubmissionId ?? 'x').replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <main className={`min-h-screen overflow-x-hidden ${historiasInterior.mainClassName}`} style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <div className="w-full pt-10 pb-16 px-6 md:px-12 max-w-5xl mx-auto">
        {step === 'cards' && (
          <>
            <header className="mb-10 md:mb-14 space-y-4">
              <p className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-orange-600">AlmaMundi</p>
              <h1 className="sr-only">Elegir formato de participación</h1>
              <p className="text-xl md:text-3xl lg:text-4xl font-light leading-relaxed max-w-3xl" style={{ color: neu.textBody }}>
                Elige cómo quieres contar tu historia: con video, voz, texto o imagen. Primero dejas tu relato; después
                revisamos unos datos contigo y, al enviar, tu historia queda en revisión. Video y audio: hasta{' '}
                {SUBIR_AV_MAX_MINUTES} minutos. Texto: hasta ~2 carillas. Fotos: {SUBIR_PHOTO_MIN} a {SUBIR_PHOTO_MAX}{' '}
                imágenes.
              </p>
            </header>
            <section
              className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10 mb-12"
              aria-label="Paso 1 de 4: elegir formato de historia"
              aria-current="step"
            >
              {(['video', 'audio', 'texto', 'foto'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => selectFormat(f)}
                  className="p-8 md:p-10 rounded-[2.5rem] flex flex-col items-start gap-4 transition-all hover:-translate-y-1 active:scale-[0.99] text-left"
                  style={{
                    ...neu.card,
                    boxShadow: `${neu.card.boxShadow}, 0 24px 48px rgba(163,177,198,0.28)`,
                  }}
                >
                  {f === 'video' && <Video size={40} className="text-orange-500 shrink-0" aria-hidden />}
                  {f === 'audio' && <Mic size={40} className="text-orange-500 shrink-0" aria-hidden />}
                  {f === 'texto' && <FileText size={40} className="text-orange-500 shrink-0" aria-hidden />}
                  {f === 'foto' && <ImageIcon size={40} className="text-orange-500 shrink-0" aria-hidden />}
                  <span className="font-semibold text-2xl md:text-3xl" style={{ color: neu.textMain }}>
                    {FORMAT_LABELS[f]}
                  </span>
                  <p className="text-base md:text-xl font-light leading-relaxed" style={{ color: neu.textBody }}>
                    {FORMAT_PHRASES[f]}
                  </p>
                  <span
                    className="mt-3 px-8 py-3.5 rounded-full text-base md:text-lg font-bold text-white"
                    style={{
                      background: 'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)',
                      boxShadow: '0 10px 28px rgba(255,69,0,0.38)',
                    }}
                  >
                    Empezar
                  </span>
                </button>
              ))}
            </section>
            <p className="text-center">
              <HomeHardLink href="/#historias" className="text-sm font-medium underline-offset-4 hover:underline" style={{ color: neu.textBody }}>
                ← Volver a las tarjetas del inicio
              </HomeHardLink>
            </p>
          </>
        )}

        {step === 'capture' && format && (
          <StoryCaptureStep
            format={format}
            hydrateKey={captureHydrateKey}
            restoredCapture={
              capture?.submissionPrefill || capture?.audioPrefill ? capture : null
            }
            onContinue={(out) => {
              setCapture(out);
              const pre = out.submissionPrefill ?? out.audioPrefill;
              if (pre) {
                setStoryTitle(pre.storyTitle);
                setCiudad(pre.ciudad);
                setPais(pre.pais);
                setExtraContext(pre.extraStory);
                setAlias(pre.alias);
                setAgeRange(pre.ageRange);
                setSex(pre.sex);
                setEmail(pre.email);
              }
              setStep('form');
              router.replace(`/subir?format=${format}&step=datos`, { scroll: false });
            }}
          />
        )}

        {step === 'form' && format && (
          <>
            <header className="mb-10 space-y-4">
              <p className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-orange-600">AlmaMundi</p>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
                Revisión y envío · {FORMAT_LABELS[format]}
              </p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-light leading-[1.15]" style={{ color: neu.textMain }}>
                Revisa tus datos y envía tu historia
              </h1>
              <p className="text-base md:text-lg font-light leading-relaxed max-w-3xl" style={{ color: neu.textBody }}>
                {format === 'video' && (
                  <>
                    Video: hasta {SUBIR_AV_MAX_MINUTES} minutos. Comprueba que el archivo o el enlace sea el que quieres
                    enviar; aquí puedes ajustar texto o datos si hace falta.
                  </>
                )}
                {format === 'audio' && (
                  <>
                    Audio: hasta {SUBIR_AV_MAX_MINUTES} min. Revisa que se escuche bien. Los datos de tu relato ya los
                    anotaste; aquí puedes revisarlos antes de enviar.
                  </>
                )}
                {format === 'texto' && (
                  <>
                    Texto: máximo {SUBIR_TEXT_MAX_CHARS.toLocaleString('es')} caracteres (~2 carillas). Confirma o edita
                    el cuerpo si hace falta.
                  </>
                )}
                {format === 'foto' && (
                  <>
                    Fotos: entre {SUBIR_PHOTO_MIN} y {SUBIR_PHOTO_MAX} imágenes. Ajusta la galería o la URL de respaldo
                    antes de enviar.
                  </>
                )}
              </p>
            </header>
            <section className="space-y-6" aria-label="Paso 4 de 4: datos y envío" aria-current="step">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                type="button"
                onClick={() => {
                  setCaptureHydrateKey((k) => k + 1);
                  setStep('capture');
                  router.replace(`/subir?format=${format}&step=capture`, { scroll: false });
                }}
                className="text-sm font-medium"
                style={{ color: neu.textBody }}
              >
                ← Volver a tu historia
              </button>
              <button type="button" onClick={backToCards} className="text-sm font-medium underline" style={{ color: neu.textBody }}>
                Empezar de cero
              </button>
            </div>
            <div style={neu.cardInset} className="p-4 md:p-5 rounded-3xl space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                La historia
              </p>
              <div>
                <label htmlFor="subir-datos-titulo" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                  Nombre de la historia *
                </label>
                <input
                  id="subir-datos-titulo"
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Título que verán en el mapa si se publica"
                  className="w-full px-3 py-2.5 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  aria-required="true"
                  aria-invalid={storyTitle.trim().length > 0 && storyTitle.trim().length < 2}
                  aria-describedby={
                    storyTitle.trim().length > 0 && storyTitle.trim().length < 2 ? 'subir-datos-titulo-error' : undefined
                  }
                />
                {storyTitle.trim().length > 0 && storyTitle.trim().length < 2 && (
                  <p id="subir-datos-titulo-error" className="mt-1 text-xs text-amber-700" role="alert">
                    Mínimo 2 caracteres
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="subir-datos-alias" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                  Nombre o alias (obligatorio) *
                </label>
                <input
                  id="subir-datos-alias"
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Cómo quieres aparecer"
                  className="w-full px-3 py-2.5 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  aria-required="true"
                  aria-invalid={alias.trim().length > 0 && alias.trim().length < 2}
                  aria-describedby={
                    alias.trim().length > 0 && alias.trim().length < 2 ? 'subir-datos-alias-error' : undefined
                  }
                />
                {alias.trim().length > 0 && alias.trim().length < 2 && (
                  <p id="subir-datos-alias-error" className="mt-1 text-xs text-amber-700" role="alert">
                    Mínimo 2 caracteres
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="subir-datos-extras-contexto" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                  ¿Quieres agregar algo más sobre esta historia? (opcional)
                </label>
                <textarea
                  id="subir-datos-extras-contexto"
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Contexto breve si hace falta…"
                  rows={3}
                  className="w-full resize-y rounded-xl px-3 py-2.5 outline-none bg-white/50 border border-white/50 min-h-[4.5rem]"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                />
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 md:p-5 rounded-3xl space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                Ubicación
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="subir-datos-pais" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                    País *
                  </label>
                  <input
                    id="subir-datos-pais"
                    type="text"
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    placeholder="Ej: Chile"
                    className="w-full px-3 py-2.5 rounded-xl outline-none bg-white/50 border border-white/50"
                    style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="subir-datos-ciudad" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                    Ciudad o localidad *
                  </label>
                  <input
                    id="subir-datos-ciudad"
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej: Santiago"
                    className="w-full px-3 py-2.5 rounded-xl outline-none bg-white/50 border border-white/50"
                    style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                    aria-required="true"
                  />
                </div>
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 md:p-5 rounded-3xl space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                Datos personales
              </p>
              <div>
                <label htmlFor="subir-datos-edad-tramo" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                  Tramo de edad *
                </label>
                <select
                  id="subir-datos-edad-tramo"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value as AgeRangeId | '')}
                  className="w-full px-3 py-2.5 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  aria-required="true"
                >
                  <option value="">Elige una opción</option>
                  {AGE_RANGE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="subir-datos-nacimiento" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                    Fecha de nacimiento (opcional)
                  </label>
                  <input
                    id="subir-datos-nacimiento"
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="Ej: 1990-04-12 o aproximada"
                    className="w-full px-3 py-2.5 rounded-xl outline-none bg-white/50 border border-white/50"
                    style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  />
                </div>
                <div>
                  <label htmlFor="subir-datos-sexo" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                    Género *
                  </label>
                  <select
                    id="subir-datos-sexo"
                    value={sex}
                    onChange={(e) =>
                      setSex(
                        e.target.value as '' | 'femenino' | 'masculino' | 'no-binario' | 'prefiero-no-decir' | 'otro'
                      )
                    }
                    className="w-full px-3 py-2.5 rounded-xl outline-none bg-white/50 border border-white/50"
                    style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  >
                    <option value="">Elige una opción</option>
                    <option value="femenino">Mujer</option>
                    <option value="masculino">Hombre</option>
                    <option value="no-binario">No binario</option>
                    <option value="prefiero-no-decir">Prefiero no decirlo</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 md:p-5 rounded-3xl space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                Contacto
              </p>
              <div>
                <label htmlFor="subir-datos-email" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                  Correo electrónico *
                </label>
                <input
                  id="subir-datos-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error === 'El correo es necesario para avisarte cuando tu historia esté en el globo.') setError('');
                  }}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2.5 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  aria-required="true"
                  aria-invalid={email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
                  aria-describedby="subir-datos-email-hint"
                />
                <p id="subir-datos-email-hint" className="mt-1.5 text-[11px] leading-snug" style={{ color: neu.textBody }}>
                  Usaremos tu correo para avisarte sobre el estado de tu historia y si llega a publicarse en el mapa. No
                  será visible públicamente.
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider px-0.5" style={{ color: neu.textBody }}>
              Contenido del formato · {FORMAT_LABELS[format]}
            </p>

            {format === 'video' && (
              <div style={neu.cardInset} className="p-4 rounded-3xl space-y-3">
                {capture?.recordedBlob ? (
                  <p className="text-sm font-medium" style={{ color: neu.textMain }}>
                    Incluiremos el video que grabaste en el paso anterior. Si quieres usar solo un enlace público, pégalo
                    abajo.
                  </p>
                ) : null}
                {capture?.videoFile ? (
                  <p className="text-sm font-medium" style={{ color: neu.textMain }}>
                    Incluiremos el video que subiste desde tu equipo ({capture.videoFile.name}). Si quieres cambiarlo,
                    vuelve al paso anterior.
                  </p>
                ) : null}
                <label htmlFor="subir-datos-video-url" className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                  URL del video (YouTube o Vimeo)
                  {!capture?.recordedBlob && !capture?.videoFile ? ' *' : ''}
                </label>
                <p className="text-[11px] leading-relaxed" style={{ color: neu.textBody }}>
                  Duración máxima <strong>{MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos</strong>. En Vimeo comprobamos
                  la duración automáticamente si el enlace lo permite.
                </p>
                <input
                  id="subir-datos-video-url"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/..."
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  aria-required={!capture?.recordedBlob && !capture?.videoFile}
                  aria-invalid={videoUrl.trim().length > 0 && !isVideoUrl(videoUrl)}
                  aria-describedby={
                    [
                      videoUrl.trim().length > 0 && !isVideoUrl(videoUrl) ? 'subir-datos-video-url-format' : '',
                      videoVimeoTooLong ? 'subir-datos-video-vimeo-len' : '',
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                />
                {videoUrl.trim().length > 0 && !isVideoUrl(videoUrl) && (
                  <p id="subir-datos-video-url-format" className="mt-1 text-[11px] text-amber-700" role="alert">
                    Indica un enlace de YouTube o Vimeo
                  </p>
                )}
                {videoVimeoTooLong && (
                  <p id="subir-datos-video-vimeo-len" className="text-[11px] text-red-600 font-medium" role="alert">
                    Este video de Vimeo supera los {MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos. Sube una versión más corta.
                  </p>
                )}
              </div>
            )}

            {format === 'audio' && (
              <div style={neu.cardInset} className="p-4 rounded-3xl space-y-3">
                {capture?.recordedBlob ? (
                  <p className="text-sm font-medium" style={{ color: neu.textMain }}>
                    Incluiremos el audio que grabaste antes. Puedes sustituirlo por archivo o URL abajo si lo necesitas.
                  </p>
                ) : null}
                <label htmlFor="subir-datos-audio-file" className="block text-sm font-medium" style={{ color: neu.textMain }}>
                  Audio (MP3, WAV o M4A; máx. {AUDIO_MAX_MB} MB) o URL
                </label>
                <p className="text-xs leading-relaxed" style={{ color: neu.textBody }}>
                  Duración máxima <strong>{MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos</strong>. Los archivos se comprueban al elegirlos; las URLs, si el servidor lo permite (a veces falla por CORS).
                </p>
                <input
                  id="subir-datos-audio-file"
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a"
                  aria-label="Seleccionar archivo de audio (MP3, WAV o M4A)"
                  onChange={(e) => {
                    const inputEl = e.target;
                    const f = inputEl.files?.[0];
                    if (!f) {
                      setAudioFile(null);
                      setAudioFileWithinMax(true);
                      return;
                    }
                    if (f.size > AUDIO_MAX_MB * 1024 * 1024) {
                      setError(`Máximo ${AUDIO_MAX_MB} MB`);
                      setAudioFile(null);
                      setAudioFileWithinMax(true);
                      inputEl.value = '';
                      return;
                    }
                    setError('');
                    void (async () => {
                      const sec = await probeAudioFileDurationSeconds(f);
                      if (sec != null && !isDurationWithinMax(sec)) {
                        setError(
                          `El audio dura más de ${MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos. Acorta el archivo e intenta de nuevo.`
                        );
                        setAudioFileWithinMax(false);
                        setAudioFile(null);
                        inputEl.value = '';
                        return;
                      }
                      setAudioFileWithinMax(true);
                      setAudioFile(f);
                    })();
                  }}
                  className="w-full text-sm"
                  style={{ color: neu.textBody }}
                />
                <label htmlFor="subir-datos-audio-url" className="sr-only">
                  URL del audio
                </label>
                <input
                  id="subir-datos-audio-url"
                  type="url"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="O pega aquí la URL del audio"
                  className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  aria-invalid={!audioUrlWithinMax}
                  aria-describedby={!audioUrlWithinMax ? 'subir-datos-audio-url-error' : undefined}
                />
                {!audioUrlWithinMax && (
                  <p id="subir-datos-audio-url-error" className="text-xs text-red-600 font-medium" role="alert">
                    Ese enlace supera los {MAX_AUDIO_VIDEO_DURATION_SECONDS / 60} minutos. Usa un audio más corto.
                  </p>
                )}
                {(audioFile ||
                  audioUrl.trim() ||
                  capture?.recordedBlob ||
                  capture?.audioFile ||
                  (capture?.audioUrl?.trim() ?? '')) &&
                  audioFileWithinMax &&
                  audioUrlWithinMax && (
                  <p className="text-sm" style={{ color: neu.textBody }}>
                    ✓ Listo
                  </p>
                )}
              </div>
            )}

            {format === 'texto' && (
              <div style={neu.cardInset} className="p-4 md:p-5 rounded-3xl space-y-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                  Tu texto
                </p>
                <label htmlFor="subir-datos-texto-cuerpo" className="block text-sm font-medium mb-1.5" style={{ color: neu.textMain }}>
                  Texto de la historia *
                </label>
                <textarea
                  id="subir-datos-texto-cuerpo"
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  placeholder="Escribe o pega aquí el relato que quieres enviar."
                  rows={12}
                  maxLength={SUBIR_TEXT_MAX_CHARS}
                  className="w-full resize-y rounded-xl px-3 py-2.5 outline-none bg-white/50 border border-white/50 min-h-[12rem] text-sm leading-relaxed"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  aria-required="true"
                />
                <p className="text-[11px]" style={{ color: neu.textBody }}>
                  {textBody.length.toLocaleString('es')} / {SUBIR_TEXT_MAX_CHARS.toLocaleString('es')} caracteres
                </p>
              </div>
            )}

            {format === 'foto' && (
              <div style={neu.cardInset} className="p-6 md:p-8 rounded-[2rem] space-y-4">
                <label htmlFor="subir-datos-fotos-historia" className="block text-xl font-semibold mb-2" style={{ color: neu.textMain }}>
                  Fotos ({SUBIR_PHOTO_MIN}–{SUBIR_PHOTO_MAX}; JPG, PNG o WebP; máx. {PHOTO_MAX_MB} MB c/u) *
                </label>
                <input
                  id="subir-datos-fotos-historia"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  aria-label={`Seleccionar archivos de fotos de la historia (${SUBIR_PHOTO_MIN} a ${SUBIR_PHOTO_MAX} imágenes)`}
                  aria-required="true"
                  onChange={(e) => {
                    const list = e.target.files;
                    if (!list?.length) return;
                    setPhotoFiles((prev) => {
                      const next = [...prev];
                      for (const f of Array.from(list)) {
                        if (next.length >= SUBIR_PHOTO_MAX) break;
                        if (f.size > PHOTO_MAX_MB * 1024 * 1024) {
                          setError(`Cada imagen: máximo ${PHOTO_MAX_MB} MB`);
                          return prev;
                        }
                        if (!/^image\/(jpeg|png|webp)$/i.test(f.type)) {
                          setError('Formato: JPG, PNG o WebP.');
                          return prev;
                        }
                        next.push(f);
                      }
                      setError('');
                      return next;
                    });
                    e.target.value = '';
                  }}
                  className="w-full text-base"
                  style={{ color: neu.textBody }}
                />
                {photoFiles.length > 0 && (
                  <ul className="space-y-2 text-base">
                    {photoFiles.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                        style={neu.card}
                      >
                        <span className="truncate" style={{ color: neu.textMain }}>
                          {f.name}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-white"
                          style={{
                            background: 'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)',
                          }}
                          onClick={() => setPhotoFiles((p) => p.filter((_, j) => j !== i))}
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-sm" style={{ color: neu.textBody }}>
                  Llevas {photoFiles.length} de {SUBIR_PHOTO_MAX} fotos. Si no puedes subir archivos, usa la URL abajo (una imagen).
                </p>
                <label htmlFor="subir-datos-foto-url" className="sr-only">
                  URL de imagen alternativa
                </label>
                <input
                  id="subir-datos-foto-url"
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="O pega aquí la URL de una imagen"
                  className="w-full px-5 py-4 rounded-2xl outline-none bg-white/55 border border-white/60 text-base"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                />
                {(photoFiles.length > 0 || photoUrl.trim()) && (
                  <p className="text-base font-medium" style={{ color: neu.textBody }}>
                    ✓ {photoFiles.length > 0 ? `${photoFiles.length} foto(s)` : 'URL lista'}
                  </p>
                )}
              </div>
            )}

            <div style={neu.cardInset} className="p-4 rounded-3xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                Archivos
              </p>
              <div className="space-y-2">
                <label htmlFor="subir-datos-archivos-extra" className="block text-sm font-medium" style={{ color: neu.textMain }}>
                  Archivos adjuntos (máx. {EXTRA_FILE_MAX_MB}MB)
                </label>
                <p className="text-xs" style={{ color: neu.textBody }}>
                  Hasta {EXTRA_FILES_MAX} archivos (PDF, imágenes, audio corto… máx. {EXTRA_FILE_MAX_MB} MB c/u).
                </p>
                <input
                  id="subir-datos-archivos-extra"
                  type="file"
                  multiple
                  aria-label={`Seleccionar archivos complementarios (máximo ${EXTRA_FILES_MAX} archivos)`}
                  onChange={(e) => {
                    const list = Array.from(e.target.files ?? []);
                    const next: File[] = [];
                    for (const f of list) {
                      if (f.size > EXTRA_FILE_MAX_MB * 1024 * 1024) {
                        setError(`Cada archivo extra: máximo ${EXTRA_FILE_MAX_MB} MB`);
                        e.target.value = '';
                        return;
                      }
                      next.push(f);
                    }
                    if (next.length > EXTRA_FILES_MAX) {
                      setError(`Máximo ${EXTRA_FILES_MAX} archivos extra`);
                      e.target.value = '';
                      return;
                    }
                    setError('');
                    setExtraFiles(next);
                  }}
                  className="w-full text-sm"
                  style={{ color: neu.textBody }}
                />
                {extraFiles.length > 0 && (
                  <p className="text-xs" style={{ color: neu.textBody }}>
                    {extraFiles.length} archivo(s) adjunto(s)
                  </p>
                )}
              </div>
              <div className="flex items-start gap-3">
                <UserCircle className="w-6 h-6 shrink-0 text-orange-500 mt-0.5" aria-hidden />
                <div className="min-w-0 flex-1">
                  <label htmlFor="subir-datos-foto-perfil" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                    Foto de perfil (opcional, máx. {PROFILE_PHOTO_MAX_MB}MB)
                  </label>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: neu.textBody }}>
                    Si quieres, sube una imagen tuya para acompañar tu nombre cuando se publique. No es la foto de tu historia (eso va en el bloque del formato que elegiste).
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-full border-2 border-white/40 overflow-hidden bg-white/30 flex items-center justify-center shrink-0"
                      style={{ borderColor: 'rgba(255,255,255,0.35)' }}
                    >
                      {profilePhotoPreview ? (
                        <img
                          src={profilePhotoPreview}
                          alt="Vista previa de tu foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircle className="w-10 h-10 text-gray-400" aria-hidden />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 min-w-0">
                      <input
                        id="subir-datos-foto-perfil"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label="Seleccionar imagen de perfil (JPG, PNG o WebP)"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) {
                            clearProfilePhoto();
                            return;
                          }
                          if (f.size > PROFILE_PHOTO_MAX_MB * 1024 * 1024) {
                            setError(`La foto de perfil: máximo ${PROFILE_PHOTO_MAX_MB} MB`);
                            e.target.value = '';
                            return;
                          }
                          if (!/^image\/(jpeg|png|webp)$/i.test(f.type)) {
                            setError('Formato: JPG, PNG o WebP.');
                            e.target.value = '';
                            return;
                          }
                          setError('');
                          if (profileObjectUrlRef.current) {
                            URL.revokeObjectURL(profileObjectUrlRef.current);
                            profileObjectUrlRef.current = null;
                          }
                          const url = URL.createObjectURL(f);
                          profileObjectUrlRef.current = url;
                          setProfilePhotoPreview(url);
                          setProfilePhotoFile(f);
                        }}
                        className="w-full max-w-xs text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-orange-500/15 file:text-orange-700"
                        style={{ color: neu.textBody }}
                      />
                      {profilePhotoFile && (
                        <button
                          type="button"
                          onClick={() => {
                            clearProfilePhoto();
                          }}
                          className="text-xs font-medium text-left w-fit hover:underline"
                          style={{ color: neu.textBody }}
                        >
                          Quitar foto de perfil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="subir-consent-privacidad" className="flex items-start gap-3 text-sm font-medium" style={{ color: neu.textMain }}>
                <input
                  id="subir-consent-privacidad"
                  type="checkbox"
                  checked={consentPrivacyPolicy}
                  onChange={(e) => setConsentPrivacyPolicy(e.target.checked)}
                  className="mt-1 accent-orange-500"
                  aria-required="true"
                />
                <span>
                  Leí y acepto la{' '}
                  <Link href="/privacidad" className="text-orange-600 underline underline-offset-2">
                    política de privacidad
                  </Link>
                  .
                </span>
              </label>
            </div>

            {error && (
              <p id="subir-form-error-global" className="text-sm text-red-600 font-medium" role="alert">
                {error}
              </p>
            )}

            <p className="text-sm leading-relaxed text-center max-w-xl mx-auto px-2" style={{ color: neu.textBody }}>
              Tu historia quedará en revisión antes de formar parte de AlmaMundi.
            </p>

            <button
              type="button"
              disabled={!canSubmit || saving}
              aria-busy={saving}
              aria-disabled={!canSubmit || saving}
              onClick={submit}
              className="w-full py-4 rounded-full font-bold text-white text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition"
              style={{
                background: canSubmit && !saving ? 'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)' : '#9ca3af',
                boxShadow: canSubmit && !saving ? '0 4px 14px rgba(249,115,22,0.4)' : 'none',
              }}
            >
              {saving ? 'Enviando…' : 'Enviar historia'}
            </button>
          </section>
          </>
        )}

        {step === 'received' && (
          <div className="mt-2 flex w-full flex-col items-center">
            <SubmissionSuccessWithHuella
              format={fmtForSuccess}
              narrativeSeed={narrativeForHuellaSuccess}
              submissionId={lastSubmissionId}
              storyTitle={storyTitle}
              hrefSubirAnother="/subir"
              canvasIdSuffix={`main-${fmtForSuccess}-${huellaSlug}`}
            />
          </div>
        )}
      </div>

    </main>
  );
}

export default function SubirPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E0E5EC' }}>
          <p className="text-sm text-gray-500">Cargando…</p>
        </main>
      }
    >
      <SubirPageInner />
    </Suspense>
  );
}
