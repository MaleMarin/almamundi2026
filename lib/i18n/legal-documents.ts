import type { AlmaLocale } from '@/lib/i18n/locale';

export const FECHA_PUBLICACION: Record<AlmaLocale, string> = {
  es: '1 de noviembre de 2026',
  pt: '1º de novembro de 2026',
  en: 'November 1, 2026',
};

export type LegalKey = 'privacidad' | 'terminos' | 'contacto' | 'conducta' | 'datos';

export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'items'; items: string[] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  title: string;
  updated: string;
  lede?: string;
  sections: LegalSection[];
};

type Chrome = {
  back: string;
  documents: string;
  nav: { key: LegalKey; href: string; label: string }[];
};

export const LEGAL_CHROME: Record<AlmaLocale, Chrome> = {
  es: {
    back: '← Volver al inicio',
    documents: 'Documentos legales',
    nav: [
      { key: 'privacidad', href: '/privacidad', label: 'Aviso de privacidad' },
      { key: 'terminos', href: '/terminos', label: 'Términos de uso' },
      { key: 'conducta', href: '/codigo-de-conducta', label: 'Código de conducta' },
      { key: 'datos', href: '/mis-datos-personales', label: 'Mis datos personales' },
    ],
  },
  pt: {
    back: '← Voltar ao início',
    documents: 'Documentos legais',
    nav: [
      { key: 'privacidad', href: '/privacidad', label: 'Aviso de privacidade' },
      { key: 'terminos', href: '/terminos', label: 'Termos de uso' },
      { key: 'conducta', href: '/codigo-de-conducta', label: 'Código de conduta' },
      { key: 'datos', href: '/mis-datos-personales', label: 'Meus dados pessoais' },
    ],
  },
  en: {
    back: '← Back to the home',
    documents: 'Legal documents',
    nav: [
      { key: 'privacidad', href: '/privacidad', label: 'Privacy notice' },
      { key: 'terminos', href: '/terminos', label: 'Terms of use' },
      { key: 'conducta', href: '/codigo-de-conducta', label: 'Code of conduct' },
      { key: 'datos', href: '/mis-datos-personales', label: 'My personal data' },
    ],
  },
};

function seccion(id: string, title: string, blocks: LegalBlock[]): LegalSection {
  return { id, title, blocks };
}

function p(text: string): LegalBlock {
  return { kind: 'p', text };
}

function items(list: string[]): LegalBlock {
  return { kind: 'items', items: list };
}

const fecha = FECHA_PUBLICACION;

