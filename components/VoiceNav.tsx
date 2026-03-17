'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { parseVoiceCommand, type VoiceAction } from '@/lib/voice/commands';

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
  : null;

function executeAction(action: VoiceAction) {
  if (action.type === 'scroll') {
    const id = action.target === 'inicio' ? 'intro' : action.target;
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (action.type === 'openDrawer') {
    window.dispatchEvent(
      new CustomEvent('almamundi:voice:openDrawer', {
        detail: { mode: action.mode, query: action.query },
      })
    );
    return;
  }
  if (action.type === 'showPurpose') {
    window.dispatchEvent(new CustomEvent('almamundi:voice:showPurpose'));
    return;
  }
  if (action.type === 'showHowItWorks') {
    window.dispatchEvent(new CustomEvent('almamundi:voice:showHowItWorks'));
    return;
  }
}

export function VoiceNav() {
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setSupported(Boolean(SpeechRecognition)));
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'es-ES';

      rec.onresult = (e: SpeechRecognitionEvent) => {
        const last = e.results.length - 1;
        const result = e.results[last];
        const transcript = (result && result[0] && (result[0] as { transcript?: string }).transcript)?.trim() ?? '';
        if (!transcript) return;
        const action = parseVoiceCommand(transcript);
        if (action) {
          setFeedback(`"${transcript}"`);
          executeAction(action);
          setTimeout(() => setFeedback(null), 2000);
        }
      };

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error !== 'aborted') setFeedback('No escuché. Intenta de nuevo.');
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      setFeedback('Escuchando…');
    } catch (err) {
      setFeedback('No se pudo activar el micrófono');
      setListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    } catch {}
    setListening(false);
    setFeedback(null);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  if (!supported) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
      {feedback && (
        <span
          className="rounded-lg bg-[#0F172A]/95 text-white text-sm px-3 py-2 shadow-lg border border-white/10 max-w-[220px] text-right"
          role="status"
          aria-live="polite"
        >
          {feedback}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label={listening ? 'Detener escucha por voz' : 'Activar navegación por voz'}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg border transition-all ${
          listening
            ? 'bg-orange-500 border-orange-400 text-white animate-pulse'
            : 'bg-[#0F172A]/90 border-white/20 text-white hover:bg-[#1e293b]'
        }`}
      >
        {listening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
    </div>
  );
}
