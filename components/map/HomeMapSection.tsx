'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import '@/app/mapa/mapa-ui.css';
import '@/app/mapa/liquid-metal.css';
import { MAP_STAGE_GRADIENT } from '@/lib/map-data/stage-theme';

const MapFullPage = dynamic(
  () => import('@/components/map/MapFullPage').then((mod) => mod.default),
  { ssr: false }
);

/** Drawer se corta antes del footer: nunca pasa del 88% del viewport desde el top de la sección. */
const DRAWER_MAX_VH_RATIO = 0.88;

export default function HomeMapSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [sectionTopOffset, setSectionTopOffset] = useState(0);
  const [sectionHeight, setSectionHeight] = useState(0);
  /** Si el Universo está visible en viewport (más de ~25%): permite abrir drawer y lo mantiene; si no, se cierra y no se puede abrir. */
  const [universeVisible, setUniverseVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const compute = () => {
      const r = el.getBoundingClientRect();
      const top = Math.max(0, Math.round(r.top));
      const fullHeight = Math.max(0, Math.round(r.height));
      if (typeof window === 'undefined') {
        setSectionTopOffset(top);
        setSectionHeight(fullHeight);
        return;
      }
      const vh = window.innerHeight;
      const maxByViewport = Math.floor(vh * DRAWER_MAX_VH_RATIO);
      const maxSoDrawerNotPastFooter = Math.max(0, vh - top - 24);
      setSectionTopOffset(top);
      setSectionHeight(Math.max(0, Math.min(fullHeight, maxByViewport, maxSoDrawerNotPastFooter)));
    };

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, { passive: true });
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute);
    };
  }, []);

  // Cerrar drawer cuando el usuario está arriba (hero); bloquear apertura si el Universo no está visible
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const v = entry.isIntersecting && entry.intersectionRatio > 0.25;
        setUniverseVisible(v);
      },
      { threshold: [0, 0.25, 0.5] }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative w-full h-full min-h-0 overflow-hidden"
      style={{ background: MAP_STAGE_GRADIENT }}
      data-map-embed="home"
    >
      <MapFullPage
        embedded
        sectionTopOffset={sectionTopOffset}
        sectionHeight={sectionHeight}
        universeVisible={universeVisible}
      />
    </div>
  );
}
