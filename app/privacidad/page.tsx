import { HomeHardLink } from '@/components/layout/HomeHardLink';
/**
 * /privacidad — Política de privacidad de AlmaMundi.
 * Enlazada desde AgeGate (#s5) y footer. Estilo neumórfico.
 */

import type { Metadata } from 'next';
import { SITE_FONT_STACK } from '@/lib/typography';

export const metadata: Metadata = {
  title: 'Política de privacidad y protección de datos · AlmaMundi',
  description:
    'Cómo AlmaMundi y Precisar protegen tus datos y las reglas de participación.',
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
          Política de privacidad y protección de datos
        </h1>
        <p style={{ margin: 0, fontSize: '0.9rem', color: TEXT_3 }}>
          AlmaMundi · Precisar · Vigencia: abril 2026
        </p>

        <Section id="preambulo" title="Preámbulo">
          <p style={{ marginBottom: '1rem' }}>
            AlmaMundi es una plataforma de historias humanas operada por Precisar, organización sin
            fines de lucro con presencia en Chile y México. Esta política se rige por los principios
            de la Declaración Universal de Derechos Humanos, el Pacto Internacional de Derechos
            Civiles y Políticos, y los marcos normativos de protección de datos aplicables,
            incluyendo el Reglamento General de Protección de Datos de la Unión Europea (RGPD), la Ley
            19.628 de Chile sobre Protección de la Vida Privada, y la Ley Federal de Protección de
            Datos Personales en Posesión de los Particulares de México.
          </p>
          <p style={{ marginBottom: 0 }}>
            El tratamiento de datos personales en AlmaMundi se basa en el respeto irrestricto a la
            dignidad humana, la autodeterminación informativa y el derecho a la privacidad como
            derecho humano fundamental.
          </p>
        </Section>

        <Section id="s1" title="1. Responsable del tratamiento">
          <p style={{ marginBottom: '0.5rem' }}>Precisar, organización sin fines de lucro.</p>
          <p style={{ marginBottom: '0.5rem' }}>
            Contacto:{' '}
            <a href="mailto:hola@precisar.net" style={{ color: '#FF4A1C' }}>
              hola@precisar.net
            </a>
          </p>
          <p style={{ marginBottom: 0 }}>
            Plataforma:{' '}
            <a
              href="https://www.almamundi.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#FF4A1C' }}
            >
              www.almamundi.org
            </a>
          </p>
        </Section>

        <Section id="s2" title="2. Principios rectores">
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              listStyleType: 'disc',
            }}
          >
            <li style={{ marginBottom: '0.65rem' }}>
              <strong>Licitud y transparencia:</strong> los datos se tratan con base legal explícita
              y el usuario es informado de forma clara sobre su uso.
            </li>
            <li style={{ marginBottom: '0.65rem' }}>
              <strong>Limitación de finalidad:</strong> los datos se recogen para fines determinados y
              no se utilizan de forma incompatible con esos fines.
            </li>
            <li style={{ marginBottom: '0.65rem' }}>
              <strong>Minimización:</strong> solo se recogen los datos estrictamente necesarios para
              el funcionamiento de la plataforma.
            </li>
            <li style={{ marginBottom: '0.65rem' }}>
              <strong>Exactitud:</strong> se adoptan medidas razonables para mantener los datos
              actualizados.
            </li>
            <li style={{ marginBottom: '0.65rem' }}>
              <strong>Limitación del plazo de conservación:</strong> los datos no se conservan más
              tiempo del necesario.
            </li>
            <li style={{ marginBottom: 0 }}>
              <strong>Integridad y confidencialidad:</strong> se aplican medidas técnicas y
              organizativas para proteger los datos frente a accesos no autorizados, pérdida o
              destrucción.
            </li>
          </ul>
        </Section>

        <Section id="s3" title="3. Datos que se recopilan">
          <p style={{ marginBottom: '1rem' }}>
            AlmaMundi recopila únicamente los datos que la persona proporciona de forma voluntaria:
          </p>
          <ul
            style={{
              margin: '0 0 1rem',
              paddingLeft: '1.25rem',
              listStyleType: 'disc',
            }}
          >
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Datos de identificación:</strong> nombre o seudónimo y correo electrónico,
              necesarios para la comunicación y el proceso de curaduria.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Contenido narrativo:</strong> historias en formato video, audio, texto o
              fotografía, compartidas con consentimiento explícito.
            </li>
            <li style={{ marginBottom: 0 }}>
              <strong>Datos técnicos de uso:</strong> tipo de dispositivo, idioma y datos de
              navegación de carácter agregado y anónimo, utilizados exclusivamente para mejorar el
              servicio.
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            AlmaMundi no recopila datos de geolocalización en tiempo real, no realiza perfilado
            automatizado con fines comerciales y no vende datos personales bajo ninguna
            circunstancia.
          </p>
        </Section>

        <Section id="s4" title="4. Base legal del tratamiento">
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              listStyleType: 'disc',
            }}
          >
            <li style={{ marginBottom: '0.65rem' }}>
              Consentimiento explícito de la persona al momento de enviar su historia, con
              información previa clara sobre el uso de sus datos.
            </li>
            <li style={{ marginBottom: '0.65rem' }}>
              Interés legítimo de Precisar para el mantenimiento y mejora de la plataforma, siempre
              subordinado a los derechos e intereses de las personas.
            </li>
            <li style={{ marginBottom: 0 }}>Cumplimiento de obligaciones legales cuando corresponda.</li>
          </ul>
        </Section>

        <Section id="s5" title="5. Finalidad del tratamiento">
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              listStyleType: 'disc',
            }}
          >
            <li style={{ marginBottom: '0.65rem' }}>
              Publicar y curar las historias enviadas a la plataforma, a través de un proceso de
              revisión editorial que garantiza el respeto a la dignidad de los autores.
            </li>
            <li style={{ marginBottom: '0.65rem' }}>
              Comunicarse con los autores en relación con el estado de su historia.
            </li>
            <li style={{ marginBottom: '0.65rem' }}>
              Mejorar el funcionamiento técnico de la plataforma mediante datos de uso agregados y
              anónimos.
            </li>
            <li style={{ marginBottom: 0 }}>Cumplir con las obligaciones legales aplicables.</li>
          </ul>
        </Section>

        <Section id="s6" title="6. Proceso de curaduría editorial">
          <p style={{ marginBottom: 0 }}>
            Todas las historias pasan por un proceso de revisión antes de publicarse. Este proceso
            garantiza que el contenido respete la dignidad de las personas, no exponga datos sensibles
            sin consentimiento y cumpla los principios editoriales de AlmaMundi. Las decisiones de
            curaduria se registran internamente con fines de transparencia y mejora continua. Los
            autores son notificados del resultado de la revisión.
          </p>
        </Section>

        <Section id="s7" title="7. Protección de personas menores de edad">
          {/* Ancla legada: AgeGate enlaza a /privacidad#s5 */}
          <div id="s5" aria-hidden style={{ height: 0, overflow: 'hidden' }} />
          <p style={{ marginBottom: '1rem' }}>
            AlmaMundi aplica un principio de protección reforzada respecto a personas menores de 18
            años, en cumplimiento de la Convención sobre los Derechos del Niño de las Naciones Unidas
            y la normativa nacional aplicable.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.75rem',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: `inset 2px 2px 4px ${SH_DARK}, inset -2px -2px 4px ${SH_LIGHT}`,
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(255,107,43,0.12)' }}>
                  <th style={{ padding: '0.55rem 0.4rem', textAlign: 'left', color: TEXT_1 }}>
                    Formato
                  </th>
                  <th style={{ padding: '0.55rem 0.4rem', textAlign: 'left', color: TEXT_1 }}>
                    Mayores de 18
                  </th>
                  <th style={{ padding: '0.55rem 0.4rem', textAlign: 'left', color: TEXT_1 }}>
                    Menores de 18
                  </th>
                  <th style={{ padding: '0.55rem 0.4rem', textAlign: 'left', color: TEXT_1 }}>
                    Condiciones
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>Video</td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>Permitido</td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    No permitido
                  </td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>—</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>Audio</td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>Permitido</td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    Con condiciones
                  </td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    Sin datos identificables
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>Texto</td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>Permitido</td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    Con condiciones
                  </td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    Sin datos identificables
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    Fotografía propia
                  </td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>Permitido</td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    No permitido
                  </td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>—</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    Fotografía de terceros
                  </td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>Permitido</td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    Con condiciones
                  </td>
                  <td style={{ padding: '0.45rem', borderTop: `1px solid ${SH_DARK}` }}>
                    Sin menores; con autorización
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: '1rem', marginBottom: 0 }}>
            Las historias que involucren personas menores de edad pasan por una revisión especial
            antes de su publicación.
          </p>
        </Section>

        <Section id="s8" title="8. Contenido sensible">
          <p style={{ marginBottom: 0 }}>
            Las historias pueden contener experiencias relacionadas con salud, violencia, duelo,
            desplazamiento u otras situaciones de vulnerabilidad. AlmaMundi trata este contenido con
            especial cuidado, garantizando que su publicación no cause daño a los autores ni a
            terceros. El equipo de curaduria puede anonimizar, editar o retirar contenido cuando sea
            necesario para proteger la integridad de las personas.
          </p>
        </Section>

        <Section id="s9" title="9. Derechos de las personas">
          <ul
            style={{
              margin: '0 0 1rem',
              paddingLeft: '1.25rem',
              listStyleType: 'disc',
            }}
          >
            <li style={{ marginBottom: '0.5rem' }}>
              Acceder a sus datos personales y obtener información sobre su tratamiento.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>Rectificar datos inexactos o incompletos.</li>
            <li style={{ marginBottom: '0.5rem' }}>
              Solicitar la supresión de sus datos cuando no exista base legal para su tratamiento.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Oponerse al tratamiento o solicitar su limitación.
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Retirar el consentimiento en cualquier momento, sin que ello afecte la licitud del
              tratamiento previo.
            </li>
            <li style={{ marginBottom: 0 }}>
              Presentar una reclamación ante la autoridad de protección de datos competente en su
              jurisdicción.
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Para ejercer estos derechos, escribir a:{' '}
            <a href="mailto:hola@precisar.cl" style={{ color: '#FF4A1C' }}>
              hola@precisar.cl
            </a>
          </p>
        </Section>

        <Section id="s10" title="10. Fotografías y derechos de imagen">
          <p style={{ marginBottom: 0 }}>
            Las fotografías que incluyan imágenes de otras personas requieren la autorización
            explícita de los representados. No se publican fotografías de personas menores de edad
            sin el consentimiento expreso de quien ejerza su representación legal. AlmaMundi se
            reserva el derecho de retirar contenido que vulnere el derecho a la imagen o la dignidad
            de las personas.
          </p>
        </Section>

        <Section id="s11" title="11. Cookies y tecnologías de seguimiento">
          <p style={{ marginBottom: 0 }}>
            AlmaMundi utiliza únicamente cookies técnicas esenciales para el funcionamiento del sitio
            y, en su caso, analítica de uso con datos agregados y anónimos. No se utilizan cookies
            con fines publicitarios ni de seguimiento comercial. El usuario puede configurar su
            navegador para limitar o bloquear cookies.
          </p>
        </Section>

        <Section id="s12" title="12. Servicios de terceros">
          <p style={{ marginBottom: '1rem' }}>
            AlmaMundi utiliza los siguientes servicios externos, cada uno sujeto a su propia política
            de privacidad:
          </p>
          <ul
            style={{
              margin: '0 0 1rem',
              paddingLeft: '1.25rem',
              listStyleType: 'disc',
            }}
          >
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Firebase (Google):</strong> base de datos, autenticación y almacenamiento.
              Servidores en Estados Unidos y otros países. Política:{' '}
              <a
                href="https://firebase.google.com/support/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FF4A1C' }}
              >
                firebase.google.com/support/privacy
              </a>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Vercel:</strong> plataforma de alojamiento y despliegue. Puede registrar
              direcciones IP de forma temporal. Política:{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FF4A1C' }}
              >
                vercel.com/legal/privacy-policy
              </a>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Resend:</strong> servicio de correo electrónico transaccional. Política:{' '}
              <a
                href="https://resend.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FF4A1C' }}
              >
                resend.com/legal/privacy-policy
              </a>
            </li>
            <li style={{ marginBottom: 0 }}>
              <strong>Upstash:</strong> servicio de caché y control de velocidad de las APIs. No
              almacena contenido de las historias. Política:{' '}
              <a
                href="https://upstash.com/trust/privacy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FF4A1C' }}
              >
                upstash.com/trust/privacy.pdf
              </a>
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Al usar AlmaMundi, la persona acepta que sus datos puedan ser procesados por estos
            servicios conforme a sus propias políticas.
          </p>
        </Section>

        <Section id="s13" title="13. Transferencias internacionales de datos">
          <p style={{ marginBottom: 0 }}>
            Algunos de los servicios indicados implican transferencias de datos a países fuera del
            Espacio Económico Europeo o de la jurisdicción de la persona usuaria. Estas
            transferencias se realizan con las garantías adecuadas previstas en la normativa
            aplicable.
          </p>
        </Section>

        <Section id="s14" title="14. Conservación de los datos">
          <p style={{ marginBottom: 0 }}>
            Los datos personales se conservan durante el tiempo necesario para cumplir con la
            finalidad para la que fueron recogidos. Las historias retiradas del globo tras su ciclo de
            publicación pasan al archivo de AlmaMundi y pueden conservarse de forma anonimizada como
            parte del registro histórico de Precisar.
          </p>
        </Section>

        <Section id="s15" title="15. Seguridad">
          <p style={{ marginBottom: 0 }}>
            AlmaMundi aplica medidas técnicas y organizativas apropiadas para proteger los datos
            personales frente a accesos no autorizados, pérdida, destrucción o alteración.
          </p>
        </Section>

        <Section id="s16" title="16. Modificaciones de esta política">
          <p style={{ marginBottom: 0 }}>
            Precisar se reserva el derecho de actualizar esta política cuando sea necesario. Los
            cambios se comunicarán en la plataforma con al menos 15 días de anticipación.
          </p>
        </Section>

        <Section id="s17" title="17. Contacto y reclamaciones">
          <p style={{ marginBottom: '0.75rem' }}>
            Para cualquier consulta sobre esta política, para ejercer derechos o para presentar una
            reclamación:
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            Correo:{' '}
            <a href="mailto:hola@precisar.cl" style={{ color: '#FF4A1C' }}>
              hola@precisar.cl
            </a>
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            Web:{' '}
            <a
              href="https://www.almamundi.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#FF4A1C' }}
            >
              www.almamundi.org
            </a>
          </p>
          <p style={{ marginBottom: 0 }}>
            La persona también tiene derecho a presentar una reclamación ante la autoridad de
            protección de datos competente en su país de residencia.
          </p>
        </Section>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: TEXT_3 }}>
          AlmaMundi · Precisar · Política de Privacidad y Protección de Datos · Abril 2026
        </p>
      </div>
    </main>
  );
}