const esPrivacidad: LegalDoc = {
  title: 'Aviso de privacidad',
  updated: `Última actualización: ${fecha.es}`,
  lede: 'AlmaMundi es un espacio para contar y conocer historias humanas en video, audio, texto o foto. Este aviso explica qué datos recibimos, para qué los usamos, con quién los compartimos y cómo puedes ejercer tus derechos. Pedimos solo lo necesario y nunca vendemos tus datos.',
  sections: [
    seccion('responsable', '1. Quién es responsable', [
      p('El responsable del tratamiento de tus datos es Fundación Democracia Abierta, cuyo nombre de fantasía es Precisar, RUT 65.198.517-K, con domicilio en Santiago, Chile. AlmaMundi es una iniciativa sin fines de lucro de Precisar.'),
      p('Para cualquier consulta sobre privacidad: hola@almamundi.org.'),
    ]),
    seccion('datos', '2. Qué datos recibimos', [
      p('Cuando cuentas una historia: tu nombre o alias, país, ciudad, la fecha y el lugar de la historia, tu correo, y el contenido que envías (video, audio, texto o fotos, con su título, antecedentes y canción, si los agregas).'),
      p('Cuando respondes una pregunta: tu nombre o alias, país, ciudad, tu respuesta (texto, voz o foto con su frase) y, si quieres, tu correo.'),
      p('Cuando te suscribes a Sonder, nuestro boletín: tu correo y la fecha en que confirmaste la suscripción.'),
      p('Cuando escribes a una persona que contó su historia o usas un formulario: tu mensaje y los datos de contacto que nos entregues.'),
      p('Cuando navegas: datos técnicos básicos, como el tipo de navegador y de dispositivo, las páginas visitadas, la fecha y hora, y la dirección IP, que usamos para la seguridad y para que el sitio funcione bien.'),
      p('Tu voz, tu imagen o los detalles de tu historia pueden permitir identificarte. Por eso los cuidamos como datos personales.'),
    ]),
    seccion('usos', '3. Para qué los usamos', [
      items([
        'Recibir, revisar y publicar historias y respuestas.',
        'Avisarte cuando tu historia o tu respuesta esté en el mapa, o explicarte por qué no la publicamos.',
        'Enviarte Sonder, solo si te suscribiste y confirmaste.',
        'Responder tus mensajes y solicitudes sobre tus datos.',
        'Proteger el sitio de usos abusivos y mantener su seguridad.',
        'Entender de forma general cómo se usa el sitio para mejorarlo.',
      ]),
      p('No tomamos decisiones automáticas sobre las personas. Cada envío lo revisa alguien del equipo.'),
    ]),
    seccion('bases', '4. Por qué podemos tratarlos', [
      items([
        'Tu consentimiento: al enviar una historia o una respuesta, al marcar las casillas de autorización y al suscribirte a Sonder. Puedes retirarlo cuando quieras.',
        'La gestión de lo que nos pides: revisar tu envío o responder tu solicitud.',
        'Nuestro interés legítimo en mantener el sitio seguro.',
        'El cumplimiento de obligaciones legales, cuando corresponda.',
      ]),
    ]),
    seccion('publicacion', '5. Qué se publica', [
      p('Nada se publica de forma automática. Si aprobamos tu historia o tu respuesta, se muestra en el sitio con tu nombre o alias, tu país y ciudad, el lugar en el mapa y el contenido que enviaste. Tu correo nunca se publica.'),
    ]),
    seccion('compartir', '6. Con quién los compartimos', [
      p('Solo con proveedores que nos ayudan a operar el sitio, y solo para eso:'),
      items([
        'Vercel (Estados Unidos): alojamiento del sitio y medición de su velocidad, sin cookies.',
        'Google Cloud y Firebase (Estados Unidos): base de datos y almacenamiento de archivos.',
        'Resend (Estados Unidos): envío de correos y de Sonder.',
        'Cloudflare Turnstile (Estados Unidos): verificación contra envíos automáticos.',
        'Upstash (Estados Unidos): límite de envíos para evitar abusos.',
        'Sentry (Estados Unidos): registro de errores técnicos, sin datos personales.',
        'OpenStreetMap (Nominatim): convierte la ciudad y el país en un punto aproximado del mapa.',
        'Google Ads (Estados Unidos): medición de nuestras campañas, solo si lo aceptas en el aviso de cookies.',
        'YouTube o Vimeo: solo cuando una historia incluye un video alojado ahí.',
      ]),
      p('También podemos entregar datos a una autoridad cuando la ley nos obligue. No vendemos ni arrendamos datos personales.'),
    ]),
    seccion('transferencias', '7. Transferencias internacionales', [
      p('Como nuestros proveedores están en Estados Unidos, tus datos pueden guardarse o procesarse fuera de tu país. Elegimos proveedores con medidas de seguridad reconocidas y les entregamos solo lo necesario.'),
    ]),
    seccion('cookies', '8. Cookies', [
      p('Usamos cookies y almacenamiento local necesarios para que el sitio funcione: recordar tu idioma, tu elección en el aviso de cookies, tus preferencias de sonido y contraste, y las historias que guardas en tu colección. También medimos, sin cookies, la velocidad del sitio y los errores técnicos. Si aceptas en el aviso de cookies, Google Ads mide nuestras campañas y puede usar sus propias cookies; si no aceptas, no se carga. Puedes cambiar tu elección en «Preferencias de cookies», al pie de cada página, o borrar las cookies desde tu navegador.'),
    ]),
    seccion('menores', '9. Niños, niñas y adolescentes', [
      p('Para enviar una historia o una respuesta, en cualquier formato, hay que tener 18 años o más. Si en una historia aparece una persona menor de edad, el envío debe hacerlo una persona adulta responsable o una institución, con autorización. No publicamos contenidos que expongan a menores, revelen datos que permitan ubicarlos o los pongan en riesgo.'),
    ]),
    seccion('otras', '10. Otras personas en tu historia', [
      p('Si tu historia menciona a otras personas, cuida no exponer sus datos privados: nombres completos, direcciones, situaciones íntimas o acusaciones. Podemos pedirte ajustes, no publicar o retirar una historia si alguien puede verse afectado.'),
    ]),
    seccion('tiempo', '11. Cuánto tiempo los guardamos', [
      items([
        'Historias y respuestas publicadas: mientras estén publicadas, o hasta que pidas retirarlas.',
        'Historias y respuestas no publicadas: hasta 12 meses después de nuestra decisión.',
        'Suscripción a Sonder: hasta que te des de baja.',
        'Mensajes y solicitudes: el tiempo necesario para responderlos y dejar constancia.',
      ]),
      p('Después, los eliminamos o los anonimizamos.'),
    ]),
    seccion('derechos', '12. Tus derechos', [
      p('Puedes pedirnos, en cualquier momento:'),
      items([
        'saber si tenemos datos tuyos y acceder a ellos;',
        'corregirlos;',
        'eliminarlos, incluida tu historia o tu respuesta publicada;',
        'oponerte a un uso o pedir que lo limitemos;',
        'recibir tus datos en un formato que puedas llevar a otro lugar;',
        'retirar tu consentimiento.',
      ]),
      p('Usa el formulario Mis datos personales o escríbenos a hola@almamundi.org. Para proteger tu privacidad, podemos pedirte una verificación mínima de identidad. No te pediremos documentos sensibles de entrada.'),
      p('Si no estás conforme con nuestra respuesta, puedes reclamar ante la autoridad de protección de datos de tu país.'),
    ]),
    seccion('marco', '13. Marco legal', [
      p('Aplicamos la normativa de protección de datos que corresponde a AlmaMundi y, para quienes participan desde Brasil, la Lei Geral de Proteção de Dados (Lei 13.709/2018).'),
    ]),
    seccion('cambios', '14. Cambios a este aviso', [
      p('Si cambiamos este aviso de forma importante, lo informaremos en el sitio y, si te suscribiste a Sonder o dejaste tu correo, te escribiremos. La versión vigente es siempre la publicada en esta página.'),
    ]),
  ],
};

