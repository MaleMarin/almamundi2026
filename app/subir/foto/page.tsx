'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { THEME_LIST } from '@/lib/themes';

const APP_FONT = `'Avenir Light', Avenir, sans-serif`;

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E0E5EC',
    boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '40px',
  },
  inset: {
    backgroundColor: '#E0E5EC',
    boxShadow: 'inset 6px 6px 10px rgba(163,177,198,0.7), inset -6px -6px 10px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
  },
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
    fontFamily: APP_FONT,
  },
} as const;

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
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: soft.bg, fontFamily: APP_FONT }}>
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 md:px-12 h-24 bg-[#E0E5EC]/80 backdrop-blur-lg border-b border-white/20">
        <Link href="/" className="flex items-center min-h-[60px]">
          <img
            src="/logo.png"
            alt="AlmaMundi"
            className="h-20 md:h-24 w-auto object-contain select-none"
            onError={(e) => {
              const t = e.currentTarget;
              if (t.nextElementSibling) return;
              const span = document.createElement('span');
              span.className = 'text-xl font-light text-gray-600';
              span.textContent = 'AlmaMundi';
              t.style.display = 'none';
              t.parentElement?.appendChild(span);
            }}
          />
        </Link>
        <nav className="flex gap-4 text-sm font-bold text-gray-600 items-center">
          <Link href="/" className="btn-almamundi px-6 py-3 active:scale-95 rounded-full" style={soft.button}>
            Inicio
          </Link>
          <Link href="/#mapa" className="btn-almamundi px-6 py-3 active:scale-95 rounded-full" style={soft.button}>
            Mapa
          </Link>
        </nav>
      </header>

      <div className="pt-28 pb-16 px-6 md:px-12 max-w-xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: soft.textMain }}>
          Subir una foto
        </h1>
        <p className="text-base font-light mb-8" style={{ color: soft.textBody }}>
          {step === 'photo' ? 'Primero elige la imagen. Luego completarás los datos.' : 'Completa los datos. Quedará en curaduría.'}
        </p>

        {step === 'photo' && (
          <section className="space-y-6">
            <div style={soft.inset} className="p-6 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Foto (obligatorio) * — máx. {MAX_MB} MB, JPG/PNG/WebP
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFileChange}
                className="w-full text-sm"
                style={{ color: soft.textBody }}
              />
              {file && (
                <p className="mt-2 text-sm" style={{ color: soft.textBody }}>
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
          <section className="p-8 rounded-[40px] text-center" style={soft.flat}>
            <p className="text-xl font-semibold mb-2" style={{ color: soft.textMain }}>
              Enviado
            </p>
            <p className="text-base font-light mb-6" style={{ color: soft.textBody }}>
              Quedó en curaduría. Te avisaremos por email.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/subir/foto" className="btn-almamundi px-6 py-3 rounded-full font-semibold text-orange-600" style={soft.button}>
                Subir otra
              </Link>
              <Link href="/" className="btn-almamundi px-6 py-3 rounded-full font-semibold" style={{ ...soft.button, color: soft.textMain }}>
                Ir al inicio
              </Link>
            </div>
          </section>
        ) : step === 'form' ? (
          <form onSubmit={onSubmit} className="space-y-6">
            {file && (
              <div style={soft.inset} className="p-4 rounded-3xl flex items-center gap-3">
                {previewUrl && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm font-medium" style={{ color: soft.textMain }}>
                  Foto: {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => setStep('photo')}
                  className="text-sm ml-auto"
                  style={{ color: soft.textBody }}
                >
                  Cambiar
                </button>
              </div>
            )}
            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Alias (obligatorio) *
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Cómo quieres aparecer"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: soft.textMain, fontFamily: APP_FONT }}
              />
              {alias.trim().length > 0 && alias.trim().length < 2 && (
                <p className="mt-1 text-xs text-amber-700">Mínimo 2 caracteres</p>
              )}
            </div>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Email (obligatorio) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: soft.textMain, fontFamily: APP_FONT }}
              />
            </div>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
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
                      ...soft.button,
                      color: topic === t.id ? '#ff4500' : soft.textBody,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Fecha (opcional)
              </label>
              <input
                type="text"
                value={dateTaken}
                onChange={(e) => setDateTaken(e.target.value)}
                placeholder="Ej: 2024-03-15"
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50"
                style={{ color: soft.textMain, fontFamily: APP_FONT }}
              />
            </div>

            <div style={soft.inset} className="p-4 rounded-3xl">
              <label className="block text-sm font-medium mb-2" style={{ color: soft.textMain }}>
                Contexto (opcional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Breve descripción del momento..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl outline-none bg-white/50 border border-white/50 resize-y"
                style={{ color: soft.textMain, fontFamily: APP_FONT }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium p-3 rounded-2xl" style={soft.inset}>
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
    </main>
  );
}
