'use client';

import type { ReactNode } from 'react';

/**
 * Primera parte de la home del clone (header + intro + tarjetas).
 * Para copiar al repo original sin borrar nada: importar y renderizar
 * <HomeFirstPart onShowPurpose={...} onShowInspiration={...} ... /> donde quieras esa sección.
 */

const APP_FONT = `'Avenir Light', Avenir, sans-serif`;

const soft = {
  bg: '#E0E5EC',
  textMain: '#4A5568',
  textBody: '#718096',
  flat: {
    backgroundColor: '#E0E5EC',
    boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '40px'
  },
  button: {
    backgroundColor: '#E0E5EC',
    boxShadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
    fontFamily: APP_FONT
  }
} as const;

function SoftCard({
  title,
  subtitle,
  children,
  buttonLabel,
  onClick,
  delay
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  buttonLabel: string;
  onClick: () => void;
  delay: string;
}) {
  return (
    <div
      className="relative p-6 rounded-[40px] flex flex-col items-start transition-all duration-500 hover:-translate-y-2 group animate-float w-full max-w-[320px] min-h-[380px] flex-1"
      style={{ ...soft.flat, animationDelay: delay, fontFamily: APP_FONT }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-light text-gray-500">{title}</h3>
        <h2 className="text-2xl font-bold text-gray-700 leading-none">{subtitle}</h2>
      </div>
      <div className="flex-1 min-h-[72px]" />
      <div className="w-full">
        <p className="text-gray-500 leading-relaxed text-base mb-5">{children}</p>
        <button
          onClick={onClick}
          className="w-full flex justify-center px-8 py-4 rounded-full text-xs font-black tracking-widest text-orange-500 uppercase transition-all active:scale-95 group-hover:text-orange-600"
          style={soft.button}
          type="button"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export type HomeFirstPartProps = {
  onShowPurpose: () => void;
  onShowInspiration: () => void;
  onRecordVideo: () => void;
  onRecordAudio: () => void;
  onWriteStory: () => void;
  onUploadPhoto: () => void;
  /** Si la home tiene mapa más abajo, los enlaces #historias y #mapa funcionan. Si no, puedes pasar basePath ej. "/" para que Historias/Mapa vayan a "/#historias" y "/mapa". */
  basePath?: string;
};

export function HomeFirstPart({
  onShowPurpose,
  onShowInspiration,
  onRecordVideo,
  onRecordAudio,
  onWriteStory,
  onUploadPhoto,
  basePath = ''
}: HomeFirstPartProps) {
  const historiasHref = basePath ? `${basePath}#historias` : '#historias';
  const mapaHref = basePath ? `${basePath.replace(/\/$/, '')}#mapa` : '#mapa';

  return (
    <>
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-6 md:px-12 h-32 bg-[#E0E5EC]/70 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center">
          <img src="/logo.png" alt="AlmaMundi" className="h-28 md:h-36 w-auto object-contain select-none filter drop-shadow-md" />
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-bold text-gray-600 items-center">
          <button onClick={onShowPurpose} className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button} type="button">
            Propósito
          </button>
          <button onClick={onShowInspiration} className="px-8 py-4 active:scale-95 hover:text-gray-700 flex items-center gap-2" style={soft.button} type="button">
            Inspiración
          </button>
          <a href={historiasHref} className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button}>
            Historias
          </a>
          <a href={mapaHref} className="px-8 py-4 active:scale-95 hover:text-orange-600" style={soft.button}>
            Mapa
          </a>
        </nav>
      </header>

      {/* INTRO */}
      <section id="intro" className="pt-44 md:pt-52 pb-4 px-6 relative z-10 flex flex-col items-center text-center">
        <div className="max-w-6xl animate-float">
          <h1 className="text-3xl md:text-5xl font-light leading-tight mb-4" style={{ color: soft.textMain }}>
            AlmaMundi es el lugar donde tus historias no se pierden en el scroll, sino que <span className="font-semibold">despiertan otras historias.</span>
          </h1>
          <div className="w-24 h-1.5 rounded-full mx-auto mb-4 opacity-50 bg-orange-400" />
          <p className="text-lg md:text-2xl font-light max-w-4xl mx-auto leading-relaxed" style={{ color: soft.textBody }}>
            Aquí, cada relato importa. <strong>Cada historia es extraordinaria.</strong>
          </p>
        </div>
      </section>

      {/* CARDS — más aire horizontal entre cards, subidas (sin flecha) */}
      <section id="historias" className="w-full px-6 md:px-12 pt-4 pb-12 mb-20 flex flex-col md:flex-row flex-wrap gap-x-8 md:gap-x-12 gap-y-6 justify-center items-stretch relative z-10">
        <SoftCard title="Tu historia," subtitle="en primer plano" buttonLabel="GRABA TU VIDEO" onClick={onRecordVideo} delay="0s">
          A veces, una mirada lo dice todo. Anímate a <strong>grabar ese momento que te marcó</strong>, una experiencia que viviste o que alguien más te contó.
        </SoftCard>
        <SoftCard title="Dale voz" subtitle="a tu recuerdo" buttonLabel="GRABA TU AUDIO" onClick={onRecordAudio} delay="0.2s">
          Hay historias que se sienten mejor cuando solo se escuchan. <strong>Graba tu relato en audio</strong> y deja que tu voz haga el resto.
        </SoftCard>
        <SoftCard title="Ponle palabras" subtitle="a tu historia" buttonLabel="ESCRIBE TU HISTORIA" onClick={onWriteStory} delay="0.4s">
          Si lo tuyo es escribir, este es tu lugar. Tómate un respiro y <strong>cuenta tu historia a tu ritmo</strong>, palabra por palabra.
        </SoftCard>
        <SoftCard title="Tu mirada," subtitle="en una fotografía" buttonLabel="SUBE UNA FOTO" onClick={onUploadPhoto} delay="0.6s">
          A veces, una imagen guarda lo que las palabras no alcanzan.
        </SoftCard>
      </section>
    </>
  );
}