const esTerminos: LegalDoc = {
  title: 'Términos de uso',
  updated: `Última actualización: ${fecha.es}`,
  sections: [
    seccion('opera', '1. Quién opera AlmaMundi', [
      p('AlmaMundi es una iniciativa sin fines de lucro de Precisar, nombre de fantasía de la Fundación Democracia Abierta, RUT 65.198.517-K, con domicilio en Santiago, Chile. Precisar trabaja en Chile y México en cultura digital y alfabetización mediática.'),
    ]),
    seccion('puedes', '2. Qué puedes hacer', [
      items([
        'Explorar las historias, las respuestas y los datos de «También cuenta» en el mapa.',
        'Contar tu historia en video, audio, texto o foto.',
        'Responder las preguntas de las cintas con texto, voz o foto.',
        'Suscribirte a Sonder, nuestro boletín.',
        'Guardar historias en tu colección.',
      ]),
    ]),
    seccion('quien', '3. Quién puede enviar', [
      p('Para enviar una historia o una respuesta, en cualquier formato, hay que tener 18 años o más. Si aparece otra persona, necesitas su permiso. Si es menor de edad, el envío lo hace una persona adulta responsable o una institución, con autorización expresa.'),
    ]),
    seccion('prohibido', '4. Qué no está permitido', [
      items([
        'Contenido que incite al odio, la violencia o la discriminación, o que insulte, amenace o acose.',
        'Exponer a otras personas sin su permiso, sobre todo a niños, niñas y adolescentes.',
        'Usar música, imágenes o textos de otros sin autorización.',
        'Hacerse pasar por otra persona o institución.',
        'Usar el sitio con fines comerciales sin autorización de Precisar.',
        'Intentar enviar contenidos de forma automática o afectar el funcionamiento del sitio.',
      ]),
    ]),
    seccion('revision', '5. Revisión y publicación', [
      p('Cada envío pasa por revisión editorial antes de publicarse. Podemos aprobarlo, pedirte ajustes, no publicarlo o retirarlo más adelante si aparece un riesgo. Cuando no publicamos un envío y dejaste tu correo, te contamos el motivo.'),
    ]),
    seccion('tuyos', '6. Tus derechos sobre lo que cuentas', [
      p('Lo que cuentas sigue siendo tuyo. Al enviarlo, declaras que tienes derecho a compartirlo y le das a Precisar un permiso gratuito y no exclusivo para publicarlo en AlmaMundi y para difundirlo en los canales de AlmaMundi y de Precisar (redes sociales, boletín, exposiciones y materiales de la iniciativa), siempre con tu nombre o alias y sin fines comerciales.'),
      p('Puedes pedir que retiremos tu historia o tu respuesta cuando quieras, desde Mis datos personales o escribiendo a hola@almamundi.org. La retiraremos del sitio y dejaremos de usarla en nuevas difusiones.'),
    ]),
    seccion('responsabilidad', '7. Responsabilidad', [
      p('Cada persona responde por lo que envía. Revisamos con cuidado, pero no podemos verificar todo lo que se cuenta. Si ves algo que te afecta o que no debería estar publicado, escríbenos y lo revisaremos.'),
    ]),
    seccion('privacidad', '8. Privacidad', [
      p('El uso de tus datos se explica en el Aviso de privacidad.'),
    ]),
    seccion('cambios', '9. Cambios', [
      p('Podemos actualizar estos términos. Si el cambio es importante, lo avisaremos en el sitio con al menos 15 días de anticipación.'),
    ]),
    seccion('ley', '10. Ley aplicable', [
      p('Estos términos se rigen por las leyes de Chile. Cualquier controversia se verá ante los tribunales de Chile, sin perjuicio de los derechos que te correspondan según las leyes de tu país de residencia, en especial en materia de protección de datos y de consumidores.'),
    ]),
    seccion('contacto', '11. Contacto', [p('hola@almamundi.org')]),
  ],
};

const esContacto: LegalDoc = {
  title: 'Contacto',
  updated: `Última actualización: ${fecha.es}`,
  lede: 'AlmaMundi · una iniciativa sin fines de lucro de Precisar',
  sections: [
    seccion('escribir', 'Escríbenos', [
      p('Para dudas, prensa, alianzas o cualquier tema del sitio, escríbenos a hola@almamundi.org.'),
      p('Si quieres corregir o retirar algo que compartiste, usa Mis datos personales.'),
    ]),
  ],
};

const esConducta: LegalDoc = {
  title: 'Código de conducta',
  updated: `Última actualización: ${fecha.es}`,
  lede: 'En AlmaMundi, cada historia y cada respuesta es parte de la vida de alguien. Por eso las recibimos, las cuidamos y las mostramos con el mismo respeto con que nos gustaría que trataran las nuestras.',
  sections: [
    seccion('compromiso', 'Nuestro compromiso', [
      items([
        '**La dignidad va primero.** Cada relato es una experiencia humana, nunca simple contenido. No lo usamos para el morbo ni para llamar la atención.',
        '**Los derechos humanos son nuestra base.** Nos guiamos por la Declaración Universal de Derechos Humanos. No publicamos nada que discrimine, humille o incite al odio o a la violencia.',
        '**Tu historia es tuya.** Conservas todos tus derechos sobre lo que cuentas. Puedes pedir que la corrijamos o la retiremos cuando quieras, desde Mis datos personales.',
        '**Una persona lee cada envío.** Nada se publica de forma automática. Si algo puede dañar a alguien, pedimos ajustes o no lo publicamos.',
        '**Cuidamos a quienes aparecen.** Si tu historia menciona a otras personas, protegemos su privacidad. Niñas, niños y adolescentes reciben un cuidado especial: para enviar historias y respuestas hay que tener 18 años o más.',
        '**Usamos tus datos solo para lo necesario.** Pedimos lo mínimo y nunca los vendemos. Más detalles en el Aviso de privacidad.',
      ]),
    ]),
    seccion('pedimos', 'Lo que pedimos a quien cuenta', [
      items([
        'Cuenta lo que viviste o conoces de cerca, con tus palabras.',
        'Si otras personas aparecen en tu historia, pide su permiso.',
        'No compartas datos privados de otras personas ni material que no sea tuyo.',
      ]),
      p('Si ves algo que no debería estar en AlmaMundi, escríbenos a hola@almamundi.org.'),
    ]),
  ],
};

