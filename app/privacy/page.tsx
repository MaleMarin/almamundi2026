'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
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
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600/80" aria-hidden />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: '#4A5568' }}>
              Política de Privacidad
            </h1>
          </div>
          <div className="w-[100px] md:w-[120px]" aria-hidden />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10">
        <div
          className="rounded-3xl p-6 md:p-8 space-y-8"
          style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '9px 9px 22px rgba(163,177,198,0.35), -9px -9px 22px rgba(255,255,255,0.5)',
          }}
        >
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#4A5568] mb-3">
              <FileText className="w-5 h-5 text-amber-600/80" />
              Qué datos recopilamos y para qué
            </h2>
            <p className="text-[#718096] text-sm leading-relaxed">
              En AlmaMundi recopilamos las historias que publicas, las interacciones (likes, respuestas, cartas) y los datos técnicos necesarios para el funcionamiento del sitio (por ejemplo, dirección IP anonimizada para seguridad). Usamos estos datos para mostrar tu red de historias, sugerir historias similares y mejorar la experiencia. No vendemos tus datos a terceros.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#4A5568] mb-3">
              <Eye className="w-5 h-5 text-amber-600/80" />
              Anonimato
            </h2>
            <p className="text-[#718096] text-sm leading-relaxed">
              Puedes publicar historias de forma anónima si así lo eliges. En ese caso, no asociamos tu identidad con el contenido. Las conexiones entre historias (inspiración, citas, continuaciones) pueden mostrarse sin revelar quién escribió cada una, según la configuración que elijas.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#4A5568] mb-3">
              <Shield className="w-5 h-5 text-amber-600/80" />
              Moderación
            </h2>
            <p className="text-[#718096] text-sm leading-relaxed">
              Nos reservamos el derecho de moderar contenido que vulnere nuestras normas de comunidad (discurso de odio, acoso, spam). Las historias pueden ser reportadas por la comunidad y revisadas por el equipo. En caso de eliminación, se notificará al autor cuando sea posible.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#4A5568] mb-3">
              <Lock className="w-5 h-5 text-amber-600/80" />
              Medidas técnicas
            </h2>
            <p className="text-[#718096] text-sm leading-relaxed">
              Utilizamos HTTPS para todas las conexiones, cabeceras de seguridad recomendadas y buenas prácticas para no exponer datos sensibles. No compartimos tus datos con terceros para publicidad ni los usamos para perfiles publicitarios fuera de AlmaMundi.
            </p>
          </section>

          <p className="text-[#718096] text-xs pt-4 border-t border-[#718096]/20">
            Última actualización: febrero 2026. Para consultas: ver página de contacto del sitio.
          </p>
        </div>
      </main>

      <footer className="px-4 py-8 text-center text-[#718096] text-sm">
        AlmaMundi · Política de Privacidad
      </footer>
    </div>
  );
}
