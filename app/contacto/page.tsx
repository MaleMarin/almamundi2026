import { HomeHardLink } from '@/components/layout/HomeHardLink';
import type { Metadata } from 'next';
import { SITE_FONT_STACK } from '@/lib/typography';

export const metadata: Metadata = {
  title: 'Contacto · AlmaMundi',
  description: 'Cómo escribir al equipo de AlmaMundi.',
};

const BG = '#e8ecf0';
const SH_LIGHT = 'rgba(255,255,255,0.85)';
const SH_DARK = 'rgba(163,177,198,0.6)';
const ORANGE = '#FF4A1C';
const TEXT_1 = '#1a2332';
const TEXT_2 = '#4a5568';
const TEXT_3 = '#8896a5';

export default function ContactoPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: BG,
        padding: '2rem 1rem 3rem',
        fontFamily: SITE_FONT_STACK,
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <HomeHardLink
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: ORANGE,
            textDecoration: 'none',
          }}
        >
          ← Volver al inicio
        </HomeHardLink>
        <h1
          style={{
            margin: '0 0 0.5rem',
            fontFamily: SITE_FONT_STACK,
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: '1.75rem',
            color: TEXT_1,
          }}
        >
          Contacto
        </h1>
        <p style={{ margin: '0 0 2rem', fontSize: '0.9rem', color: TEXT_3 }}>
          AlmaMundi · una iniciativa de Precisar
        </p>

        <section
          style={{
            marginBottom: '2rem',
            padding: '1.25rem 1.5rem',
            background: BG,
            borderRadius: 16,
            boxShadow: `5px 5px 12px ${SH_DARK}, -3px -3px 8px ${SH_LIGHT}`,
          }}
        >
          <h2
            style={{
              margin: '0 0 1rem',
              fontFamily: SITE_FONT_STACK,
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: '1.1rem',
              color: ORANGE,
            }}
          >
            Escríbenos
          </h2>
          <p
            style={{
              margin: '0 0 1rem',
              fontFamily: SITE_FONT_STACK,
              fontSize: '0.9rem',
              lineHeight: 1.65,
              color: TEXT_2,
            }}
          >
            Para dudas, prensa, privacidad o cualquier asunto del sitio, escribe a{' '}
            <a href="mailto:hola@almamundi.org" style={{ color: ORANGE, fontWeight: 600 }}>
              hola@almamundi.org
            </a>
            .
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: SITE_FONT_STACK,
              fontSize: '0.9rem',
              lineHeight: 1.65,
              color: TEXT_2,
            }}
          >
            Si quieres ejercer derechos sobre tus datos personales, usa también{' '}
            <a href="/mis-datos-personales" style={{ color: ORANGE, fontWeight: 600 }}>
              Mis datos personales
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
