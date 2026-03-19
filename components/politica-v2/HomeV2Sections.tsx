'use client';

import { motion } from 'framer-motion';
import type { ContentItem, HomeCollections } from '@/lib/content';

const MOTION_VIEW = { once: true, margin: '-80px 0px' };

function HeroSection() {
  return (
    <section className="relative min-h-[100vh] flex flex-col justify-end pb-24 md:pb-32 px-6 md:px-12 overflow-hidden bg-[#0a0a0f]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(255,69,0,0.12),transparent)]" />
      <motion.div
        className="relative z-10 max-w-5xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[var(--almamundi-orange)] text-sm md:text-base font-medium tracking-[0.3em] uppercase mb-6">
          Política Digital
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light leading-[1.08] text-white/95">
          Tecnología, políticas públicas y gobernanza digital en México.
        </h1>
        <motion.p
          className="mt-8 text-lg md:text-xl text-white/60 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Señales, experiencias, normas y análisis desde una sola capa de contenido.
        </motion.p>
      </motion.div>
      <motion.div
        className="absolute bottom-8 left-6 md:left-12 text-white/40 text-xs tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Scroll
      </motion.div>
    </section>
  );
}

function SistemaSection() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-[#0d0d12] border-t border-white/5">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={MOTION_VIEW}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <motion.h2
          className="text-3xl md:text-5xl font-light text-white/90 mb-4"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
          El sitio como sistema
        </motion.h2>
        <motion.p
          className="text-white/50 text-lg max-w-2xl mb-16"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
          Todo el contenido se organiza por metadatos: tipo, estado, temas, recencia. Sin bloques inventados ni texto fijo.
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {['experiencia', 'análisis', 'norma', 'señal', 'programa', 'licitación'].map((label, i) => (
            <motion.div
              key={label}
              className="p-4 md:p-6 rounded-xl border border-white/10 bg-white/[0.02]"
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            >
              <span className="text-[10px] md:text-xs text-[var(--almamundi-orange)] font-medium tracking-wider">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-white/80 font-medium mt-2">{label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function MexicoPorEstadoSection() {
  const states = [
    { code: 'CDMX', name: 'Ciudad de México' },
    { code: 'JAL', name: 'Jalisco' },
    { code: 'NL', name: 'Nuevo León' },
    { code: 'PUE', name: 'Puebla' },
    { code: 'VER', name: 'Veracruz' },
    { code: 'YUC', name: 'Yucatán' },
  ];
  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-[#0a0a0f] border-t border-white/5">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={MOTION_VIEW}
        transition={{ duration: 0.7 }}
      >
        <h2 className="text-2xl md:text-4xl font-light text-white/90 mb-12">
          México por estado
        </h2>
        <p className="text-white/50 text-base md:text-lg max-w-xl mb-12">
          Explora el mapa debajo: contenido y señales por entidad federativa.
        </p>
        <div className="flex flex-wrap gap-3">
          {states.map((s) => (
            <a
              key={s.code}
              href="#mapa"
              className="px-4 py-2 rounded-full border border-white/20 text-white/70 text-sm hover:border-[var(--almamundi-orange)] hover:text-[var(--almamundi-orange)] transition-colors"
            >
              {s.name}
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function ContentCard({ item, index }: { item: ContentItem; index: number }) {
  return (
    <motion.article
      className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 md:p-6 hover:border-white/20 transition-colors"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={MOTION_VIEW}
      transition={{ delay: index * 0.05 }}
    >
      <span className="text-[10px] uppercase tracking-wider text-[var(--almamundi-orange)]">
        {item.kind}
      </span>
      <h3 className="text-lg font-medium text-white/95 mt-2 group-hover:text-[var(--almamundi-orange)] transition-colors line-clamp-2">
        {item.title}
      </h3>
      <p className="text-sm text-white/50 mt-2 line-clamp-2">{item.excerpt}</p>
      <time className="text-xs text-white/40 mt-3 block">
        {new Date(item.publishedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
      </time>
    </motion.article>
  );
}

function SenalesSection({ seniales }: { seniales: ContentItem[] }) {
  if (seniales.length === 0) return null;
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-[#0d0d12] border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl md:text-5xl font-light text-white/90 mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={MOTION_VIEW}
        >
          Señales recientes
        </motion.h2>
        <p className="text-white/50 mb-12 max-w-xl">
          Últimas señales y contenido reciente del ecosistema de política digital.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seniales.map((item, i) => (
            <ContentCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienciasSection({ experiencias }: { experiencias: ContentItem[] }) {
  if (experiencias.length === 0) return null;
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-[#0a0a0f] border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl md:text-5xl font-light text-white/90 mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={MOTION_VIEW}
        >
          Experiencias destacadas
        </motion.h2>
        <p className="text-white/50 mb-12 max-w-xl">
          Casos e iniciativas de innovación pública y gobierno digital.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {experiencias.map((item, i) => (
            <ContentCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NormasAnalisisSection({ normas, analisis }: { normas: ContentItem[]; analisis: ContentItem[] }) {
  const combined = [...normas.slice(0, 2), ...analisis.slice(0, 2)].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)
  );
  if (combined.length === 0) return null;
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-[#0d0d12] border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl md:text-5xl font-light text-white/90 mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={MOTION_VIEW}
        >
          Normas y análisis
        </motion.h2>
        <p className="text-white/50 mb-12 max-w-xl">
          Marco normativo y análisis sobre gobierno digital e IA.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {combined.map((item, i) => (
            <ContentCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-[#0a0a0f] border-t border-white/5">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={MOTION_VIEW}
      >
        <h2 className="text-2xl md:text-4xl font-light text-white/90 mb-4">
          Newsletter
        </h2>
        <p className="text-white/50 mb-8">
          Recibe señales y análisis de política digital en tu correo.
        </p>
        <form
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="tu@correo.com"
            className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[var(--almamundi-orange)]"
            aria-label="Correo electrónico"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-[var(--almamundi-orange)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Suscribirse
          </button>
        </form>
      </motion.div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="py-16 px-6 md:px-12 bg-[#0a0a0f] border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-white/40 text-sm">
          Política Digital · Contenido tipado y filtrable
        </p>
        <div className="flex gap-8 text-sm">
          <a href="#mapa" className="text-white/50 hover:text-[var(--almamundi-orange)] transition-colors">
            Mapa
          </a>
          <a href="/privacidad" className="text-white/50 hover:text-[var(--almamundi-orange)] transition-colors">
            Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}

export function HomeV2Sections({
  collections,
  mapSection,
}: {
  collections: HomeCollections;
  mapSection: React.ReactNode;
}) {
  return (
    <>
      <HeroSection />
      <SistemaSection />
      <MexicoPorEstadoSection />
      {mapSection}
      <SenalesSection seniales={collections.seniales} />
      <ExperienciasSection experiencias={collections.experiencias} />
      <NormasAnalisisSection normas={collections.normas} analisis={collections.analisis} />
      <NewsletterSection />
      <FooterSection />
    </>
  );
}
