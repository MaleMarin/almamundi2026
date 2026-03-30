'use client';

/**
 * Nodo de luz tipo “ciudad nocturna”: núcleo #FFD700 + bloom CSS en capas + pulso suave.
 * Úsalo en leyendas, tooltips o UI fuera del canvas WebGL (no sustituye luces del globo 3D).
 */

import styles from '@/components/globe/globe-earth-night.module.css';

export function CityLightNode({ className }: { className?: string }) {
  return (
    <span
      className={[styles.cityLight, className].filter(Boolean).join(' ')}
      aria-hidden
    />
  );
}