const ptPrivacidad: LegalDoc = {
  title: 'Aviso de privacidade',
  updated: `Última atualização: ${fecha.pt}`,
  lede: 'O AlmaMundi é um espaço para contar e conhecer histórias humanas em vídeo, áudio, texto ou foto. Este aviso explica quais dados recebemos, para que os usamos, com quem os compartilhamos e como você pode exercer seus direitos. Pedimos só o necessário e nunca vendemos seus dados.',
  sections: [
    seccion('responsable', '1. Quem é o responsável', [
      p('O controlador dos seus dados é a Fundación Democracia Abierta, cujo nome fantasia é Precisar, RUT 65.198.517-K, com sede em Santiago, Chile. O AlmaMundi é uma iniciativa sem fins lucrativos da Precisar. Para qualquer dúvida sobre privacidade: hola@almamundi.org.'),
    ]),
    seccion('datos', '2. Quais dados recebemos', [
      p('Quando você conta uma história: seu nome ou apelido, país, cidade, a data e o lugar da história, seu e-mail e o conteúdo que você envia (vídeo, áudio, texto ou fotos, com título, contexto e música, se você adicionar).'),
      p('Quando você responde a uma pergunta: seu nome ou apelido, país, cidade, sua resposta (texto, voz ou foto com sua frase) e, se quiser, seu e-mail.'),
      p('Quando você assina o Sonder, nossa newsletter: seu e-mail e a data em que confirmou a inscrição.'),
      p('Quando você escreve para quem contou uma história ou usa um formulário: sua mensagem e os dados de contato que nos informar.'),
      p('Quando você navega: dados técnicos básicos, como navegador, dispositivo, páginas visitadas, data e hora e endereço IP, usados para a segurança e o bom funcionamento do site.'),
      p('Sua voz, sua imagem ou os detalhes da sua história podem permitir identificar você. Por isso os tratamos como dados pessoais.'),
    ]),
    seccion('usos', '3. Para que os usamos', [
      items([
        'Receber, revisar e publicar histórias e respostas.',
        'Avisar quando sua história ou sua resposta estiver no mapa, ou explicar por que não a publicamos.',
        'Enviar o Sonder, somente se você se inscreveu e confirmou.',
        'Responder suas mensagens e solicitações sobre seus dados.',
        'Proteger o site contra usos abusivos e manter sua segurança.',
        'Entender de forma geral como o site é usado, para melhorá-lo.',
      ]),
      p('Não tomamos decisões automatizadas sobre as pessoas. Cada envio é revisado por alguém da equipe.'),
    ]),
    seccion('bases', '4. Bases legais', [
      items([
        'Seu consentimento: ao enviar uma história ou uma resposta, ao marcar as caixas de autorização e ao assinar o Sonder. Você pode retirá-lo quando quiser.',
        'A execução do que você nos pede: revisar seu envio ou responder sua solicitação.',
        'Nosso legítimo interesse em manter o site seguro.',
        'O cumprimento de obrigações legais, quando for o caso.',
      ]),
    ]),
    seccion('publicacion', '5. O que é publicado', [
      p('Nada é publicado automaticamente. Se aprovarmos sua história ou sua resposta, ela aparece no site com seu nome ou apelido, seu país e cidade, o lugar no mapa e o conteúdo que você enviou. Seu e-mail nunca é publicado.'),
    ]),
    seccion('compartir', '6. Com quem compartilhamos', [
      p('Somente com fornecedores que nos ajudam a operar o site, e só para isso:'),
      items([
        'Vercel (Estados Unidos): hospedagem do site e medição da sua velocidade, sem cookies.',
        'Google Cloud e Firebase (Estados Unidos): banco de dados e armazenamento de arquivos.',
        'Resend (Estados Unidos): envio de e-mails e do Sonder.',
        'Cloudflare Turnstile (Estados Unidos): verificação contra envios automatizados.',
        'Upstash (Estados Unidos): limite de envios para evitar abusos.',
        'Sentry (Estados Unidos): registro de erros técnicos, sem dados pessoais.',
        'OpenStreetMap (Nominatim): converte a cidade e o país em um ponto aproximado do mapa.',
        'Google Ads (Estados Unidos): medição das nossas campanhas, só se você aceitar no aviso de cookies.',
        'YouTube ou Vimeo: só quando uma história inclui um vídeo hospedado lá.',
      ]),
      p('Também podemos fornecer dados a uma autoridade quando a lei exigir. Não vendemos nem alugamos dados pessoais.'),
    ]),
    seccion('transferencias', '7. Transferências internacionais', [
      p('Como nossos fornecedores estão nos Estados Unidos, seus dados podem ser armazenados ou processados fora do seu país. Escolhemos fornecedores com medidas de segurança reconhecidas e entregamos a eles apenas o necessário.'),
    ]),
    seccion('cookies', '8. Cookies', [
      p('Usamos cookies e armazenamento local necessários para o funcionamento do site: lembrar seu idioma, sua escolha no aviso de cookies, suas preferências de som e contraste e as histórias que você guarda na sua coleção. Também medimos, sem cookies, a velocidade do site e os erros técnicos. Se você aceitar no aviso de cookies, o Google Ads mede nossas campanhas e pode usar seus próprios cookies; se não aceitar, ele não é carregado. Você pode mudar sua escolha em «Preferências de cookies», no rodapé de cada página, ou apagar os cookies no seu navegador.'),
    ]),
    seccion('menores', '9. Crianças e adolescentes', [
      p('Para enviar uma história ou uma resposta, em qualquer formato, é preciso ter 18 anos ou mais. Se uma pessoa menor de idade aparece numa história, o envio deve ser feito por um adulto responsável ou por uma instituição, com autorização. Não publicamos conteúdos que exponham menores, revelem dados que permitam localizá-los ou os coloquem em risco.'),
    ]),
    seccion('otras', '10. Outras pessoas na sua história', [
      p('Se sua história menciona outras pessoas, cuide para não expor dados privados delas: nomes completos, endereços, situações íntimas ou acusações. Podemos pedir ajustes, não publicar ou retirar uma história se alguém puder ser prejudicado.'),
    ]),
    seccion('tiempo', '11. Por quanto tempo guardamos', [
      items([
        'Histórias e respostas publicadas: enquanto estiverem publicadas, ou até você pedir a retirada.',
        'Histórias e respostas não publicadas: até 12 meses após nossa decisão.',
        'Inscrição no Sonder: até você cancelar.',
        'Mensagens e solicitações: o tempo necessário para respondê-las e manter registro.',
      ]),
      p('Depois, os eliminamos ou anonimizamos.'),
    ]),
    seccion('derechos', '12. Seus direitos', [
      p('Você pode nos pedir, a qualquer momento:'),
      items([
        'confirmar se temos dados seus e acessá-los;',
        'corrigi-los;',
        'eliminá-los, inclusive sua história ou resposta publicada;',
        'opor-se a um uso ou pedir que o limitemos;',
        'receber seus dados num formato que possa levar a outro serviço;',
        'retirar seu consentimento.',
      ]),
      p('Use o formulário Meus dados pessoais ou escreva para hola@almamundi.org. Para proteger sua privacidade, podemos pedir uma verificação mínima de identidade. Não pediremos documentos sensíveis de início.'),
      p('Se não ficar satisfeito com nossa resposta, você pode reclamar à autoridade de proteção de dados do seu país. No Brasil, a Autoridade Nacional de Proteção de Dados (ANPD).'),
    ]),
    seccion('marco', '13. Marco legal', [
      p('Aplicamos a legislação de proteção de dados que corresponde ao AlmaMundi e, para quem participa a partir do Brasil, a Lei Geral de Proteção de Dados (Lei 13.709/2018).'),
    ]),
    seccion('cambios', '14. Alterações neste aviso', [
      p('Se alterarmos este aviso de forma importante, informaremos no site e, se você assinou o Sonder ou deixou seu e-mail, escreveremos para você. A versão vigente é sempre a publicada nesta página.'),
    ]),
  ],
};

