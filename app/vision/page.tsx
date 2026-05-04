import type { CSSProperties } from 'react';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
import type { Metadata } from 'next';
import { SITE_FONT_STACK } from '@/lib/typography';

export const metadata: Metadata = {
  title: 'La visión de AlmaMundi',
  description:
    'Hacia dónde va AlmaMundi: memoria viva de relatos, mapa y caminos futuros, con honestidad sobre lo que ya existe y lo que viene.',
};

const BG = '#e8ecf0';
const SH_LIGHT = 'rgba(255,255,255,0.85)';
const SH_DARK = 'rgba(163,177,198,0.6)';
const ORANGE = '#ff6b2b';
const TEXT_1 = '#1a2332';
const TEXT_2 = '#4a5568';
const TEXT_3 = '#8896a5';

type RoadmapStatus = 'disponible' | 'desarrollo' | 'futuro';

const STATUS_LABEL: Record<RoadmapStatus, string> = {
  disponible: 'Disponible',
  desarrollo: 'En desarrollo',
  futuro: 'A futuro',
};

const STATUS_STYLE: Record<RoadmapStatus, CSSProperties> = {
  disponible: {
    display: 'inline-block',
    padding: '0.15rem 0.55rem',
    fontSize: '0.68rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    borderRadius: 999,
    color: '#9a3412',
    background: 'rgba(249, 115, 22, 0.14)',
    border: '1px solid rgba(249, 115, 22, 0.28)',
  },
  desarrollo: {
    display: 'inline-block',
    padding: '0.15rem 0.55rem',
    fontSize: '0.68rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    borderRadius: 999,
    color: '#334155',
    background: 'rgba(71, 85, 105, 0.12)',
    border: '1px solid rgba(100, 116, 139, 0.28)',
  },
  futuro: {
    display: 'inline-block',
    padding: '0.15rem 0.55rem',
    fontSize: '0.68rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    borderRadius: 999,
    color: '#4b5563',
    background: 'rgba(107, 114, 128, 0.12)',
    border: '1px solid rgba(156, 163, 175, 0.35)',
  },
};

const ROADMAP: { title: string; status: RoadmapStatus; body: string }[] = [
  {
    title: 'Historias que no se pierden',
    status: 'disponible',
    body: 'Relatos en audio, texto, fotografía o video que no quedan enterrados en un feed. Cada historia se revisa, se cuida y puede encontrar un lugar en esta colección viva.',
  },
  {
    title: 'Mapa vivo',
    status: 'disponible',
    body: 'Un globo donde cada historia puede aparecer como una señal humana conectada a un lugar. No es solo una ubicación: es una memoria que puede despertar otra.',
  },
  {
    title: 'Recorridos de memoria',
    status: 'desarrollo',
    body: 'Rutas futuras que conecten historias por temas, emociones o territorios: partir, volver, cuidar, migrar, perder, amar, resistir, empezar de nuevo.',
  },
  {
    title: 'Exposiciones digitales',
    status: 'futuro',
    body: 'Muestras curatoriales hechas a partir de historias seleccionadas. Una forma de transformar relatos dispersos en experiencias con sentido.',
  },
  {
    title: 'Memoria sonora',
    status: 'futuro',
    body: 'Un espacio para voces, pausas, acentos y formas de contar. Porque una historia no vive solo en lo que dice, sino también en cómo suena.',
  },
  {
    title: 'Legado familiar',
    status: 'futuro',
    body: 'Herramientas futuras para ordenar recuerdos, fotografías, testimonios y líneas de tiempo familiares.',
  },
  {
    title: 'Memoria de comunidades',
    status: 'futuro',
    body: 'Proyectos con barrios, escuelas, organizaciones y territorios que quieran construir memoria colectiva desde sus propias voces.',
  },
  {
    title: 'Proyectos educativos',
    status: 'futuro',
    body: 'Materiales para aprender a escuchar, entrevistar, documentar y compartir historias con cuidado ético.',
  },
  {
    title: 'Mapa de señales',
    status: 'desarrollo',
    body: 'Una herramienta futura para reflexionar antes de compartir: qué estoy contando, a quién menciono, qué permisos necesito, qué riesgos debo cuidar.',
  },
  {
    title: 'Postales de memoria',
    status: 'futuro',
    body: 'Fragmentos de historias compartidos con intención: una frase, una imagen, una voz o una memoria breve que invite a descubrir el relato completo.',
  },
  {
    title: 'Publicaciones',
    status: 'futuro',
    body: 'Cuadernos, informes o libros digitales basados en las historias reunidas, cuando existan suficientes relatos para leer patrones, preguntas y memorias comunes.',
  },
  {
    title: 'Observatorio de historias humanas',
    status: 'futuro',
    body: 'Una lectura ética de los temas, emociones y señales que emergen de las historias reunidas: no para convertir personas en datos, sino para comprender mejor lo que nos atraviesa.',
  },
];

