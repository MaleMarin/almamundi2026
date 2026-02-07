'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import LetterEditor from '@/components/LetterEditor';

/* Contenido de ejemplo por slug (luego conectar a backend) */
const STORY_MOCK: Record<string, { title: string; excerpt: string; body: string }> = {
  raices: { title: 'Raíces', excerpt: 'De dónde venimos.', body: 'El camino se hace al andar. Cada paso nos acerca o nos aleja de lo que fuimos.' },
  'el-viaje': { title: 'El viaje', excerpt: 'Caminos que se cruzan.', body: 'En cada estación alguien sube y alguien baja. Nosotros seguimos.' },
  default: { title: 'Historia', excerpt: 'Un fragmento.', body: 'Contenido de la historia. Aquí irá el texto desde el backend.' },
};

export default function StoryPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [showLetterEditor, setShowLetterEditor] = useState(false);

  const story = STORY_MOCK[id] ?? STORY_MOCK.default;

  const handleLetterSubmit = (content: string, toStoryId: string) => {
    console.log('Carta enviada a historia', toStoryId, content);
    setShowLetterEditor(false);
    // Aquí: POST a API para guardar la carta y vincularla a la historia
  };

  return (
    <div className="min-h-screen bg-[#E8ECF1] text-[#4A5568] font-[system-ui,sans-serif] antialiased">
      <header
        className="sticky top-0 z-20 px-4 py-4 md:px-8"
        style={{
          background: 'rgba(232,236,241,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 4px 24px rgba(163,177,198,0.12)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#E8ECF1',
              boxShadow: '8px 8px 16px rgba(163,177,198,0.5), -8px -8px 16px rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            <ArrowLeft className="w-5 h-5 text-[#718096]" />
            <span className="text-sm font-medium">Volver</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:px-8">
        <article
          className="rounded-3xl p-6 md:p-8 mb-8"
          style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '9px 9px 22px rgba(163,177,198,0.35), -9px -9px 22px rgba(255,255,255,0.5)',
          }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-[#4A5568] tracking-tight">
            {story.title}
          </h1>
          <p className="text-[#718096] text-sm mt-2">{story.excerpt}</p>
          <div className="mt-6 text-[#4A5568] leading-relaxed whitespace-pre-wrap">
            {story.body}
          </div>
        </article>

        {/* Botón "Escribir carta en respuesta" */}
        <section className="mb-8">
          {!showLetterEditor ? (
            <button
              type="button"
              onClick={() => setShowLetterEditor(true)}
              className="w-full rounded-2xl p-4 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: '#E8ECF1',
                boxShadow: '8px 8px 18px rgba(163,177,198,0.5), -8px -8px 18px rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
            >
              <Mail className="w-5 h-5 text-[#718096]" />
              <span className="font-medium text-[#4A5568]">Escribir carta en respuesta</span>
            </button>
          ) : (
            <div className="space-y-4">
              <LetterEditor
                parentStoryId={id}
                parentStoryTitle={story.title}
                onSubmit={handleLetterSubmit}
              />
              <button
                type="button"
                onClick={() => setShowLetterEditor(false)}
                className="text-sm text-[#718096] underline"
              >
                Cancelar
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="px-4 py-8 text-center text-[#718096] text-sm">
        AlmaMundi · Tus historias no se pierden en el scroll
      </footer>
    </div>
  );
}
