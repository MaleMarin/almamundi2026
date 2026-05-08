'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { UserCircle } from 'lucide-react';
import { SiteBreadcrumbs } from '@/components/layout/SiteBreadcrumbs';
import { SITE_NAV_PILL_LINK_CLASS } from '@/components/layout/siteNavLinkStyles';
import { neu, historiasInterior } from '@/lib/historias-neumorph';
import { AGE_RANGE_OPTIONS, type AgeRangeId } from '@/lib/subir-author-fields';

const MAX_MB = 8;
const PROFILE_MAX_MB = 8;
const EXTRA_MAX_MB = 15;

type SexOpt = 'femenino' | 'masculino' | 'no-binario' | 'prefiero-no-decir' | '';

export default function SubirFotoPage() {
  const [step, setStep] = useState<'photo' | 'form' | 'enviado'>('photo');
  const [storyTitle, setStoryTitle] = useState('');
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [pais, setPais] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<SexOpt>('');
  const [ageRange, setAgeRange] = useState<AgeRangeId | ''>('');
  const [consentPrivacyPolicy, setConsentPrivacyPolicy] = useState(false);
  const [context, setContext] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [extraAttachmentFile, setExtraAttachmentFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'subiendo' | 'error'>('idle');
  const [error, setError] = useState('');

  const canContinuePhoto = file != null && file.size <= MAX_MB * 1024 * 1024 && file.type.startsWith('image/');
  const canSubmit =
    storyTitle.trim().length >= 2 &&
    alias.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    pais.trim().length >= 2 &&
    ciudad.trim().length >= 1 &&
    ageRange !== '' &&
    consentPrivacyPolicy &&
    file != null &&
    file.size <= MAX_MB * 1024 * 1024 &&
    file.type.startsWith('image/') &&
    (profilePhotoFile == null || profilePhotoFile.size <= PROFILE_MAX_MB * 1024 * 1024) &&
    (extraAttachmentFile == null || extraAttachmentFile.size <= EXTRA_MAX_MB * 1024 * 1024);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || !file) return;
      setError('');
      if (!email.trim()) {
        setError('El correo es necesario para avisarte cuando tu historia esté en el globo.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Indica un correo válido.');
        return;
      }
      setStatus('subiendo');
      try {
        const form = new FormData();
        form.set('storyTitle', storyTitle.trim());
        form.set('alias', alias.trim());
        form.set('email', email.trim());
        form.set('pais', pais.trim());
        form.set('ciudad', ciudad.trim());
        form.set('ageRange', ageRange);
        form.set('consentPrivacyPolicy', '1');
        if (birthDate.trim()) form.set('birthDate', birthDate.trim());
        if (sex) form.set('sex', sex);
        if (context.trim()) form.set('context', context.trim());
        form.set('file', file);
        if (profilePhotoFile) form.set('profilePhoto', profilePhotoFile);
        if (extraAttachmentFile) form.set('extraAttachment', extraAttachmentFile);

        const res = await fetch('/api/submissions/photo', {
          method: 'POST',
          body: form,
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = data.detail || data.error || `Error ${res.status}`;
          setError(data.hint ? `${msg} ${data.hint}` : msg);
          setStatus('error');
          return;
        }
        setStep('enviado');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión');
        setStatus('error');
      }
    },
    [
      canSubmit,
      alias,
      email,
      pais,
      ciudad,
      ageRange,
      birthDate,
      sex,
      context,
      file,
      storyTitle,
      profilePhotoFile,
      extraAttachmentFile,
    ]
  );

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(f);
    if (f && f.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(f));
  }, [previewUrl]);

  const goToForm = useCallback(() => {
    if (!canContinuePhoto) return;
    setError('');
    setStep('form');
  }, [canContinuePhoto]);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: neu.bg, fontFamily: neu.APP_FONT }}>
      <nav className={historiasInterior.navClassName} style={historiasInterior.navBarStyle}>
        <HomeHardLink href="/" className="flex items-center flex-shrink-0 min-w-0 pr-2" aria-label="AlmaMundi — inicio">
          <img src={historiasInterior.logoSrc} alt="AlmaMundi" className={historiasInterior.logoClassName} />
        </HomeHardLink>
        <div className={historiasInterior.navLinksRowClassName}>
          <ActiveInternalNavLink href="/#historias" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.navLinkIdle }}>← Elegir formato en inicio</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#proposito" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.navLinkIdle }}>Nuestro propósito</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.navLinkIdle }}>¿Cómo funciona?</ActiveInternalNavLink>
          <Link href="/historias" className={SITE_NAV_PILL_LINK_CLASS}>
            Historias
          </Link>
          <ActiveInternalNavLink href="/subir/foto" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={neu.cardInset}>Foto</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.navLinkIdle }}>Mapa</ActiveInternalNavLink>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-xl px-4 pt-4 sm:px-6 md:px-12 md:pt-6">
        <SiteBreadcrumbs />
      </div>

      <div className="pt-8 pb-12 px-4 sm:px-6 md:px-12 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-1" style={{ color: neu.textMain }}>
          Subir una foto
        </h1>
        <p className="text-sm sm:text-base font-light mb-6" style={{ color: neu.textBody }}>
          {step === 'photo' ? 'Primero elige la imagen. Luego completarás los datos en un solo bloque.' : 'Completa los datos. Quedará en curaduría.'}
        </p>

        {step === 'photo' && (
          <section className="space-y-6">
            <div style={neu.cardInset} className="p-6 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Foto (obligatorio) * — máx. {MAX_MB} MB, JPG/PNG/WebP
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFileChange}
                className="w-full text-sm"
                style={{ color: neu.textBody }}
              />
              {file && (
                <p className="mt-2 text-sm" style={{ color: neu.textBody }}>
                  {file.name}
                  {file.size > MAX_MB * 1024 * 1024 && (
                    <span className="text-amber-700 ml-2">Máximo {MAX_MB} MB</span>
                  )}
                </p>
              )}
              {previewUrl && canContinuePhoto && (
                <div className="mt-4 rounded-2xl overflow-hidden aspect-video max-h-52 sm:max-h-64 bg-gray-200">
                  <img src={previewUrl} alt="Vista previa" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={!canContinuePhoto}
              onClick={goToForm}
              className="w-full py-4 rounded-full font-bold text-white text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition"
              style={{
                background: canContinuePhoto ? 'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)' : '#9ca3af',
                boxShadow: canContinuePhoto ? '0 4px 14px rgba(249,115,22,0.4)' : 'none',
              }}
            >
              Continuar →
            </button>
          </section>
        )}

        {step === 'enviado' ? (
          <section className="p-8 rounded-[40px] text-center" style={neu.card}>
            <p className="text-xl font-semibold mb-2" style={{ color: neu.textMain }}>
              Enviado
            </p>
            <p className="text-base font-light mb-6" style={{ color: neu.textBody }}>
              Quedó en curaduría. Te avisaremos por email.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/subir/foto" className="btn-almamundi px-6 py-3 rounded-full font-semibold text-orange-600" style={neu.button}>
                Subir otra
              </Link>
              <HomeHardLink href="/" className="btn-almamundi px-6 py-3 rounded-full font-semibold" style={{ ...neu.button, color: neu.textMain }}>
                Ir al inicio
              </HomeHardLink>
            </div>
          </section>
        ) : step === 'form' ? (
          <form onSubmit={onSubmit} className="flex flex-col gap-4 min-h-0">
            {file && (
              <div style={neu.cardInset} className="p-3 rounded-2xl flex items-center gap-3 shrink-0">
                {previewUrl && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-xs sm:text-sm font-medium truncate min-w-0" style={{ color: neu.textMain }}>
                  {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => setStep('photo')}
                  className="text-xs sm:text-sm ml-auto shrink-0"
                  style={{ color: neu.textBody }}
                >
                  Cambiar
                </button>
              </div>
            )}

            <div style={neu.cardInset} className="p-4 sm:p-5 rounded-3xl space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                La historia
              </p>
              <div>
                <label htmlFor="subir-foto-titulo" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                  Nombre de la historia *
                </label>
                <input
                  id="subir-foto-titulo"
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Título que verán si se publica"
                  className="w-full px-3 py-2 rounded-xl outline-none bg-white/50 border border-white/50 text-sm"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  autoComplete="off"
                />
                {storyTitle.trim().length > 0 && storyTitle.trim().length < 2 && (
                  <p className="mt-1 text-xs text-amber-700">Mínimo 2 caracteres</p>
                )}
              </div>
              <div>
                <label htmlFor="subir-foto-alias" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                  Nombre o alias (obligatorio) *
                </label>
                <input
                  id="subir-foto-alias"
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Cómo quieres aparecer"
                  className="w-full px-3 py-2 rounded-xl outline-none bg-white/50 border border-white/50 text-sm"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  autoComplete="nickname"
                />
                {alias.trim().length > 0 && alias.trim().length < 2 && (
                  <p className="mt-1 text-xs text-amber-700">Mínimo 2 caracteres</p>
                )}
              </div>
              <div>
                <label htmlFor="subir-foto-extras" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                  Extras / contexto (opcional)
                </label>
                <textarea
                  id="subir-foto-extras"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Breve nota sobre la imagen…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl outline-none bg-white/50 border border-white/50 resize-none text-sm"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                />
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 sm:p-5 rounded-3xl space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                Ubicación
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="subir-foto-pais" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                    País *
                  </label>
                  <input
                    id="subir-foto-pais"
                    type="text"
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    placeholder="Ej: Chile"
                    className="w-full px-3 py-2 rounded-xl outline-none bg-white/50 border border-white/50 text-sm"
                    style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                    autoComplete="country-name"
                  />
                </div>
                <div>
                  <label htmlFor="subir-foto-ciudad" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                    Ciudad o localidad *
                  </label>
                  <input
                    id="subir-foto-ciudad"
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ej: Santiago"
                    className="w-full px-3 py-2 rounded-xl outline-none bg-white/50 border border-white/50 text-sm"
                    style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                    autoComplete="address-level2"
                  />
                </div>
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 sm:p-5 rounded-3xl space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                Datos personales
              </p>
              <div>
                <label htmlFor="subir-foto-edad" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                  Tramo de edad *
                </label>
                <select
                  id="subir-foto-edad"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value as AgeRangeId | '')}
                  className="w-full px-3 py-2 rounded-xl outline-none bg-white/50 border border-white/50 text-sm"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
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
                  <label htmlFor="subir-foto-nacimiento" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                    Fecha de nacimiento (opcional)
                  </label>
                  <input
                    id="subir-foto-nacimiento"
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="Ej: 1990-04-12"
                    className="w-full px-3 py-2 rounded-xl outline-none bg-white/50 border border-white/50 text-sm"
                    style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  />
                </div>
                <div>
                  <label htmlFor="subir-foto-genero" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                    Género (opcional)
                  </label>
                  <select
                    id="subir-foto-genero"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as SexOpt)}
                    className="w-full px-3 py-2 rounded-xl outline-none bg-white/50 border border-white/50 text-sm"
                    style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  >
                    <option value="">Prefiero no indicar</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="no-binario">No binario</option>
                    <option value="prefiero-no-decir">Otro / no decir</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 sm:p-5 rounded-3xl space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                Contacto
              </p>
              <div>
                <label htmlFor="subir-foto-email" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                  Correo electrónico *
                </label>
                <input
                  id="subir-foto-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error === 'El correo es necesario para avisarte cuando tu historia esté en el globo.') setError('');
                  }}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 rounded-xl outline-none bg-white/50 border border-white/50 text-sm"
                  style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
                  autoComplete="email"
                />
                <p className="mt-1 text-[11px] leading-snug" style={{ color: neu.textBody }}>
                  Te avisaremos por correo cuando tu historia esté en el globo. No se muestra en público.
                </p>
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 sm:p-5 rounded-3xl space-y-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: neu.textBody }}>
                Archivos
              </p>
              <div>
                <label htmlFor="subir-foto-extra" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                  Archivos adjuntos (máx. {EXTRA_MAX_MB}MB)
                </label>
                <p className="text-xs mb-2" style={{ color: neu.textBody }}>
                  Un archivo opcional (imagen JPG/PNG/WebP o audio MP3/M4A/WebM).
                </p>
                <input
                  id="subir-foto-extra"
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > EXTRA_MAX_MB * 1024 * 1024) {
                      setError(`El adjunto: máximo ${EXTRA_MAX_MB} MB`);
                      e.target.value = '';
                      setExtraAttachmentFile(null);
                      return;
                    }
                    setError('');
                    setExtraAttachmentFile(f);
                  }}
                  className="w-full text-sm"
                  style={{ color: neu.textBody }}
                />
                {extraAttachmentFile && (
                  <p className="mt-1 text-xs" style={{ color: neu.textBody }}>
                    {extraAttachmentFile.name}
                    <button
                      type="button"
                      className="ml-2 underline"
                      style={{ color: neu.textMain }}
                      onClick={() => setExtraAttachmentFile(null)}
                    >
                      Quitar
                    </button>
                  </p>
                )}
              </div>
              <div className="flex items-start gap-3">
                <UserCircle className="w-6 h-6 shrink-0 text-orange-500 mt-0.5" aria-hidden />
                <div className="min-w-0 flex-1">
                  <label htmlFor="subir-foto-perfil" className="block text-sm font-medium mb-1" style={{ color: neu.textMain }}>
                    Foto de perfil (opcional, máx. {PROFILE_MAX_MB}MB)
                  </label>
                  <p className="text-xs mb-2 leading-relaxed" style={{ color: neu.textBody }}>
                    Imagen tuya para acompañar tu nombre; no sustituye la foto de la historia.
                  </p>
                  <input
                    id="subir-foto-perfil"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      if (f && f.size > PROFILE_MAX_MB * 1024 * 1024) {
                        setError(`La foto de perfil: máximo ${PROFILE_MAX_MB} MB`);
                        e.target.value = '';
                        setProfilePhotoFile(null);
                        return;
                      }
                      setError('');
                      setProfilePhotoFile(f);
                    }}
                    className="w-full text-sm"
                    style={{ color: neu.textBody }}
                  />
                  {profilePhotoFile && (
                    <p className="mt-1 text-xs" style={{ color: neu.textBody }}>
                      {profilePhotoFile.name}
                      <button
                        type="button"
                        className="ml-2 underline"
                        style={{ color: neu.textMain }}
                        onClick={() => setProfilePhotoFile(null)}
                      >
                        Quitar
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm" style={{ color: neu.textMain }}>
              <input
                type="checkbox"
                checked={consentPrivacyPolicy}
                onChange={(e) => setConsentPrivacyPolicy(e.target.checked)}
                className="mt-0.5 accent-orange-500 shrink-0"
              />
              <span>
                Leí y acepto la{' '}
                <Link href="/privacidad" className="text-orange-600 underline underline-offset-2">
                  política de privacidad
                </Link>
                .
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-600 font-medium p-3 rounded-2xl" style={neu.cardInset}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || status === 'subiendo'}
              className="w-full py-3.5 rounded-full font-bold text-white text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
              style={{
                background: canSubmit && status !== 'subiendo' ? 'linear-gradient(180deg, #ff4500 0%, #e63e00 100%)' : '#9ca3af',
                boxShadow: canSubmit && status !== 'subiendo' ? '0 4px 14px rgba(249,115,22,0.4)' : 'none',
              }}
            >
              {status === 'subiendo' ? 'Subiendo…' : 'Enviar'}
            </button>
          </form>
        ) : null}
      </div>

      <div className="border-t border-gray-400/50 pt-10 md:pt-14">
      </div>
    </main>
  );
}
