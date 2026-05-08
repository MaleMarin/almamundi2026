import { HomeHardLink } from '@/components/layout/HomeHardLink';
import { SiteBreadcrumbs } from '@/components/layout/SiteBreadcrumbs';
/**
 * /terminos — Términos de uso de AlmaMundi.
 * Mismo layout y estilo neumórfico que /privacidad.
 */

import type { Metadata } from 'next';
import { SITE_FONT_STACK } from '@/lib/typography';

export const metadata: Metadata = {
  title: 'Términos de uso · AlmaMundi',
  description: 'Condiciones de uso de la plataforma AlmaMundi operada por Precisar.',
};

const BG = '#e8ecf0';
const SH_LIGHT = 'rgba(255,255,255,0.85)';
const SH_DARK = 'rgba(163,177,198,0.6)';
const ORANGE = '#ff6b2b';
const TEXT_1 = '#1a2332';
const TEXT_2 = '#4a5568';
const TEXT_3 = '#8896a5';

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
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
        {title}
      </h2>
      <div
        style={{
          fontFamily: SITE_FONT_STACK,
          fontSize: '0.9rem',
          lineHeight: 1.65,
          color: TEXT_2,
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default function TerminosPage() {
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
        <div style={{ marginBottom: '1rem' }}>
          <SiteBreadcrumbs />
        </div>
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
          Términos de uso
        </h1>
        <p style={{ margin: 0, fontSize: '0.9rem', color: TEXT_3 }}>
          AlmaMundi · Fecha de vigencia: abril 2026
        </p>

        <Section id="s1" title="1. Quién opera este servicio">
          <p>
            AlmaMundi es una plataforma digital operada por Precisar, organización sin fines de lucro con
            presencia en Chile y México, dedicada a la cultura digital y la alfabetización mediática.
          </p>
        </Section>

        <Section id="s2" title="2. Qué se puede hacer en AlmaMundi">
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              Explorar historias publicadas en el mapa y en las galerías.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Subir una historia propia en formato video, audio, texto o fotografía.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>Guardar historias en la colección personal.</li>
            <li style={{ marginBottom: 0 }}>Participar en exposiciones y recorridos curados.</li>
          </ul>
        </Section>

        <Section id="s3" title="3. Qué no está permitido">
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              Subir contenido que vulnere derechos de terceros (imágenes, música o textos con copyright sin
              permiso).
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Publicar contenido que incite al odio, la violencia o la discriminación.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Subir material que identifique o exponga a menores sin consentimiento explícito de sus tutores
              legales.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Usar la plataforma con fines comerciales sin autorización de Precisar.
            </li>
            <li style={{ marginBottom: 0 }}>Hacerse pasar por otra persona o entidad.</li>
          </ul>
        </Section>

        <Section id="s4" title="4. Responsabilidad por el contenido">
          <p>
            Cada historia es responsabilidad de quien la sube. AlmaMundi actúa como intermediario y no se hace
            responsable del contenido generado por usuarios, aunque se reserva el derecho de moderar y retirar
            cualquier contenido que viole estas condiciones.
          </p>
        </Section>

        <Section id="s5" title="5. Moderación y curaduria">
          <p>
            Todo el contenido pasa por un proceso de revisión editorial antes de publicarse. Precisar puede
            aprobar, rechazar o retirar historias sin necesidad de justificación, respetando siempre la dignidad
            de quien las envió.
          </p>
        </Section>

        <Section id="s6" title="6. Derechos de autor">
          <p>
            Al subir una historia, el autor declara tener los derechos sobre el contenido y otorga a AlmaMundi
            una licencia no exclusiva para publicarlo en la plataforma. El autor mantiene todos sus derechos.
          </p>
        </Section>

        <Section id="s7" title="7. Modificaciones">
          <p>
            Precisar puede actualizar estos términos en cualquier momento. Los cambios se comunicarán en la
            plataforma con al menos 15 días de anticipación.
          </p>
        </Section>

        <Section id="s8" title="8. Contacto">
          <p style={{ marginBottom: '1rem' }}>
            Para consultas sobre estos términos:{' '}
            <a href="mailto:hola@precisar.cl" style={{ color: ORANGE, textDecoration: 'none' }}>
              hola@precisar.cl
            </a>
          </p>
          <p style={{ margin: 0 }}>Fecha de vigencia: abril 2026.</p>
        </Section>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: TEXT_3 }}>
          AlmaMundi · Términos de uso
        </p>
      </div>
    </main>
  );
}
