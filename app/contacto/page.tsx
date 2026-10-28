import { HomeHardLink } from '@/components/layout/HomeHardLink';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto · AlmaMundi',
  description: 'Cómo escribir al equipo de AlmaMundi.' };

const BG = '#e8ecf0';
const SH_LIGHT = 'rgba(255,255,255,0.85)';
const SH_DARK = 'rgba(163,177,198,0.6)';
const ORANGE = 'var(--almamundi-orange)';
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
        fontFamily: 'inherit' }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <HomeHardLink
          href="/"
          className="btn-am-neutro"
          style={{
            display: 'inline-block',
            marginBottom: '1.5rem',
            fontSize: '13.6px',
            padding: '0.45rem 0.9rem' }}
        >
          ← Volver al inicio
        </HomeHardLink>
        <h1
          style={{
            margin: '0 0 0.5rem',
            fontFamily: 'inherit',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: '25px',
            color: TEXT_1 }}
        >
          Contacto
        </h1>
        <p style={{ margin: '0 0 2rem', fontSize: '14.4px', color: TEXT_3 }}>
          AlmaMundi · una iniciativa de Precisar
        </p>

        <section
          style={{
            marginBottom: '2rem',
            padding: '1.25rem 1.5rem',
            background: BG,
            borderRadius: 16,
            boxShadow: `5px 5px 12px ${SH_DARK}, -3px -3px 8px ${SH_LIGHT}` }}
        >
          <h2
            style={{
              margin: '0 0 1rem',
              fontFamily: 'inherit',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: '16px',
              color: ORANGE }}
          >
            Escríbenos
          </h2>
          <p
            style={{
              margin: '0 0 1rem',
              fontFamily: 'inherit',
              fontSize: '14.4px',
              lineHeight: 1.65,
              color: TEXT_2 }}
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
              fontFamily: 'inherit',
              fontSize: '14.4px',
              lineHeight: 1.65,
              color: TEXT_2 }}
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
