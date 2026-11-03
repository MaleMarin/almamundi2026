import type { AlmaLocale } from '@/lib/i18n/locale';

export type ComoFuncionaStep = {
  lead: string;
  rest: string;
};

export type ComoFuncionaSafeItem =
  | { kind: 'text'; text: string }
  | { kind: 'link'; before: string; link: string; after: string };

export type ComoFuncionaCopy = {
  title: string;
  intro: string;
  steps: ComoFuncionaStep[];
  safeTitle: string;
  safe: ComoFuncionaSafeItem[];
  privacy: string;
  close: string;
};

export const COMO_FUNCIONA: Record<AlmaLocale, ComoFuncionaCopy> = {
  es: {
    title: '¿Cómo funciona?',
    intro:
      'AlmaMundi es un mapa vivo de historias contadas en primera persona, desde cualquier lugar del mundo. Contar la tuya toma unos minutos y no necesitas crear una cuenta.',
    steps: [
      {
        lead: 'Elige cómo contarla.',
        rest: 'En video, audio, texto o foto, desde tu celular o tu computador.',
      },
      {
        lead: 'Empieza por una pregunta: toca una cinta.',
        rest: 'Cada cinta es un tema y guarda preguntas para despertar un recuerdo. Puedes responder una pregunta con unas líneas, tu voz o una foto.',
      },
      {
        lead: 'Deja tu pregunta o responde la de otra persona.',
        rest: 'En «Me gustaría saber de ti» puedes dejar una pregunta para que otras personas la respondan, o responder una por escrito o con tu voz. Cada pregunta aparece en el globo con un punto de colores.',
      },
      {
        lead: 'Dinos dónde ocurrió.',
        rest: 'Así tu historia encuentra su lugar en el mapa. Tu correo es opcional y nunca se muestra.',
      },
      {
        lead: 'La revisamos con cuidado.',
        rest: 'Una persona del equipo lee o escucha cada envío. Nada se publica de forma automática.',
      },
      {
        lead: 'Te avisamos cuando esté en el mapa.',
        rest: 'Si dejaste tu correo, te escribimos con el enlace. Desde ese momento, cualquiera puede encontrarla en el globo.',
      },
    ],
    safeTitle: 'Para que este sea un lugar seguro',
    safe: [
      {
        kind: 'text',
        text: 'Puedes contar si tienes 18 años o más. Si en tu historia aparece otra persona, necesitas su permiso. Si es menor de edad, el envío lo hace una persona adulta responsable o una institución, con autorización.',
      },
      {
        kind: 'text',
        text: 'No publicamos insultos, discriminación, amenazas, violencia, abusos, contenido que exponga a otras personas sin su permiso ni material copiado de otros.',
      },
      {
        kind: 'text',
        text: 'Podemos pedirte ajustes, no publicar una historia o retirarla si pone en riesgo a alguien.',
      },
      {
        kind: 'link',
        before:
          'Solo te pedimos lo necesario para revisar tu envío. Si quieres corregir o retirar lo que compartiste, usa ',
        link: 'Mis datos personales',
        after: ' o escríbenos a hola@almamundi.org.',
      },
    ],
    privacy: 'Lee el Aviso de privacidad',
    close: 'Cerrar',
  },
  pt: {
    title: 'Como funciona?',
    intro:
      'O AlmaMundi é um mapa vivo de histórias contadas em primeira pessoa, de qualquer lugar do mundo. Contar a sua leva poucos minutos, e você não precisa criar uma conta.',
    steps: [
      {
        lead: 'Escolha como contar.',
        rest: 'Em vídeo, áudio, texto ou foto, pelo celular ou pelo computador.',
      },
      {
        lead: 'Comece por uma pergunta: toque uma fita.',
        rest: 'Cada fita é um tema e guarda perguntas para despertar uma lembrança. Você pode responder a uma pergunta com algumas linhas, com a sua voz ou com uma foto.',
      },
      {
        lead: 'Deixe sua pergunta ou responda à de outra pessoa.',
        rest: 'Em «Eu gostaria de saber de você» você pode deixar uma pergunta para que outras pessoas respondam, ou responder a uma por escrito ou com sua voz. Cada pergunta aparece no globo com um ponto colorido.',
      },
      {
        lead: 'Conte onde aconteceu.',
        rest: 'Assim a sua história encontra o seu lugar no mapa. O e-mail é opcional e nunca aparece.',
      },
      {
        lead: 'Revisamos com cuidado.',
        rest: 'Uma pessoa da equipe lê ou escuta cada envio. Nada é publicado automaticamente.',
      },
      {
        lead: 'Avisamos quando estiver no mapa.',
        rest: 'Se você deixou o seu e-mail, escrevemos com o link. A partir daí, qualquer pessoa pode encontrá-la no globo.',
      },
    ],
    safeTitle: 'Para que este seja um lugar seguro',
    safe: [
      {
        kind: 'text',
        text: 'Você pode contar se tiver 18 anos ou mais. Se outra pessoa aparece na sua história, você precisa da permissão dela. Se for menor de idade, o envio é feito por um adulto responsável ou por uma instituição, com autorização.',
      },
      {
        kind: 'text',
        text: 'Não publicamos insultos, discriminação, ameaças, violência, abusos, conteúdos que exponham outras pessoas sem permissão nem material copiado de terceiros.',
      },
      {
        kind: 'text',
        text: 'Podemos pedir ajustes, não publicar uma história ou retirá-la se ela colocar alguém em risco.',
      },
      {
        kind: 'link',
        before:
          'Pedimos só o necessário para revisar o seu envio. Para corrigir ou retirar o que você compartilhou, use ',
        link: 'Meus dados pessoais',
        after: ' ou escreva para hola@almamundi.org.',
      },
    ],
    privacy: 'Leia o Aviso de privacidade',
    close: 'Fechar',
  },
  en: {
    title: 'How does it work?',
    intro:
      "AlmaMundi is a living map of stories told in the first person, from anywhere in the world. Telling yours takes a few minutes, and you don't need to create an account.",
    steps: [
      {
        lead: 'Choose how to tell it.',
        rest: 'Video, audio, text or photo, from your phone or your computer.',
      },
      {
        lead: 'Start with a question: tap a ribbon.',
        rest: 'Each ribbon is a theme that holds questions to spark a memory. You can answer a question with a few lines, your voice or a photo.',
      },
      {
        lead: 'Leave your question or answer someone else\'s.',
        rest: 'In “I’d love to hear from you” you can leave a question for other people to answer, or answer one in writing or with your voice. Each question appears on the globe as a colorful dot.',
      },
      {
        lead: 'Tell us where it happened.',
        rest: "That's how your story finds its place on the map. Your email is optional and never shown.",
      },
      {
        lead: 'We review it with care.',
        rest: 'Someone on our team reads or listens to every submission. Nothing is published automatically.',
      },
      {
        lead: "We let you know when it's on the map.",
        rest: "If you left your email, we'll send you the link. From then on, anyone can find it on the globe.",
      },
    ],
    safeTitle: 'Keeping this a safe place',
    safe: [
      {
        kind: 'text',
        text: "You can tell your story if you're 18 or older. If someone else appears in it, you need their permission. If they're a minor, the submission must come from a responsible adult or an institution, with authorization.",
      },
      {
        kind: 'text',
        text: "We don't publish insults, discrimination, threats, violence, abuse, content that exposes others without their permission, or material copied from someone else.",
      },
      {
        kind: 'text',
        text: 'We may ask for changes, decline to publish a story, or remove it if it puts someone at risk.',
      },
      {
        kind: 'link',
        before: 'We only ask for what we need to review your submission. To correct or remove what you shared, use ',
        link: 'My personal data',
        after: ' or write to hola@almamundi.org.',
      },
    ],
    privacy: 'Read the Privacy notice',
    close: 'Close',
  },
};
