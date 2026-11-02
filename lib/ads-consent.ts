export const CONSENT_KEY = 'am-consent';
const CONSENT_VIEJO = 'am-cookies-ok';
const ADS_ID = 'AW-17718043044';
const CONVERSION = 'AW-17718043044/dK-ICKuv_KMdEKTDz4BC';

export type ConsentValor = 'aceptar' | 'rechazar';

export type ConsentGuardado = {
  valor: ConsentValor;
  fecha: string;
  v1: true;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function leerConsentimiento(): ConsentGuardado | null {
  try {
    const crudo = localStorage.getItem(CONSENT_KEY);
    if (!crudo) return null;
    const dato = JSON.parse(crudo) as Partial<ConsentGuardado>;
    if (dato.v1 !== true) return null;
    if (dato.valor !== 'aceptar' && dato.valor !== 'rechazar') return null;
    if (typeof dato.fecha !== 'string') return null;
    return { valor: dato.valor, fecha: dato.fecha, v1: true };
  } catch {
    return null;
  }
}

export function guardarConsentimiento(valor: ConsentValor) {
  const dato: ConsentGuardado = { valor, fecha: new Date().toISOString(), v1: true };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(dato));
  localStorage.removeItem(CONSENT_VIEJO);
}

/** Quien tenía la clave vieja vuelve a ver el aviso. */
export function retirarConsentimientoViejo() {
  try {
    localStorage.removeItem(CONSENT_VIEJO);
  } catch {
    /* ignore */
  }
}

let carga: Promise<void> | null = null;

export function cargarGoogleAds(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (carga) return carga;
  carga = new Promise((resolve) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`;
    script.dataset.amAds = '1';
    script.onload = () => {
      window.gtag?.('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
      window.gtag?.('js', new Date());
      window.gtag?.('config', ADS_ID);
      resolve();
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
  return carga;
}

export function aplicarConsentimiento(valor: ConsentValor) {
  if (valor === 'aceptar') return cargarGoogleAds();
  window.gtag?.('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
  return Promise.resolve();
}

export function enviarConversionAds() {
  if (leerConsentimiento()?.valor !== 'aceptar') return;
  void cargarGoogleAds().then(() => {
    window.gtag?.('event', 'conversion', { send_to: CONVERSION });
  });
}
