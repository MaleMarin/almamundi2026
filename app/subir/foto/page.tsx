'use client';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { ActiveInternalNavLink } from '@/components/layout/ActiveInternalNavLink';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { THEME_LIST } from '@/lib/themes';
import { Footer } from '@/components/layout/Footer';
import { HistoriasAccordion } from '@/components/layout/HistoriasAccordion';
import { neu, historiasInterior } from '@/lib/historias-neumorph';

const MAX_MB = 8;

export default function SubirFotoPage() {
  const [step, setStep] = useState<'photo' | 'form' | 'enviado'>('photo');
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [dateTaken, setDateTaken] = useState('');
  const [context, setContext] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'subiendo' | 'error'>('idle');
  const [error, setError] = useState('');

  const canContinuePhoto = file != null && file.size <= MAX_MB * 1024 * 1024 && file.type.startsWith('image/');
  const canSubmit =
    alias.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    THEME_LIST.some((t) => t.id === topic) &&
    file != null &&
    file.size <= MAX_MB * 1024 * 1024 &&
    file.type.startsWith('image/');

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || !file) return;
      setError('');
      setStatus('subiendo');
      try {
        const form = new FormData();
        form.set('alias', alias.trim());
        form.set('email', email.trim());
        form.set('topic', topic);
        if (dateTaken.trim()) form.set('dateTaken', dateTaken.trim());
        if (context.trim()) form.set('context', context.trim());
        form.set('file', file);

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
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error de conexión');
        setStatus('error');
      }
    },
    [canSubmit, alias, email, topic, dateTaken, context, file]
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
          <ActiveInternalNavLink href="/#historias" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>← Elegir formato en inicio</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#intro" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>Nuestro propósito</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#como-funciona" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textBody }}>¿Cómo funciona?</ActiveInternalNavLink>
          <HistoriasAccordion variant="header" buttonStyle={{ ...neu.button, color: neu.textBody }} className="[&_button]:btn-almamundi" />
          <ActiveInternalNavLink href="/subir/foto" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={neu.cardInset}>Foto</ActiveInternalNavLink>
          <ActiveInternalNavLink href="/#mapa" className="btn-almamundi px-4 py-2.5 rounded-full text-sm md:text-[0.9375rem]" style={{ ...neu.button, color: neu.textMain }}>Mapa</ActiveInternalNavLink>
        </div>
      </nav>

      <div className="pt-10 pb-16 px-6 md:px-12 max-w-xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: neu.textMain }}>
          Subir una foto
        </h1>
        <p className="text-base font-light mb-8" style={{ color: neu.textBody }}>
          {step === 'photo' ? 'Primero elige la imagen. Luego completarás los datos.' : 'Completa los datos. Quedará en curaduría.'}
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
                <div className="mt-4 rounded-2xl overflow-hidden aspect-video max-h-64 bg-gray-200">
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
          <form onSubmit={onSubmit} className="space-y-6">
            {file && (
              <div style={neu.cardInset} className="p-4 rounded-3xl flex items-center gap-3">
                {previewUrl && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm font-medium" style={{ color: neu.textMain }}>
                  Foto: {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => setStep('photo')}
                  className="text-sm ml-auto"
                  style={{ color: neu.textBody }}
                >
                  Cambiar
                </button>
              </div>
            )}
            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Alias (obligatorio) *
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Cómo quieres aparecer"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
              {alias.trim().length > 0 && alias.trim().length < 2 && (
                <p className="mt-1 text-xs text-amber-700">Mínimo 2 caracteres</p>
              )}
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Email (obligatorio) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Tema (obligatorio) *
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {THEME_LIST.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopic(t.id)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                    style={{
                      ...neu.button,
                      color: topic === t.id ? '#ff4500' : neu.textBody,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Fecha (opcional)
              </label>
              <input
                type="text"
                value={dateTaken}
                onChange={(e) => setDateTaken(e.target.value)}
                placeholder="Ej: 2024-03-15"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
            </div>

            <div style={neu.cardInset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: neu.textMain }}>
                Contexto (opcional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Breve descripción del momento..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50 resize-y"
                style={{ color: neu.textMain, fontFamily: neu.APP_FONT }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium p-3 rounded-2xl" style={neu.cardInset}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || status === 'subiendo'}
              className="w-full py-4 rounded-full font-bold text-white text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition"
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
        <Footer />
      </div>
    </main>
  );
}