const ptTerminos: LegalDoc = {
  title: 'Termos de uso',
  updated: `Última atualização: ${fecha.pt}`,
  sections: [
    seccion('opera', '1. Quem opera o AlmaMundi', [
      p('O AlmaMundi é uma iniciativa sem fins lucrativos da Precisar, nome fantasia da Fundación Democracia Abierta, RUT 65.198.517-K, com sede em Santiago, Chile. A Precisar atua no Chile e no México em cultura digital e educação midiática.'),
    ]),
    seccion('puedes', '2. O que você pode fazer', [
      items([
        'Explorar as histórias, as respostas e os dados do «Também conta» no mapa.',
        'Contar sua história em vídeo, áudio, texto ou foto.',
        'Responder às perguntas das fitas com texto, voz ou foto.',
        'Assinar o Sonder, nossa newsletter.',
        'Guardar histórias na sua coleção.',
      ]),
    ]),
    seccion('quien', '3. Quem pode enviar', [
      p('Para enviar uma história ou uma resposta, em qualquer formato, é preciso ter 18 anos ou mais. Se outra pessoa aparece, você precisa da permissão dela. Se for menor de idade, o envio é feito por um adulto responsável ou por uma instituição, com autorização expressa.'),
    ]),
    seccion('prohibido', '4. O que não é permitido', [
      items([
        'Conteúdo que incite ódio, violência ou discriminação, ou que insulte, ameace ou assedie.',
        'Expor outras pessoas sem permissão, sobretudo crianças e adolescentes.',
        'Usar músicas, imagens ou textos de terceiros sem autorização.',
        'Fazer-se passar por outra pessoa ou instituição.',
        'Usar o site para fins comerciais sem autorização da Precisar.',
        'Tentar enviar conteúdos de forma automatizada ou prejudicar o funcionamento do site.',
      ]),
    ]),
    seccion('revision', '5. Revisão e publicação', [
      p('Cada envio passa por revisão editorial antes de ser publicado. Podemos aprová-lo, pedir ajustes, não publicá-lo ou retirá-lo depois, se surgir um risco. Quando não publicamos um envio e você deixou seu e-mail, explicamos o motivo.'),
    ]),
    seccion('tuyos', '6. Seus direitos sobre o que você conta', [
      p('O que você conta continua sendo seu. Ao enviar, você declara que tem o direito de compartilhá-lo e concede à Precisar uma licença gratuita e não exclusiva para publicá-lo no AlmaMundi e divulgá-lo nos canais do AlmaMundi e da Precisar (redes sociais, newsletter, exposições e materiais da iniciativa), sempre com seu nome ou apelido e sem fins comerciais.'),
      p('Você pode pedir a retirada da sua história ou da sua resposta quando quiser, pelo formulário Meus dados pessoais ou escrevendo para hola@almamundi.org. Nós a retiraremos do site e deixaremos de usá-la em novas divulgações.'),
    ]),
    seccion('responsabilidade', '7. Responsabilidade', [
      p('Cada pessoa responde pelo que envia. Revisamos com cuidado, mas não podemos verificar tudo o que é contado. Se você vir algo que o afeta ou que não deveria estar publicado, escreva para nós e vamos revisar.'),
    ]),
    seccion('privacidad', '8. Privacidade', [
      p('O uso dos seus dados está explicado no Aviso de privacidade.'),
    ]),
    seccion('cambios', '9. Alterações', [
      p('Podemos atualizar estes termos. Se a alteração for importante, avisaremos no site com pelo menos 15 dias de antecedência.'),
    ]),
    seccion('ley', '10. Lei aplicável', [
      p('Estes termos são regidos pelas leis do Chile. Qualquer controvérsia será resolvida nos tribunais do Chile, sem prejuízo dos direitos que você tenha pelas leis do seu país de residência, especialmente em proteção de dados e defesa do consumidor.'),
    ]),
    seccion('contacto', '11. Contato', [p('hola@almamundi.org')]),
  ],
};

