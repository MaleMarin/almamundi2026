'use client';

import { motion } from 'framer-motion';

type PlaceholderSectionProps = {
  id: string;
  title: string;
  description: string;
};

/**
 * Sección reservada para funcionalidad futura.
 * Completar cuando se implemente: Cartas entre historias, Historias mutantes,
 * Remix narrativo, Sugerencias por inspiración, Noticias humanas en vivo.
 */
export default function PlaceholderSection({ id, title, description }: PlaceholderSectionProps) {
  return (
    <motion.section
      id={id}
      className="py-12 px-6 border-t border-cream-200/80"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2
          className="font-display font-semibold text-xl text-earth-700 mb-2"
          style={{ fontFamily: 'var(--font-raleway)' }}
        >
          {title}
        </h2>
        <p className="text-earth-600 text-sm">{description}</p>
        <p className="mt-3 text-earth-500 text-xs italic">
          (Espacio reservado para implementación futura.)
        </p>
      </div>
    </motion.section>
  );
}
