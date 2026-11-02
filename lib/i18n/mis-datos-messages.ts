import type { AlmaLocale } from '@/lib/i18n/locale';

type Opcion = { value: string; label: string };

type MisDatosCopy = {
  kicker: string;
  title: string;
  intro: string;
  introLink: string;
  cuidado: string;
  okTitle: string;
  okBody: string;
  okMail: string;
  back: string;
  honeypot: string;
  tipo: string;
  opciones: Opcion[];
  descripcion: string;
  ayuda: string;
  identificacion: string;
  nombre: string;
  correo: string;
  telefono: string;
  opcional: string;
  pais: string;
  propios: string;
  si: string;
  no: string;
  representacion: string;
  verificacion: string;
  verificacionCuerpo: string;
  confirma: string;
  uso: string;
  enviando: string;
  enviar: string;
  aviso: string;
  errorEnvio: string;
  errorRed: string;
};

const opcionesEs: Opcion[] = [
  { value: 'retirar_historia', label: 'Retirar mi historia o mi respuesta del sitio' },
  { value: 'confirmar_tratamiento', label: 'Confirmar si tratamos datos personales tuyos.' },
  { value: 'acceder', label: 'Acceder a los datos personales que tenemos sobre ti.' },
  { value: 'corregir', label: 'Corregir datos incompletos, incorrectos o desactualizados.' },
  { value: 'eliminar', label: 'Solicitar la eliminación de tus datos personales.' },
  { value: 'anonimizar_bloquear', label: 'Solicitar la anonimización o bloqueo de datos que ya no sean necesarios.' },
  { value: 'retirar_consentimiento', label: 'Retirar tu consentimiento para el uso de tus datos.' },
  { value: 'informacion_uso', label: 'Solicitar información sobre cómo usamos o compartimos tus datos.' },
  { value: 'limitar_fines', label: 'Solicitar que dejemos de usar tus datos para ciertos fines.' },
  { value: 'otro', label: 'Otro tipo de solicitud.' },
];

const opcionesPt: Opcion[] = [
  { value: 'retirar_historia', label: 'Retirar minha história ou minha resposta do site' },
  { value: 'confirmar_tratamiento', label: 'Confirmar se tratamos dados pessoais seus.' },
  { value: 'acceder', label: 'Acessar os dados pessoais que temos sobre você.' },
  { value: 'corregir', label: 'Corrigir dados incompletos, incorretos ou desatualizados.' },
  { value: 'eliminar', label: 'Solicitar a exclusão dos seus dados pessoais.' },
  { value: 'anonimizar_bloquear', label: 'Solicitar a anonimização ou o bloqueio de dados que já não sejam necessários.' },
  { value: 'retirar_consentimiento', label: 'Retirar seu consentimento para o uso dos seus dados.' },
  { value: 'informacion_uso', label: 'Solicitar informação sobre como usamos ou compartilhamos seus dados.' },
  { value: 'limitar_fines', label: 'Solicitar que deixemos de usar seus dados para certos fins.' },
  { value: 'otro', label: 'Outro tipo de solicitação.' },
];

const opcionesEn: Opcion[] = [
  { value: 'retirar_historia', label: 'Remove my story or my answer from the site' },
  { value: 'confirmar_tratamiento', label: 'Confirm whether we process personal data about you.' },
  { value: 'acceder', label: 'Access the personal data we hold about you.' },
  { value: 'corregir', label: 'Correct data that is incomplete, inaccurate or out of date.' },
  { value: 'eliminar', label: 'Ask us to delete your personal data.' },
  { value: 'anonimizar_bloquear', label: 'Ask us to anonymize or block data we no longer need.' },
  { value: 'retirar_consentimiento', label: 'Withdraw your consent for the use of your data.' },
  { value: 'informacion_uso', label: 'Ask how we use or share your data.' },
  { value: 'limitar_fines', label: 'Ask us to stop using your data for certain purposes.' },
  { value: 'otro', label: 'Another kind of request.' },
];