const ptContacto: LegalDoc = {
  title: 'Contato',
  updated: `Última atualização: ${fecha.pt}`,
  lede: 'AlmaMundi · uma iniciativa sem fins lucrativos da Precisar',
  sections: [
    seccion('escribir', 'Fale com a gente', [
      p('Para dúvidas, imprensa, parcerias ou qualquer assunto do site, escreva para hola@almamundi.org.'),
      p('Se quiser corrigir ou retirar algo que compartilhou, use Meus dados pessoais.'),
    ]),
  ],
};

const ptConducta: LegalDoc = {
  title: 'Código de conduta',
  updated: `Última atualização: ${fecha.pt}`,
  lede: 'No AlmaMundi, cada história e cada resposta é parte da vida de alguém. Por isso, nós as recebemos, cuidamos e mostramos com o mesmo respeito com que gostaríamos que tratassem as nossas.',
  sections: [
    seccion('compromiso', 'Nosso compromisso', [
      items([
        '**A dignidade vem primeiro.** Cada relato é uma experiência humana, nunca simples conteúdo. Não o usamos para sensacionalismo nem para chamar atenção.',
        '**Os direitos humanos são a nossa base.** Nos guiamos pela Declaração Universal dos Direitos Humanos. Não publicamos nada que discrimine, humilhe ou incite ao ódio ou à violência.',
        '**Sua história é sua.** Você mantém todos os direitos sobre o que conta. Pode pedir que a corrijamos ou a retiremos quando quiser, em Meus dados pessoais.',
        '**Uma pessoa lê cada envio.** Nada é publicado automaticamente. Se algo puder prejudicar alguém, pedimos ajustes ou não publicamos.',
        '**Cuidamos de quem aparece.** Se sua história menciona outras pessoas, protegemos a privacidade delas. Crianças e adolescentes recebem um cuidado especial: para enviar histórias e respostas é preciso ter 18 anos ou mais.',
        '**Usamos seus dados só para o necessário.** Pedimos o mínimo e nunca os vendemos. Mais detalhes no Aviso de privacidade.',
      ]),
    ]),
    seccion('pedimos', 'O que pedimos a quem conta', [
      items([
        'Conte o que você viveu ou conhece de perto, com suas palavras.',
        'Se outras pessoas aparecem na sua história, peça a permissão delas.',
        'Não compartilhe dados privados de outras pessoas nem material que não seja seu.',
      ]),
      p('Se você vir algo que não deveria estar no AlmaMundi, escreva para hola@almamundi.org.'),
    ]),
  ],
};

