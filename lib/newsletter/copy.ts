import type { AlmaLocale } from "@/lib/i18n/locale";

export const NEWSLETTER_CONSENT_VERSION = "sonder-2026-10+privacidad-2026-08-27";

const sonderDefinition = {
  es: "Darte cuenta de que cada persona que pasa a tu lado tiene una vida tan vívida como la tuya.",
  pt: "Perceber que cada pessoa que passa por você tem uma vida tão intensa quanto a sua.",
  en: "Realizing that everyone you pass has a life as vivid and complex as yours.",
} as const;

export type NewsletterOrigin = "franja" | "contar";

const confirmMail = {
  es: {
    subject: "Confirma tu suscripción a Sonder",
    definition: sonderDefinition.es,
    body: "Para empezar a recibir historias nuevas, confirma tu correo.",
    button: "Confirmar suscripción",
    note: "Si no fuiste tú, ignora este mensaje y no recibirás nada.",
  },
  pt: {
    subject: "Confirme sua assinatura da Sonder",
    definition: sonderDefinition.pt,
    body: "Para começar a receber novas histórias, confirme seu e-mail.",
    button: "Confirmar assinatura",
    note: "Se não foi você, ignore esta mensagem e não receberá nada.",
  },
  en: {
    subject: "Confirm your Sonder subscription",
    definition: sonderDefinition.en,
    body: "To start receiving new stories, confirm your email.",
    button: "Confirm subscription",
    note: "If this wasn't you, ignore this message and you won't receive anything.",
  },
} as const;

export function newsletterConfirmMail(locale: AlmaLocale) {
  return confirmMail[locale];
}

const band = {
  es: {
    eyebrow: "Sonder",
    title: "Historias que llegan a tu correo",
    text: "Una vez al mes, las historias nuevas del mapa y las cintas del mes.",
    email: "Tu correo electrónico",
    button: "Suscribirme",
    consentBefore: "Acepto recibir Sonder, la newsletter de AlmaMundi, y la ",
    privacy: "Política de privacidad",
    consentAfter: ". Puedo darme de baja cuando quiera.",
    sent: "Revisa tu correo para confirmar tu suscripción.",
    emailInvalid: "Escribe un correo válido.",
    verify: "No pudimos comprobar el envío. Inténtalo de nuevo.",
    send: "No pudimos enviar la confirmación. Inténtalo de nuevo.",
    limit: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
  },
  pt: {
    eyebrow: "Sonder",
    title: "Histórias que chegam ao seu e-mail",
    text: "Uma vez por mês, as novas histórias do mapa e as fitas do mês.",
    email: "Seu e-mail",
    button: "Assinar",
    consentBefore: "Aceito receber a Sonder, a newsletter do AlmaMundi, e a ",
    privacy: "Política de privacidade",
    consentAfter: ". Posso cancelar quando quiser.",
    sent: "Confira seu e-mail para confirmar a assinatura.",
    emailInvalid: "Escreva um e-mail válido.",
    verify: "Não conseguimos verificar o envio. Tente de novo.",
    send: "Não conseguimos enviar a confirmação. Tente de novo.",
    limit: "Muitas tentativas. Espere um momento e tente de novo.",
  },
  en: {
    eyebrow: "Sonder",
    title: "Stories in your inbox",
    text: "Once a month, the new stories on the map and the ribbons of the month.",
    email: "Your email",
    button: "Subscribe",
    consentBefore: "I agree to receive Sonder, the AlmaMundi newsletter, and accept the ",
    privacy: "Privacy policy",
    consentAfter: ". I can unsubscribe anytime.",
    sent: "Check your email to confirm your subscription.",
    emailInvalid: "Enter a valid email.",
    verify: "We couldn't verify the submission. Try again.",
    send: "We couldn't send the confirmation. Try again.",
    limit: "Too many attempts. Wait a moment and try again.",
  },
} as const;

export function newsletterBandCopy(locale: AlmaLocale) {
  return band[locale];
}

const pages = {
  es: {
    brand: "Sonder · AlmaMundi",
    confirmed: "Listo. Te escribiremos cuando haya historias nuevas en el mapa.",
    unsubscribed: "Te diste de baja. No te enviaremos más correos.",
    invalid: "Este enlace no es válido.",
    map: "Explorar el mapa",
  },
  pt: {
    brand: "Sonder · AlmaMundi",
    confirmed: "Pronto. Vamos escrever quando houver novas histórias no mapa.",
    unsubscribed: "Assinatura cancelada. Não enviaremos mais e-mails.",
    invalid: "Este link não é válido.",
    map: "Explorar o mapa",
  },
  en: {
    brand: "Sonder · AlmaMundi",
    confirmed: "You're in. We'll write when there are new stories on the map.",
    unsubscribed: "You've unsubscribed. We won't send you any more emails.",
    invalid: "This link isn't valid.",
    map: "Explore the map",
  },
} as const;

export function newsletterPageCopy(locale: AlmaLocale) {
  return pages[locale];
}