export default function VisionPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: BG,
        padding: '2rem 1rem 3.5rem',
        fontFamily: SITE_FONT_STACK,
      }}
    >
      <article style={{ maxWidth: 720, margin: '0 auto' }}>
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

        <header style={{ marginBottom: '2.25rem' }}>
          <p
            style={{
              margin: '0 0 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TEXT_3,
            }}
          >
            AlmaMundi
          </p>
          <h1
            style={{
              margin: '0 0 0.65rem',
              fontFamily: SITE_FONT_STACK,
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              lineHeight: 1.2,
              color: TEXT_1,
            }}
          >
            La visión de AlmaMundi
          </h1>
          <p
            style={{
              margin: '0 0 1.25rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#9a3412',
            }}
          >
            Beta pública — esta hoja de ruta puede actualizarse mientras el proyecto avanza.
          </p>
          <div
            style={{
              fontFamily: SITE_FONT_STACK,
              fontSize: '0.95rem',
              lineHeight: 1.72,
              color: TEXT_2,
            }}
          >
            <p style={{ margin: '0 0 1.1rem' }}>
              AlmaMundi nace de una idea simple: que las historias humanas no deberían perderse en el scroll.
            </p>
            <p style={{ margin: '0 0 1.1rem' }}>
              Cada relato puede abrir otro. Una memoria puede conectar con una ciudad, una emoción, una fotografía,
              una voz o una experiencia parecida en otro lugar del mundo.
            </p>
            <p style={{ margin: '0 0 1.1rem' }}>
              Por eso estamos construyendo una memoria viva de relatos: un espacio donde las historias no se acumulan como contenido
              pasajero, sino que se cuidan, se organizan y pueden despertar nuevas historias.
            </p>
            <p style={{ margin: '0 0 1.1rem' }}>
              En esta primera etapa, AlmaMundi permite compartir relatos en audio, texto, fotografía o video, siempre
              con revisión editorial antes de publicarse. A futuro, queremos que esta colección crezca hacia recorridos
              de memoria, exposiciones digitales, legados familiares, proyectos educativos, memorias comunitarias,
              publicaciones y herramientas para compartir con más conciencia.
            </p>
            <p style={{ margin: 0 }}>
              AlmaMundi empieza como un mapa. Quiere convertirse en una memoria compartida.
            </p>
          </div>
        </header>

        <section
          aria-labelledby="vision-construccion"
          style={{
            marginBottom: '2rem',
            padding: '1.35rem 1.5rem 1.5rem',
            background: BG,
            borderRadius: 16,
            boxShadow: `5px 5px 12px ${SH_DARK}, -3px -3px 8px ${SH_LIGHT}`,
          }}
        >
          <h2
            id="vision-construccion"
            style={{
              margin: '0 0 1.25rem',
              fontFamily: SITE_FONT_STACK,
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: '1.1rem',
              color: ORANGE,
            }}
          >
            Lo que estamos construyendo
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '1rem',
            }}
          >
            {ROADMAP.map((item, i) => (
              <div
                key={item.title}
                style={{
                  padding: '1.1rem 1.2rem',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.35)',
                  border: '1px solid rgba(255,255,255,0.55)',
                  boxShadow: `inset 1px 1px 3px ${SH_LIGHT}, inset -1px -1px 4px ${SH_DARK}`,
                }}
              >
                <h3
                  style={{
                    margin: '0 0 0.55rem',
                    fontFamily: SITE_FONT_STACK,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: TEXT_1,
                    lineHeight: 1.45,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'baseline',
                    gap: '0.35rem',
                  }}
                >
                  <span>
                    <span style={{ color: TEXT_3, fontWeight: 500 }}>{i + 1}. </span>
                    {item.title}
                  </span>
                  <span style={STATUS_STYLE[item.status]}>{STATUS_LABEL[item.status]}</span>
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontFamily: SITE_FONT_STACK,
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                    color: TEXT_2,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer
          style={{
            marginTop: '0.5rem',
            padding: '1.35rem 1.5rem',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.28)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: `5px 5px 12px ${SH_DARK}, -3px -3px 8px ${SH_LIGHT}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: SITE_FONT_STACK,
              fontSize: '0.95rem',
              lineHeight: 1.72,
              fontStyle: 'italic',
              color: TEXT_2,
            }}
          >
            No estamos construyendo otra red social. Estamos construyendo un lugar para que las historias salgan del
            scroll y encuentren memoria, conexión y cuidado.
          </p>
        </footer>
      </article>
    </main>
  );
}