const enPrivacidad: LegalDoc = {
  title: 'Privacy notice',
  updated: `Last updated: ${fecha.en}`,
  lede: "AlmaMundi is a space to tell and discover human stories in video, audio, text or photo. This notice explains what data we receive, what we use it for, who we share it with and how you can exercise your rights. We only ask for what we need, and we never sell your data.",
  sections: [
    seccion('responsable', '1. Who is responsible', [
      p("The controller of your data is Fundación Democracia Abierta, operating as Precisar, tax ID (RUT) 65.198.517-K, based in Santiago, Chile. AlmaMundi is a nonprofit initiative of Precisar. For any privacy question: hola@almamundi.org."),
    ]),
    seccion('datos', '2. What data we receive', [
      p('When you tell a story: your name or alias, country, city, the date and place of the story, your email, and the content you send (video, audio, text or photos, with a title, background and song, if you add them).'),
      p('When you answer a question: your name or alias, country, city, your answer (text, voice or photo with its caption) and, if you wish, your email.'),
      p('When you subscribe to Sonder, our newsletter: your email and the date you confirmed your subscription.'),
      p('When you write to someone who told a story or use a form: your message and the contact details you give us.'),
      p('When you browse: basic technical data, such as your browser, device, pages visited, date and time, and IP address, which we use to keep the site secure and working well.'),
      p("Your voice, your image or the details of your story may identify you. That's why we treat them as personal data."),
    ]),
    seccion('usos', '3. What we use it for', [
      items([
        'Receiving, reviewing and publishing stories and answers.',
        "Letting you know when your story or answer is on the map, or explaining why we didn't publish it.",
        'Sending you Sonder, only if you subscribed and confirmed.',
        'Answering your messages and requests about your data.',
        'Protecting the site from abuse and keeping it secure.',
        'Understanding, in general terms, how the site is used so we can improve it.',
      ]),
      p("We don't make automated decisions about people. Someone on our team reviews every submission."),
    ]),
    seccion('bases', '4. Legal bases', [
      items([
        'Your consent: when you send a story or an answer, check the authorization boxes or subscribe to Sonder. You can withdraw it at any time.',
        'Handling what you ask us: reviewing your submission or answering your request.',
        'Our legitimate interest in keeping the site secure.',
        'Compliance with legal obligations, where applicable.',
      ]),
    ]),
    seccion('publicacion', '5. What is published', [
      p("Nothing is published automatically. If we approve your story or answer, it appears on the site with your name or alias, your country and city, its place on the map and the content you sent. Your email is never published."),
    ]),
    seccion('compartir', '6. Who we share it with', [
      p('Only with providers that help us run the site, and only for that purpose:'),
      items([
        'Vercel (United States): site hosting and speed measurement, without cookies.',
        'Google Cloud and Firebase (United States): database and file storage.',
        'Resend (United States): sending emails and Sonder.',
        'Cloudflare Turnstile (United States): protection against automated submissions.',
        'Upstash (United States): submission limits to prevent abuse.',
        'Sentry (United States): technical error logging, without personal data.',
        'OpenStreetMap (Nominatim): turns the city and country into an approximate point on the map.',
        'Google Ads (United States): measuring our campaigns, only if you accept in the cookie notice.',
        'YouTube or Vimeo: only when a story includes a video hosted there.',
      ]),
      p("We may also share data with an authority when the law requires it. We don't sell or rent personal data."),
    ]),
    seccion('transferencias', '7. International transfers', [
      p('Since our providers are in the United States, your data may be stored or processed outside your country. We choose providers with recognized security measures and give them only what they need.'),
    ]),
    seccion('cookies', '8. Cookies', [
      p('We use cookies and local storage that are necessary for the site to work: remembering your language, your choice in the cookie notice, your sound and contrast preferences, and the stories you save to your collection. We also measure, without cookies, the site\'s speed and technical errors. If you accept in the cookie notice, Google Ads measures our campaigns and may use its own cookies; if you don\'t, it isn\'t loaded. You can change your choice in "Cookie preferences", at the bottom of every page, or delete cookies from your browser.'),
    ]),
    seccion('menores', '9. Children and adolescents', [
      p("To send a story or an answer, in any format, you must be 18 or older. If a minor appears in a story, it must be sent by a responsible adult or an institution, with authorization. We don't publish content that exposes minors, reveals information that could locate them or puts them at risk."),
    ]),
    seccion('otras', '10. Other people in your story', [
      p("If your story mentions other people, take care not to expose their private details: full names, addresses, intimate situations or accusations. We may ask for changes, decline to publish or remove a story if someone could be harmed."),
    ]),
    seccion('tiempo', '11. How long we keep it', [
      items([
        "Published stories and answers: while they're published, or until you ask us to remove them.",
        'Unpublished stories and answers: up to 12 months after our decision.',
        'Sonder subscription: until you unsubscribe.',
        'Messages and requests: as long as needed to answer them and keep a record.',
      ]),
      p('After that, we delete or anonymize them.'),
    ]),
    seccion('derechos', '12. Your rights', [
      p('You can ask us, at any time, to:'),
      items([
        'confirm whether we hold your data and give you access to it;',
        'correct it;',
        'delete it, including your published story or answer;',
        'object to a use or restrict it;',
        'receive your data in a format you can take elsewhere;',
        'withdraw your consent.',
      ]),
      p("Use the My personal data form or write to hola@almamundi.org. To protect your privacy, we may ask for a minimal identity check. We won't ask for sensitive documents up front."),
      p("If you're not satisfied with our answer, you can file a complaint with the data protection authority in your country."),
    ]),
    seccion('marco', '13. Legal framework', [
      p('We apply the data protection laws that govern AlmaMundi and, for people taking part from Brazil, the Lei Geral de Proteção de Dados (Law 13.709/2018).'),
    ]),
    seccion('cambios', '14. Changes to this notice', [
      p("If we make important changes to this notice, we'll announce them on the site and, if you subscribed to Sonder or left your email, we'll write to you. The current version is always the one published on this page."),
    ]),
  ],
};

const enTerminos: LegalDoc = {
  title: 'Terms of use',
  updated: `Last updated: ${fecha.en}`,
  sections: [
    seccion('opera', '1. Who runs AlmaMundi', [
      p("AlmaMundi is a nonprofit initiative of Precisar, the trade name of Fundación Democracia Abierta, tax ID (RUT) 65.198.517-K, based in Santiago, Chile. Precisar works in Chile and Mexico on digital culture and media literacy."),
    ]),
    seccion('puedes', '2. What you can do', [
      items([
        'Explore the stories, the answers and the «Also tells» facts on the map.',
        'Tell your story in video, audio, text or photo.',
        'Answer the ribbon questions with text, voice or photo.',
        'Subscribe to Sonder, our newsletter.',
        'Save stories to your collection.',
      ]),
    ]),
    seccion('quien', '3. Who can submit', [
      p("To send a story or an answer, in any format, you must be 18 or older. If someone else appears, you need their permission. If they're a minor, the submission must come from a responsible adult or an institution, with express authorization."),
    ]),
    seccion('prohibido', "4. What isn't allowed", [
      items([
        'Content that incites hatred, violence or discrimination, or that insults, threatens or harasses.',
        'Exposing other people without their permission, especially children and adolescents.',
        "Using other people's music, images or texts without authorization.",
        'Impersonating another person or institution.',
        "Using the site for commercial purposes without Precisar's authorization.",
        'Trying to submit content automatically or disrupt the site.',
      ]),
    ]),
    seccion('revision', '5. Review and publication', [
      p("Every submission goes through editorial review before it's published. We may approve it, ask for changes, decline to publish it or remove it later if a risk appears. When we don't publish a submission and you left your email, we tell you why."),
    ]),
    seccion('tuyos', '6. Your rights over what you tell', [
      p("What you tell remains yours. By sending it, you confirm you have the right to share it and grant Precisar a free, non-exclusive permission to publish it on AlmaMundi and share it on AlmaMundi's and Precisar's channels (social media, newsletter, exhibitions and initiative materials), always with your name or alias and never for commercial purposes."),
      p("You can ask us to remove your story or answer at any time, through My personal data or by writing to hola@almamundi.org. We'll take it off the site and stop using it in new posts."),
    ]),
    seccion('responsabilidad', '7. Responsibility', [
      p("Each person is responsible for what they send. We review carefully, but we can't verify everything people tell. If you see something that affects you or shouldn't be published, write to us and we'll review it."),
    ]),
    seccion('privacidad', '8. Privacy', [
      p('How we use your data is explained in the Privacy notice.'),
    ]),
    seccion('cambios', '9. Changes', [
      p("We may update these terms. If the change is important, we'll announce it on the site at least 15 days in advance."),
    ]),
    seccion('ley', '10. Governing law', [
      p('These terms are governed by the laws of Chile. Any dispute will be heard by the courts of Chile, without prejudice to the rights you have under the laws of your country of residence, especially regarding data protection and consumer rights.'),
    ]),
    seccion('contacto', '11. Contact', [p('hola@almamundi.org')]),
  ],
};

