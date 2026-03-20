/**
 * /privacidad — Política de privacidad de AlmaMundi.
 * Enlazada desde AgeGate (#s5) y footer. Estilo neumórfico.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_FONT_STACK } from '@/lib/typography';

export const metadata: Metadata = {
  title: 'Política de privacidad · AlmaMundi',
  description:
    'Cómo AlmaMundi protege tus datos y las reglas de participación.',
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

export default function PrivacidadPage() {
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
        <Link
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
        </Link>
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
          Política de privacidad
        </h1>
        <p style={{ margin: 0, fontSize: '0.9rem', color: TEXT_3 }}>
          AlmaMundi · Última actualización: 2025
        </p>

        <Section id="s1" title="1. Quiénes somos">
          <p>
            AlmaMundi es una plataforma de historias humanas. Recopilamos y publicamos
            relatos en formato video, audio, texto y fotografía, con el objetivo de
            conectar experiencias y preservar memorias de forma respetuosa con las
            personas y sus datos.
          </p>
        </Section>

        <Section id="s2" title="2. Qué datos recopilamos">
          <p>
            Recopilamos los datos que tú nos proporcionas al participar: nombre o
            seudónimo, correo electrónico (para contacto y moderación), y el contenido
            que subes (historias, imágenes, audio, video). También podemos recopilar
            datos técnicos de uso (por ejemplo, tipo de dispositivo, idioma) para
            mejorar el servicio. No vendemos tus datos personales.
          </p>
        </Section>

        <Section id="s3" title="3. Cómo usamos tus datos">
          <p>
            Usamos tus datos para publicar y curar las historias que envías, para
            contactarte en caso de revisión o problemas con tu contenido, y para
            cumplir con la ley. Los datos de uso nos ayudan a mejorar la plataforma.
            Solo compartimos datos con terceros cuando sea necesario para el
            funcionamiento del servicio o por obligación legal.
          </p>
        </Section>

        <Section id="s4" title="4. El proceso de curación">
          <p>
            Todas las historias pasan por un proceso de revisión (curación) antes de
            publicarse. Un equipo revisa que el contenido cumpla nuestras normas y que
            no ponga en riesgo a nadie. Podemos solicitar ajustes o rechazar contenido
            que no cumpla los criterios. Las decisiones se registran de forma interna
            para transparencia y mejora continua.
          </p>
        </Section>

        <Section id="s5" title="5. Participación de personas menores de edad">
          <p style={{ marginBottom: '1rem' }}>
            La participación de personas menores de 18 años está limitada para
            proteger su seguridad e identidad. Las reglas por formato son:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.8rem',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: `inset 2px 2px 4px ${SH_DARK}, inset -2px -2px 4px ${SH_LIGHT}`,
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(255,107,43,0.12)' }}>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', color: TEXT_1 }}>Formato</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', color: TEXT_1 }}>Mayores 18</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', color: TEXT_1 }}>Menores 18</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', color: TEXT_1 }}>Condiciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Video</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Sí</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>No</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>No permitido</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Audio</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Sí</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Con cond.</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Sin datos personales</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Escritura</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Sí</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Sí</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Sin datos personales</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Foto propia</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Sí</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>No</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>No permitido</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Foto otros</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Sí</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Con cond.</td>
                  <td style={{ padding: '0.5rem', borderTop: `1px solid ${SH_DARK}` }}>Sin menores, con autorización</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: '1rem' }}>
            Si eres menor de edad, no incluyas datos que permitan identificarte o
            localizarte. Puedes usar seudónimo. Tu historia pasará por revisión
            especial antes de publicarse.
          </p>
        </Section>

        <Section id="s6" title="6. Fotografías y derechos de imagen">
          <p>
            Si subes fotografías en las que aparecen otras personas, debes tener su
            autorización o asegurarte de que no se vulneran sus derechos. No
            publicamos fotos de menores sin consentimiento explícito de quien ejerza
            la patria potestad. Nos reservamos el derecho a retirar contenido que
            infrinja estos principios.
          </p>
        </Section>

        <Section id="s7" title="7. Datos sensibles en el contenido">
          <p>
            Las historias pueden incluir experiencias sensibles (salud, violencia,
            duelo, etc.). Tratamos ese contenido con cuidado y lo revisamos para
            evitar daños. Te pedimos que no incluyas datos médicos concretos ni
            información que pueda poner en riesgo a terceros. El contenido publicado
            puede ser anonimizado o editado si lo consideramos necesario.
          </p>
        </Section>

        <Section id="s8" title="8. Tus derechos">
          <p>
            Tienes derecho a acceder a tus datos, rectificarlos, solicitar su
            supresión y, cuando corresponda, oponerte o limitar su tratamiento. Para
            ejercer estos derechos o retirar una historia publicada, escríbenos al
            contacto indicado más abajo. Responderemos en un plazo razonable.
          </p>
        </Section>

        <Section id="s9" title="9. Cookies y analítica">
          <p>
            Utilizamos cookies y tecnologías similares para el correcto
            funcionamiento del sitio y, en su caso, para analítica de uso anónima o
            agregada. No usamos cookies para publicidad dirigida. Puedes configurar
            tu navegador para limitar o bloquear cookies según tu preferencia.
          </p>
        </Section>

        <Section id="s10" title="10. Contacto y reclamaciones">
          <p>
            Para cualquier pregunta sobre esta política, para ejercer tus derechos
            o para presentar una reclamación, puedes contactarnos a través del
            formulario o correo indicado en la web. Si consideras que el tratamiento
            de tus datos no cumple la normativa, tienes derecho a presentar una
            reclamación ante la autoridad de protección de datos competente.
          </p>
        </Section>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: TEXT_3 }}>
          AlmaMundi · Política de privacidad
        </p>
      </div>
    </main>
  );
}
