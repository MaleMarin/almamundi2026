'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function HomeHero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Fondo: gradiente suave + textura sutil */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(165deg, #fdf8f4 0%, #f9f1ea 40%, #f0e6dc 100%)',
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233d3630' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        className="max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="font-display font-semibold text-4xl sm:text-5xl md:text-6xl text-earth-800 tracking-tight leading-tight"
          style={{ fontFamily: 'var(--font-raleway)' }}
        >
          Historias que nos unen
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-earth-600 max-w-xl mx-auto leading-relaxed">
          Un espacio para compartir, explorar y conectar a través de lo que sentimos.
        </p>
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link
            href="#explorar"
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-medium text-earth-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(255,255,255,0.6)',
              boxShadow: '8px 8px 24px rgba(163,177,198,0.2), -8px -8px 24px rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            Explorar historias
          </Link>
          <Link
            href="/classic"
            className="text-earth-600 text-sm hover:text-earth-800 underline underline-offset-2"
          >
            Experiencia anterior
          </Link>
        </motion.div>
      </motion.div>

      <motion.a
        href="#huellas"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-earth-500 hover:text-earth-700 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        aria-label="Bajar a mapa de huellas"
      >
        <ChevronDown className="w-8 h-8" />
      </motion.a>
    </section>
  );
}
