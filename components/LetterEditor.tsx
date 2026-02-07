'use client';

import { useState } from 'react';
import { Send, Mail } from 'lucide-react';

type LetterEditorProps = {
  /** ID o slug de la historia a la que se responde */
  parentStoryId: string;
  parentStoryTitle?: string;
  /** Al publicar, se conecta la carta a la historia madre */
  onSubmit?: (content: string, toStoryId: string) => void;
};

export default function LetterEditor({
  parentStoryId,
  parentStoryTitle = 'Esta historia',
  onSubmit,
}: LetterEditorProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    onSubmit?.(content, parentStoryId);
  };

  return (
    <div
      className="rounded-3xl overflow-hidden max-w-2xl mx-auto"
      style={{
        background: 'rgba(255,252,240,0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(210,180,140,0.4)',
        boxShadow: 'inset 4px 4px 16px rgba(200,180,150,0.15), 12px 12px 32px rgba(163,177,198,0.35)',
      }}
    >
      {/* Encabezado tipo postal */}
      <div
        className="px-6 py-4 border-b"
        style={{
          borderColor: 'rgba(210,180,140,0.35)',
          background: 'rgba(255,250,235,0.6)',
        }}
      >
        <div className="flex items-center gap-2 text-[#6B5344]">
          <Mail className="w-5 h-5 opacity-80" />
          <span className="text-sm font-medium">Carta en respuesta a</span>
        </div>
        <p className="mt-1 text-[#4A5568] font-semibold">{parentStoryTitle}</p>
      </div>

      <div className="p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu carta aquí..."
          rows={12}
          className="w-full rounded-xl px-4 py-3 text-[#4A5568] placeholder-[#718096]/70 resize-y focus:outline-none focus:ring-2 focus:ring-amber-400/30 font-serif text-base leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(210,180,140,0.3)',
            boxShadow: 'inset 2px 2px 8px rgba(200,180,150,0.1)',
          }}
        />

        <button
          type="button"
          onClick={handleSubmit}
          className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-[#4A5568] transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: '#E8ECF1',
            boxShadow: '6px 6px 14px rgba(163,177,198,0.45), -6px -6px 14px rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.4)',
          }}
        >
          <Send className="w-4 h-4" />
          Enviar carta
        </button>
      </div>
    </div>
  );
}