export const MIS_DATOS: Record<AlmaLocale, MisDatosCopy> = {
  es: {
    kicker: 'Privacidad',
    title: 'Solicitud sobre tus datos personales',
    intro: 'Puedes usar este formulario para solicitar información o ejercer tus derechos sobre los datos personales que hayas compartido con AlmaMundi. Es el mismo canal que describe el',
    introLink: 'Aviso de privacidad',
    cuidado: 'Atenderemos tu solicitud con cuidado, verificando tu identidad solo cuando sea necesario para proteger tu privacidad y evitar accesos no autorizados.',
    okTitle: 'Recibimos tu solicitud.',
    okBody: 'La enviamos al equipo de AlmaMundi. Si necesitamos aclarar algo, te escribiremos al correo que indicaste.',
    okMail: 'Si el envío automático no estuviera disponible en este momento, puedes escribir a',
    back: 'Volver al inicio',
    honeypot: 'Sitio web',
    tipo: 'Tipo de solicitud',
    opciones: opcionesEs,
    descripcion: 'Descripción de la solicitud',
    ayuda: 'Describe tu solicitud con el mayor detalle posible para poder ayudarte mejor. Puedes indicar qué datos quieres revisar, corregir o eliminar; en qué parte del sitio participaste; si enviaste una historia, fotografía, audio, texto o video; y el correo que usaste al participar.',
    identificacion: 'Identificación de la persona solicitante',
    nombre: 'Nombre completo',
    correo: 'Correo electrónico',
    telefono: 'Teléfono o medio de contacto alternativo',
    opcional: '(opcional)',
    pais: 'País',
    propios: '¿Haces esta solicitud sobre tus propios datos?',
    si: 'Sí',
    no: 'No',
    representacion: 'Si actúas en representación de otra persona, podremos pedir información adicional para verificar que tienes autorización.',
    verificacion: 'Verificación de identidad',
    verificacionCuerpo: 'Para proteger tu privacidad, es posible que solicitemos una verificación mínima de identidad antes de responder ciertas solicitudes.',
    confirma: 'Al enviar esta solicitud, confirmas que la información entregada es correcta y que AlmaMundi puede contactarte para gestionar tu requerimiento.',
    uso: 'Usaremos estos datos solo para responder a tu solicitud y proteger tus derechos de privacidad.',
    enviando: 'Enviando…',
    enviar: 'Enviar solicitud',
    aviso: 'Aviso de privacidad',
    errorEnvio: 'No se pudo enviar. Prueba de nuevo.',
    errorRed: 'Error de red. Prueba de nuevo.',
  },
  pt: {
    kicker: 'Privacidade',
    title: 'Solicitação sobre seus dados pessoais',
    intro: 'Você pode usar este formulário para pedir informação ou exercer seus direitos sobre os dados pessoais que compartilhou com o AlmaMundi. É o mesmo canal que descreve o',
    introLink: 'Aviso de privacidade',
    cuidado: 'Vamos atender sua solicitação com cuidado, verificando sua identidade só quando for necessário para proteger sua privacidade e evitar acessos não autorizados.',
    okTitle: 'Recebemos sua solicitação.',
    okBody: 'Enviamos ao time do AlmaMundi. Se precisarmos esclarecer algo, escreveremos para o e-mail que você indicou.',
    okMail: 'Se o envio automático não estiver disponível neste momento, você pode escrever para',
    back: 'Voltar ao início',
    honeypot: 'Site',
    tipo: 'Tipo de solicitação',
    opciones: opcionesPt,
    descripcion: 'Descrição da solicitação',
    ayuda: 'Descreva sua solicitação com o maior detalhe possível para podermos ajudar melhor. Você pode indicar quais dados quer revisar, corrigir ou excluir; em que parte do site participou; se enviou uma história, fotografia, áudio, texto ou vídeo; e o e-mail que usou ao participar.',
    identificacion: 'Identificação de quem solicita',
    nombre: 'Nome completo',
    correo: 'E-mail',
    telefono: 'Telefone ou outro contato',
    opcional: '(opcional)',
    pais: 'País',
    propios: 'Esta solicitação é sobre os seus próprios dados?',
    si: 'Sim',
    no: 'Não',
    representacion: 'Se você age em nome de outra pessoa, podemos pedir informação adicional para verificar que tem autorização.',
    verificacion: 'Verificação de identidade',
    verificacionCuerpo: 'Para proteger sua privacidade, podemos pedir uma verificação mínima de identidade antes de responder certas solicitações.',
    confirma: 'Ao enviar esta solicitação, você confirma que a informação está correta e que o AlmaMundi pode entrar em contato para cuidar do seu pedido.',
    uso: 'Usaremos estes dados só para responder à sua solicitação e proteger seus direitos de privacidade.',
    enviando: 'Enviando…',
    enviar: 'Enviar solicitação',
    aviso: 'Aviso de privacidade',
    errorEnvio: 'Não foi possível enviar. Tente de novo.',
    errorRed: 'Erro de rede. Tente de novo.',
  },
  en: {
    kicker: 'Privacy',
    title: 'Request about your personal data',
    intro: 'You can use this form to ask for information or exercise your rights over the personal data you shared with AlmaMundi. It is the same channel described in the',
    introLink: 'Privacy notice',
    cuidado: 'We will handle your request with care, checking your identity only when needed to protect your privacy and prevent unauthorized access.',
    okTitle: 'We received your request.',
    okBody: 'We sent it to the AlmaMundi team. If we need to clarify something, we will write to the email you gave.',
    okMail: 'If automatic sending is not available right now, you can write to',
    back: 'Back to the home',
    honeypot: 'Website',
    tipo: 'Type of request',
    opciones: opcionesEn,
    descripcion: 'Description of the request',
    ayuda: 'Describe your request in as much detail as you can so we can help. You can say which data you want to review, correct or delete; where on the site you took part; whether you sent a story, photo, audio, text or video; and the email you used.',
    identificacion: 'Who is making the request',
    nombre: 'Full name',
    correo: 'Email',
    telefono: 'Phone or another way to reach you',
    opcional: '(optional)',
    pais: 'Country',
    propios: 'Is this request about your own data?',
    si: 'Yes',
    no: 'No',
    representacion: 'If you are acting for someone else, we may ask for more information to confirm that you are authorized.',
    verificacion: 'Identity check',
    verificacionCuerpo: 'To protect your privacy, we may ask for a minimal identity check before answering some requests.',
    confirma: 'By sending this request, you confirm that the information is correct and that AlmaMundi may contact you to handle it.',
    uso: 'We will use this data only to answer your request and protect your privacy rights.',
    enviando: 'Sending…',
    enviar: 'Send request',
    aviso: 'Privacy notice',
    errorEnvio: 'We could not send it. Try again.',
    errorRed: 'Network error. Try again.',
  },
};