const enContacto: LegalDoc = {
  title: 'Contact',
  updated: `Last updated: ${fecha.en}`,
  lede: 'AlmaMundi · a nonprofit initiative of Precisar',
  sections: [
    seccion('escribir', 'Write to us', [
      p('For questions, press, partnerships or anything about the site, write to hola@almamundi.org.'),
      p('If you want to correct or remove something you shared, use My personal data.'),
    ]),
  ],
};

const enConducta: LegalDoc = {
  title: 'Code of conduct',
  updated: `Last updated: ${fecha.en}`,
  lede: "At AlmaMundi, every story and every answer is part of someone's life. That's why we receive them, care for them and share them with the same respect we'd want for our own.",
  sections: [
    seccion('compromiso', 'Our commitment', [
      items([
        '**Dignity comes first.** Every story is a human experience, never just content. We never use it for sensationalism or to grab attention.',
        "**Human rights are our foundation.** We are guided by the Universal Declaration of Human Rights. We don't publish anything that discriminates, humiliates, or incites hatred or violence.",
        '**Your story is yours.** You keep all rights to what you share. You can ask us to correct or remove it at any time, from My personal data.',
        "**A person reads every submission.** Nothing is published automatically. If something could harm someone, we ask for changes or don't publish it.",
        '**We protect the people who appear.** If your story mentions other people, we protect their privacy. Children and teenagers receive special care: you must be 18 or older to send stories and answers.',
        "**We use your data only for what's necessary.** We ask for the minimum and never sell it. More details in the Privacy notice.",
      ]),
    ]),
    seccion('pedimos', 'What we ask of storytellers', [
      items([
        'Tell what you lived or know closely, in your own words.',
        'If other people appear in your story, ask for their permission.',
        "Don't share other people's private data or material that isn't yours.",
      ]),
      p("If you see something that shouldn't be on AlmaMundi, write to hola@almamundi.org."),
    ]),
  ],
};

export const LEGAL_DOCS: Record<
  AlmaLocale,
  Record<'privacidad' | 'terminos' | 'contacto' | 'conducta', LegalDoc>
> = {
  es: { privacidad: esPrivacidad, terminos: esTerminos, contacto: esContacto, conducta: esConducta },
  pt: { privacidad: ptPrivacidad, terminos: ptTerminos, contacto: ptContacto, conducta: ptConducta },
  en: { privacidad: enPrivacidad, terminos: enTerminos, contacto: enContacto, conducta: enConducta },
};

const ENLACES: Record<AlmaLocale, Array<[string, string]>> = {
  es: [
    ['Mis datos personales', '/mis-datos-personales'],
    ['Aviso de privacidad', '/privacidad'],
    ['hola@almamundi.org', 'mailto:hola@almamundi.org'],
  ],
  pt: [
    ['Meus dados pessoais', '/mis-datos-personales'],
    ['Aviso de privacidade', '/privacidad'],
    ['hola@almamundi.org', 'mailto:hola@almamundi.org'],
  ],
  en: [
    ['My personal data', '/mis-datos-personales'],
    ['Privacy notice', '/privacidad'],
    ['hola@almamundi.org', 'mailto:hola@almamundi.org'],
  ],
};

export function trozosLegales(texto: string, locale: AlmaLocale): Array<{ texto: string; href?: string; fuerte?: boolean }> {
  const fuertes = texto.split(/(\*\*[^*]+\*\*)/g).filter((parte) => parte.length > 0);
  const salida: Array<{ texto: string; href?: string; fuerte?: boolean }> = [];
  for (const parte of fuertes) {
    const fuerte = parte.startsWith('**') && parte.endsWith('**');
    const limpio = fuerte ? parte.slice(2, -2) : parte;
    let resto = limpio;
    const enlaces = ENLACES[locale];
    while (resto.length) {
      let corte = resto.length;
      let href: string | undefined;
      let hallado = '';
      for (const [frase, destino] of enlaces) {
        const en = resto.indexOf(frase);
        if (en >= 0 && en < corte) {
          corte = en;
          href = destino;
          hallado = frase;
        }
      }
      if (!hallado) {
        salida.push({ texto: resto, fuerte });
        break;
      }
      if (corte > 0) salida.push({ texto: resto.slice(0, corte), fuerte });
      salida.push({ texto: hallado, href, fuerte });
      resto = resto.slice(corte + hallado.length);
    }
  }
  return salida;
}
