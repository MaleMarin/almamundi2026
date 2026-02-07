'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PenLine, BookOpen, Newspaper } from 'lucide-react';

const LINKS = [
  {
    href: '/classic',
    label: 'Escribe tu historia',
    description: 'Comparte tu relato con la comunidad.',
    icon: PenLine,
  },
  {
    href: '/explora',
    label: 'Explora historias',
    description: 'Un mapa de emociones vivas: relatos por tono emocional.',
    icon: BookOpen,
  },
  {
    href: '#noticias',
    label: 'Noticias del mundo',
    description: 'Eventos que conectan con nuestras emociones.',
    icon: Newspaper,
  },
];

export default function QuickLinks() {
  return (
    <section className="py-16 px-6">
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <h2
          className="font-display font-semibold text-2xl sm:text-3xl text-earth-800 text-center mb-10"
          style={{ fontFamily: 'var(--font-raleway)' }}
        >
          Accesos directos
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {LINKS.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Link
                href={link.href}
                className="block rounded-2xl p-6 h-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                  boxShadow: '8px 8px 20px rgba(163,177,198,0.12), -8px -8px 20px rgba(255,255,255,0.5)',
                }}
              >
                <link.icon className="w-8 h-8 text-ochre-400 mb-3" aria-hidden />
                <h3 className="font-semibold text-earth-800">{link.label}</h3>
                <p className="text-sm text-earth-600 mt-1">{link.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
