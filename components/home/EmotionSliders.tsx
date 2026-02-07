'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type Axis = {
  id: string;
  left: string;
  right: string;
};

const AXES: Axis[] = [
  { id: 'calma', left: 'Calma', right: 'Tensión' },
  { id: 'luz', left: 'Luz', right: 'Sombra' },
  { id: 'comunidad', left: 'Comunidad', right: 'Soledad' },
];

export default function EmotionSliders() {
  const [values, setValues] = useState<Record<string, number>>(
    AXES.reduce((acc, a) => ({ ...acc, [a.id]: 50 }), {})
  );

  return (
    <section id="explorar" className="py-16 px-6 bg-cream-100/50">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <h2
          className="font-display font-semibold text-2xl sm:text-3xl text-earth-800 text-center mb-2"
          style={{ fontFamily: 'var(--font-raleway)' }}
        >
          Explorar por emociones
        </h2>
        <p className="text-earth-600 text-center text-sm sm:text-base mb-10">
          Ajusta los ejes para filtrar historias por atmósfera. (El filtrado en el mapa se conectará en una próxima versión.)
        </p>

        <div
          className="rounded-3xl p-6 sm:p-8 space-y-8"
          style={{
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '8px 8px 24px rgba(163,177,198,0.12), -8px -8px 24px rgba(255,255,255,0.5)',
          }}
        >
          {AXES.map((axis) => (
            <div key={axis.id}>
              <div className="flex justify-between text-sm text-earth-600 mb-2">
                <span>{axis.left}</span>
                <span>{axis.right}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={values[axis.id] ?? 50}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [axis.id]: Number(e.target.value) }))
                }
                className="w-full h-3 rounded-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #94a187 0%, #94a187 ${values[axis.id]}%, rgba(240,230,220,0.8) ${values[axis.id]}%, rgba(240,230,220,0.8) 100%)`,
                  boxShadow: 'inset 2px 2px 4px rgba(163,177,198,0.2)',
                }}
              />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
