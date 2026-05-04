import Link from 'next/link';
import { HomeHardLink } from '@/components/layout/HomeHardLink';
/**
 * /privacidad — Aviso de Privacidad de AlmaMundi.
 * Enlazada desde AgeGate (#s5), footer y modales. Estilo neumórfico.
 */

import type { Metadata } from 'next';
import { SITE_FONT_STACK } from '@/lib/typography';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad · AlmaMundi',
  description:
    'Qué datos podemos recopilar en AlmaMundi, para qué los usamos, cómo los cuidamos y qué derechos puedes ejercer.',
};

const BG = '#e8ecf0';
const SH_LIGHT = 'rgba(255,255,255,0.85)';
const SH_DARK = 'rgba(163,177,198,0.6)';
const ORANGE = '#ff6b2b';
const TEXT_1 = '#1a2332';
const TEXT_2 = '#4a5568';
const TEXT_3 = '#8896a5';
const LINK = '#FF4A1C';

const p = { marginBottom: '1rem' } as const;
const pLast = { marginBottom: 0 } as const;
const ul = {
  margin: '0 0 1rem',
  paddingLeft: '1.25rem',
  listStyleType: 'disc' as const,
};

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
          Aviso de Privacidad
        </h1>
        <p style={{ margin: 0, fontSize: '0.9rem', color: TEXT_3 }}>
          AlmaMundi · Documento actualizado según los procesos del sitio
        </p>

        <Section id="intro" title="Introducción">
          <p style={p}>
            AlmaMundi es un espacio para compartir, cuidar y explorar historias humanas en distintos formatos. Nuestro
            propósito es que relatos en audio, texto, fotografía o video puedan tener un lugar digno, seguro y
            respetuoso.
          </p>
          <p style={p}>
            Este Aviso de Privacidad explica qué datos podemos recopilar, para qué los usamos, cómo los cuidamos, con
            quiénes podríamos compartirlos y qué derechos puedes ejercer sobre tu información.
          </p>
          <p style={p}>
            AlmaMundi no busca recopilar datos sensibles para identificar a quien narra una historia. Usamos solo la
            información necesaria para revisar los envíos, comunicarnos contigo cuando sea necesario, proteger a quienes
            participan y mantener la seguridad de la plataforma.
          </p>
          <p style={pLast}>
            Para las condiciones generales de uso del sitio, consulta la página de{' '}
            <Link href="/terminos" style={{ color: LINK, fontWeight: 600 }}>
              Términos de uso
            </Link>
            .
          </p>
        </Section>

        <Section id="s1" title="1. ¿Quién es responsable del tratamiento de tus datos personales?">
          <p style={p}>
            AlmaMundi es responsable de definir cómo y para qué se tratan los datos personales entregados a través de la
            plataforma.
          </p>
          <p style={p}>
            La operación de AlmaMundi puede estar a cargo de Precisar u otra entidad responsable del proyecto, según se
            indique en los canales oficiales del sitio. Esa entidad administra la plataforma, define sus criterios
            editoriales, revisa los contenidos enviados y responde las solicitudes relacionadas con privacidad.
          </p>
          <p style={pLast}>
            Para consultas sobre privacidad o tratamiento de datos, puedes escribir al correo oficial indicado en el
            sitio (por ejemplo{' '}
            <a href="mailto:hola@almamundi.org" style={{ color: LINK }}>
              hola@almamundi.org
            </a>
            ).
          </p>
        </Section>

        <Section id="s2" title="2. ¿Quiénes pueden operar o apoyar el tratamiento de tus datos?">
          <p style={p}>
            Para que AlmaMundi funcione, podemos usar servicios tecnológicos externos que nos ayudan a alojar el sitio,
            guardar información, gestionar los materiales que subes (fotos, audio, texto o video), enviar comunicaciones,
            medir funcionamiento técnico o proteger la seguridad de la plataforma.
          </p>
          <p style={p}>
            Estos proveedores actúan solo para prestar servicios necesarios para AlmaMundi. No deberían usar tus datos
            para fines propios ajenos al funcionamiento de la plataforma.
          </p>
          <p style={{ marginBottom: '0.5rem' }}>Entre estos servicios pueden existir proveedores de:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>alojamiento web,</li>
            <li style={{ marginBottom: '0.5rem' }}>bases de datos,</li>
            <li style={{ marginBottom: '0.5rem' }}>almacenamiento de contenidos y medios,</li>
            <li style={{ marginBottom: '0.5rem' }}>correo electrónico,</li>
            <li style={{ marginBottom: '0.5rem' }}>herramientas de seguridad,</li>
            <li style={{ marginBottom: '0.5rem' }}>analítica técnica,</li>
            <li style={{ marginBottom: '0.5rem' }}>procesamiento de formularios,</li>
            <li style={{ marginBottom: 0 }}>soporte de audio, imagen o video.</li>
          </ul>
        </Section>

        <Section id="s3" title="3. ¿Qué son datos personales?">
          <p style={p}>Son datos personales aquellas informaciones que permiten identificar a una persona, directa o indirectamente.</p>
          <p style={{ marginBottom: '0.5rem' }}>Por ejemplo:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>nombre o seudónimo,</li>
            <li style={{ marginBottom: '0.5rem' }}>correo electrónico,</li>
            <li style={{ marginBottom: '0.5rem' }}>país o ciudad,</li>
            <li style={{ marginBottom: '0.5rem' }}>voz, imagen o video si permiten identificar a alguien,</li>
            <li style={{ marginBottom: '0.5rem' }}>información incluida dentro de una historia,</li>
            <li style={{ marginBottom: '0.5rem' }}>datos técnicos como dirección IP, navegador o dispositivo,</li>
            <li style={{ marginBottom: 0 }}>mensajes enviados a través de formularios.</li>
          </ul>
          <p style={pLast}>
            En AlmaMundi tratamos estos datos con cuidado porque pueden estar vinculados a relatos personales, memorias,
            experiencias, fotografías, voces o contextos de vida.
          </p>
        </Section>

        <Section id="s4" title="4. ¿Qué datos personales podemos utilizar y de dónde vienen?">
          <p style={{ marginBottom: '0.5rem' }}>
            Podemos tratar datos que tú nos entregas directamente al usar AlmaMundi, por ejemplo cuando:
          </p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>envías una historia,</li>
            <li style={{ marginBottom: '0.5rem' }}>subes una fotografía, audio, texto o video,</li>
            <li style={{ marginBottom: '0.5rem' }}>completas un formulario,</li>
            <li style={{ marginBottom: '0.5rem' }}>solicitas contacto,</li>
            <li style={{ marginBottom: '0.5rem' }}>pides ejercer derechos sobre tus datos,</li>
            <li style={{ marginBottom: '0.5rem' }}>interactúas con una historia,</li>
            <li style={{ marginBottom: '0.5rem' }}>guardas o compartes contenido,</li>
            <li style={{ marginBottom: 0 }}>participas en una convocatoria o actividad.</li>
          </ul>
          <p style={pLast}>
            También podemos recopilar datos técnicos básicos cuando navegas por el sitio, como información del dispositivo,
            navegador, páginas visitadas, errores técnicos o fecha y hora de acceso. Estos datos nos ayudan a mantener la
            seguridad, mejorar el funcionamiento y detectar fallas.
          </p>
        </Section>

        <Section id="s5-perfiles" title="5. Perfiles de usuario">
          <p style={{ marginBottom: '0.5rem' }}>AlmaMundi puede distinguir distintos tipos de participación:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>visitantes que solo navegan y exploran historias;</li>
            <li style={{ marginBottom: '0.5rem' }}>personas que envían relatos;</li>
            <li style={{ marginBottom: '0.5rem' }}>personas que interactúan con contenidos;</li>
            <li style={{ marginBottom: '0.5rem' }}>personas del equipo editorial o de administración;</li>
            <li style={{ marginBottom: '0.5rem' }}>personas que solicitan ejercer derechos sobre sus datos;</li>
            <li style={{ marginBottom: 0 }}>participantes de proyectos, convocatorias o actividades específicas.</li>
          </ul>
          <p style={pLast}>
            No usamos estos perfiles para discriminar, excluir injustamente ni tomar decisiones automatizadas que
            afecten derechos. Sirven para organizar el funcionamiento de la plataforma, revisar contenidos, proteger la
            seguridad y ofrecer una experiencia adecuada.
          </p>
        </Section>

        <Section id="s6" title="6. Redes sociales y plataformas de terceros">
          <p style={p}>
            AlmaMundi puede tener presencia en redes sociales u otras plataformas externas. Si interactúas con AlmaMundi
            en esos espacios, también se aplican las políticas de privacidad de cada plataforma.
          </p>
          <p style={p}>
            AlmaMundi no controla completamente cómo esas plataformas tratan tus datos. Por eso, te recomendamos revisar
            sus propias políticas de privacidad antes de publicar, comentar o compartir información personal.
          </p>
          <p style={pLast}>
            Cuando una historia de AlmaMundi se comparta en redes sociales, procuraremos mantener el respeto por la
            autoría, el contexto y la dignidad de quienes participan.
          </p>
        </Section>

        <Section id="s7" title="7. Convocatorias, actividades o proyectos especiales">
          <p style={p}>
            AlmaMundi puede realizar convocatorias, campañas, concursos, exposiciones, recorridos o proyectos especiales.
          </p>
          <p style={p}>
            En esos casos, podremos solicitar datos adicionales necesarios para gestionar la participación, comunicar
            resultados, verificar autorizaciones o coordinar la publicación de contenidos.
          </p>
          <p style={pLast}>
            Cuando una actividad tenga condiciones específicas, estas deberán informarse de forma clara antes de
            participar.
          </p>
        </Section>

        <Section id="s8" title="8. Información proveniente de otras fuentes">
          <p style={p}>
            En algunos casos, AlmaMundi puede recibir información desde instituciones aliadas, proyectos educativos,
            actividades culturales, memorias comunitarias, comunidades o equipos de trabajo que colaboren con la plataforma.
          </p>
          <p style={p}>
            Cuando eso ocurra, procuraremos que exista autorización suficiente para usar el material, especialmente si
            contiene relatos, imágenes, voces, nombres, datos de contacto o información de terceros.
          </p>
          <p style={pLast}>
            Si detectamos dudas sobre quién narra, consentimiento, origen del material o posible afectación a una persona,
            podremos suspender, retirar o no publicar el contenido.
          </p>
        </Section>

        <Section id="s9" title="9. ¿Para qué usamos tus datos personales?">
          <p style={{ marginBottom: '0.5rem' }}>Usamos tus datos para fines relacionados con AlmaMundi, por ejemplo:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>recibir y revisar historias;</li>
            <li style={{ marginBottom: '0.5rem' }}>contactar a quien envía un relato;</li>
            <li style={{ marginBottom: '0.5rem' }}>verificar quién narra o el consentimiento cuando sea necesario;</li>
            <li style={{ marginBottom: '0.5rem' }}>publicar contenidos aprobados;</li>
            <li style={{ marginBottom: '0.5rem' }}>proteger la privacidad de las personas mencionadas;</li>
            <li style={{ marginBottom: '0.5rem' }}>evitar usos abusivos o dañinos de la plataforma;</li>
            <li style={{ marginBottom: '0.5rem' }}>responder solicitudes sobre datos personales;</li>
            <li style={{ marginBottom: '0.5rem' }}>mantener la seguridad técnica del sitio;</li>
            <li style={{ marginBottom: '0.5rem' }}>mejorar la experiencia de navegación;</li>
            <li style={{ marginBottom: '0.5rem' }}>organizar relatos, recorridos, muestras o colecciones;</li>
            <li style={{ marginBottom: '0.5rem' }}>cumplir obligaciones aplicables y atender solicitudes legítimas.</li>
          </ul>
          <p style={pLast}>No vendemos tus datos personales.</p>
        </Section>

        <Section id="s10" title="10. ¿Cuál es la base para tratar tus datos personales?">
          <p style={p}>
            Tratamos tus datos porque son necesarios para operar AlmaMundi y porque tú los entregas voluntariamente al
            participar.
          </p>
          <p style={{ marginBottom: '0.5rem' }}>Según el caso, el tratamiento puede apoyarse en:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>tu consentimiento;</li>
            <li style={{ marginBottom: '0.5rem' }}>la necesidad de gestionar un envío o solicitud;</li>
            <li style={{ marginBottom: '0.5rem' }}>el interés legítimo de mantener segura la plataforma;</li>
            <li style={{ marginBottom: '0.5rem' }}>la protección de derechos de las personas involucradas;</li>
            <li style={{ marginBottom: '0.5rem' }}>la preservación cultural, educativa o documental de relatos;</li>
            <li style={{ marginBottom: '0.5rem' }}>el cumplimiento de obligaciones aplicables;</li>
            <li style={{ marginBottom: 0 }}>la atención de reclamos, solicitudes o requerimientos.</li>
          </ul>
          <p style={pLast}>
            Cuando se trate de historias, fotografías, audios o videos, la publicación no es automática. El equipo de
            AlmaMundi puede revisar, aprobar, solicitar ajustes, no publicar o retirar contenidos cuando existan riesgos,
            dudas de autorización o incumplimiento de criterios editoriales.
          </p>
        </Section>

        <Section id="s11" title="11. ¿Con quién podemos compartir tus datos?">
          <p style={p}>Podemos compartir datos solo cuando sea necesario y de forma proporcional.</p>
          <p style={{ marginBottom: '0.5rem' }}>Esto puede incluir:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>proveedores tecnológicos que permiten operar el sitio;</li>
            <li style={{ marginBottom: '0.5rem' }}>servicios de almacenamiento o base de datos;</li>
            <li style={{ marginBottom: '0.5rem' }}>equipos editoriales o de curaduría;</li>
            <li style={{ marginBottom: '0.5rem' }}>personas o instituciones aliadas en proyectos específicos;</li>
            <li style={{ marginBottom: '0.5rem' }}>autoridades competentes cuando exista una obligación válida;</li>
            <li style={{ marginBottom: 0 }}>terceros autorizados por ti o necesarios para responder una solicitud.</li>
          </ul>
          <p style={p}>No compartimos datos personales para venta comercial.</p>
          <p style={pLast}>
            Cuando una historia es publicada, pueden hacerse visibles ciertos datos asociados al relato, como nombre,
            seudónimo, país, ciudad, formato, tema, fecha o contenido narrativo, según lo que se haya autorizado y
            aprobado editorialmente.
          </p>
        </Section>

        <Section id="s12" title="12. ¿Cómo protegemos tus datos personales?">
          <p style={{ marginBottom: '0.5rem' }}>Aplicamos medidas razonables para proteger la información que recibimos.</p>
          <p style={{ marginBottom: '0.5rem' }}>Entre ellas:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>revisión editorial antes de publicar historias;</li>
            <li style={{ marginBottom: '0.5rem' }}>restricciones de acceso a áreas administrativas;</li>
            <li style={{ marginBottom: '0.5rem' }}>control de estados de publicación;</li>
            <li style={{ marginBottom: '0.5rem' }}>almacenamiento en servicios protegidos;</li>
            <li style={{ marginBottom: '0.5rem' }}>limitación de datos visibles públicamente;</li>
            <li style={{ marginBottom: '0.5rem' }}>separación entre historias pendientes y publicadas;</li>
            <li style={{ marginBottom: '0.5rem' }}>posibilidad de retirar o reservar contenidos que ya no deban verse en público;</li>
            <li style={{ marginBottom: '0.5rem' }}>revisión de contenidos que puedan afectar derechos de terceros;</li>
            <li style={{ marginBottom: '0.5rem' }}>uso de proveedores tecnológicos confiables;</li>
            <li style={{ marginBottom: 0 }}>registros internos de acciones críticas cuando corresponda.</li>
          </ul>
          <p style={pLast}>
            Ningún sistema digital puede garantizar seguridad absoluta, pero trabajamos para reducir riesgos, evitar
            accesos no autorizados y proteger la dignidad de quienes participan.
          </p>
        </Section>

        <Section id="s13" title="13. Transferencias internacionales">
          <p style={p}>
            AlmaMundi puede usar servicios tecnológicos ubicados en distintos países. Por eso, algunos datos podrían ser
            almacenados o procesados fuera del país desde el cual participas.
          </p>
          <p style={p}>
            Cuando usamos estos servicios, buscamos que el tratamiento sea necesario, proporcional y compatible con los
            fines de AlmaMundi.
          </p>
          <p style={pLast}>
            Esto puede ocurrir, por ejemplo, con servicios de alojamiento, bases de datos, almacenamiento de archivos,
            correo electrónico, seguridad o analítica técnica.
          </p>
        </Section>

        <Section id="s14" title="14. Datos de niños, niñas y adolescentes">
          {/* Ancla legada: AgeGate y otros enlaces usan /privacidad#s5 */}
          <div id="s5" style={{ height: 0, overflow: 'hidden' }} aria-hidden />
          <p style={p}>
            AlmaMundi busca proteger especialmente a niños, niñas y adolescentes.
          </p>
          <p style={p}>
            Las personas menores de 18 años no pueden usar la opción de envío en video por cuenta propia. La
            publicación de contenidos que involucren a menores de edad requiere especial cuidado y, cuando corresponda,
            autorización de una persona adulta responsable o de una institución autorizada.
          </p>
          <p style={p}>
            No publicamos contenidos que expongan indebidamente a niños, niñas o adolescentes, afecten su dignidad,
            revelen información sensible o puedan ponerles en riesgo.
          </p>
          <p style={pLast}>
            Si detectamos que un contenido puede afectar derechos de personas menores de edad, podremos no publicarlo,
            pedir ajustes o retirarlo.
          </p>
        </Section>

        <Section id="s15" title="15. Información sobre personas que no interactúan directamente con AlmaMundi">
          <p style={p}>
            Una historia puede mencionar a otras personas que no participaron directamente en la plataforma.
          </p>
          <p style={p}>
            Por eso, quien envía un relato debe procurar no exponer datos privados, sensibles o innecesarios de terceros.
            Esto incluye nombres completos, direcciones, datos de contacto, situaciones íntimas, acusaciones no
            verificadas, imágenes no autorizadas o información que pueda causar daño.
          </p>
          <p style={pLast}>
            AlmaMundi podrá revisar, editar, solicitar ajustes, no publicar o retirar historias cuando una persona
            mencionada pueda verse afectada o cuando no exista autorización suficiente.
          </p>
        </Section>

        <Section id="s16" title="16. Retención de datos personales">
          <p style={p}>Conservamos los datos solo durante el tiempo necesario para cumplir los fines de AlmaMundi.</p>
          <p style={{ marginBottom: '0.5rem' }}>Esto puede incluir:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>revisar y gestionar historias enviadas;</li>
            <li style={{ marginBottom: '0.5rem' }}>mantener contenidos publicados con autorización;</li>
            <li style={{ marginBottom: '0.5rem' }}>responder solicitudes;</li>
            <li style={{ marginBottom: '0.5rem' }}>cumplir responsabilidades editoriales;</li>
            <li style={{ marginBottom: '0.5rem' }}>proteger la seguridad de la plataforma;</li>
            <li style={{ marginBottom: '0.5rem' }}>conservar registros mínimos de auditoría;</li>
            <li style={{ marginBottom: 0 }}>atender reclamos o solicitudes posteriores.</li>
          </ul>
          <p style={pLast}>
            Cuando los datos ya no sean necesarios, podremos eliminarlos, anonimizarlos, archivarlos o restringir su
            acceso, según corresponda.
          </p>
        </Section>

        <Section id="s17" title="17. ¿Qué derechos tienes sobre tus datos personales?">
          <p style={{ marginBottom: '0.5rem' }}>Puedes solicitar:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>saber si tratamos datos personales tuyos;</li>
            <li style={{ marginBottom: '0.5rem' }}>acceder a los datos que tenemos sobre ti;</li>
            <li style={{ marginBottom: '0.5rem' }}>corregir datos incompletos, incorrectos o desactualizados;</li>
            <li style={{ marginBottom: '0.5rem' }}>pedir la eliminación de datos personales;</li>
            <li style={{ marginBottom: '0.5rem' }}>solicitar la anonimización o bloqueo de datos que ya no sean necesarios;</li>
            <li style={{ marginBottom: '0.5rem' }}>retirar tu consentimiento cuando corresponda;</li>
            <li style={{ marginBottom: '0.5rem' }}>pedir información sobre cómo usamos o compartimos tus datos;</li>
            <li style={{ marginBottom: '0.5rem' }}>solicitar que dejemos de usar tus datos para ciertos fines;</li>
            <li style={{ marginBottom: 0 }}>pedir revisión de una historia que te afecte.</li>
          </ul>
          <p style={p}>
            Para proteger tu privacidad, podemos pedir una verificación mínima de identidad antes de responder ciertas
            solicitudes.
          </p>
          <p style={pLast}>No envíes documentos sensibles salvo que te los solicitemos de forma expresa y segura.</p>
        </Section>

        <Section id="s18" title="18. ¿Cómo puedes hacer consultas o solicitudes?">
          <p style={p}>
            Puedes escribir al canal de contacto indicado por AlmaMundi para consultas de privacidad, solicitudes sobre
            datos personales o preguntas relacionadas con una historia publicada (por ejemplo{' '}
            <a href="mailto:hola@almamundi.org" style={{ color: LINK }}>
              hola@almamundi.org
            </a>
            ).
          </p>
          <p style={p}>
            También puedes usar el formulario{' '}
            <Link href="/mis-datos-personales" style={{ color: LINK, fontWeight: 600 }}>
              Solicitud sobre tus datos personales
            </Link>
            .
          </p>
          <p style={{ marginBottom: '0.5rem' }}>Al enviar una solicitud, intenta incluir:</p>
          <ul style={{ ...ul, marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>nombre o seudónimo usado;</li>
            <li style={{ marginBottom: '0.5rem' }}>correo de contacto;</li>
            <li style={{ marginBottom: '0.5rem' }}>país o ciudad, si ayuda a ubicar el caso;</li>
            <li style={{ marginBottom: '0.5rem' }}>tipo de solicitud;</li>
            <li style={{ marginBottom: '0.5rem' }}>enlace de la historia, si existe;</li>
            <li style={{ marginBottom: 0 }}>descripción clara de lo que necesitas.</li>
          </ul>
          <p style={pLast}>Usaremos esa información solo para revisar y responder tu solicitud.</p>
        </Section>

        <Section id="s19" title="19. Cambios en este Aviso de Privacidad">
          <p style={p}>
            AlmaMundi puede actualizar este Aviso de Privacidad para reflejar cambios en la plataforma, mejoras de
            seguridad, nuevas funcionalidades o ajustes en sus procesos.
          </p>
          <p style={p}>
            Cuando los cambios sean relevantes, procuraremos informarlos de manera visible en el sitio.
          </p>
          <p style={pLast}>La versión vigente será la publicada en la página oficial de privacidad de AlmaMundi.</p>
        </Section>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: TEXT_3 }}>
          AlmaMundi · Aviso de Privacidad
        </p>
      </div>
    </main>
  );
}
