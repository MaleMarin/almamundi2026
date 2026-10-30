type HomeCapa = 'stories' | 'news' | 'sounds' | 'bits' | 'search' | 'respuestas';

/** Vista de la home guardada en la entrada actual del historial. */
export type HomeView = {
  scrollY: number;
  /** Cajón del mapa abierto. `null` si estaba cerrado. */
  capa: HomeCapa | null;
  layers: {
    stories: boolean;
    bits: boolean;
    news: boolean;
    respuestas: boolean;
  };
};

const STORAGE_KEY = 'alma-home-view';
const CAPAS = new Set<HomeCapa>(['stories', 'news', 'sounds', 'bits', 'search', 'respuestas']);

let pending: HomeView | null = null;
let scrollRestored = false;
let listening = false;
/** Evita que el primer render tras Atrás pise la vista guardada con scroll 0. */
let writesHeld = false;

function defaultView(scrollY = 0): HomeView {
  return {
    scrollY,
    capa: null,
    layers: { stories: true, bits: true, news: false, respuestas: true },
  };
}

function isView(value: unknown): value is HomeView {
  if (!value || typeof value !== 'object') return false;
  const view = value as HomeView;
  const layers = view.layers;
  return (
    typeof view.scrollY === 'number' &&
    Number.isFinite(view.scrollY) &&
    (view.capa === null || CAPAS.has(view.capa)) &&
    !!layers &&
    typeof layers.stories === 'boolean' &&
    typeof layers.bits === 'boolean' &&
    typeof layers.news === 'boolean' &&
    typeof layers.respuestas === 'boolean'
  );
}

export function currentHomeScrollY(): number {
  if (typeof window === 'undefined') return 0;
  const lenis = window.__almamundiLenis as { scroll?: number } | undefined;
  if (lenis && typeof lenis.scroll === 'number') return lenis.scroll;
  return window.scrollY;
}

function readStored(): HomeView | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isView(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeView(view: HomeView, url?: string) {
  if (writesHeld) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(view));
  } catch {
    /* modo privado */
  }
  const current = window.history.state;
  const base = current && typeof current === 'object' ? current : {};
  if (url) window.history.replaceState({ ...base, almaHome: view }, '', url);
  else window.history.replaceState({ ...base, almaHome: view }, '');
}

function onHomePath(): boolean {
  const path = window.location.pathname;
  return path === '/' || path === '';
}

function writeStored(view: HomeView) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(view));
  } catch {
    /* modo privado */
  }
}

/** Actualiza la vista guardada sin tocar el historial (el router de Next se rompe si replaceState corre en cada scroll). */
export function rememberHomeView(view: HomeView) {
  if (typeof window === 'undefined' || !onHomePath()) return;
  writeStored(view);
}

/** Deja `?historia=` o `?respuesta=` en la entrada actual. */
export function replaceHomePanel(kind: 'historia' | 'respuesta' | null, id: string | null, view: HomeView) {
  if (typeof window === 'undefined' || !onHomePath()) return;
  const url = new URL(window.location.href);
  url.searchParams.delete('historia');
  url.searchParams.delete('respuesta');
  if (kind && id) url.searchParams.set(kind, id);
  const next = `${url.pathname}${url.search}${url.hash}`;
  writeView(view, next);
}

export function touchHomeScroll() {
  if (typeof window === 'undefined' || !onHomePath()) return;
  const y = currentHomeScrollY();
  const fromState = window.history.state?.almaHome;
  const base = readStored() ?? (isView(fromState) ? fromState : defaultView(y));
  writeStored({ ...base, scrollY: y });
}

export function peekHomeRestore(): HomeView | null {
  return pending;
}

export function consumeHomeRestore(): HomeView | null {
  const view = pending;
  pending = null;
  return view;
}

export function markHomeScrollRestored(on: boolean) {
  scrollRestored = on;
  writesHeld = false;
}

/** El regreso con Atrás ya dejó el scroll. No lo pisa el ancla del mapa. */
export function homeScrollRestored(): boolean {
  return scrollRestored;
}

export function applyHomeScroll(y: number) {
  const go = () => {
    window.scrollTo(0, y);
    window.__almamundiLenis?.scrollTo(y, { immediate: true });
  };
  go();
  window.requestAnimationFrame(go);
  window.setTimeout(go, 60);
  window.setTimeout(go, 280);
  window.setTimeout(go, 700);
}

function armRestore() {
  if (!onHomePath()) return;
  const stored = readStored();
  const fromState = window.history.state?.almaHome;
  const view = stored ?? (isView(fromState) ? fromState : null);
  if (view) pending = view;
}

function isBackForward(): boolean {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === 'back_forward';
}

/** Escucha Atrás y el scroll de la home. Una sola vez por pestaña. */
export function installHomeReturnListener() {
  if (typeof window === 'undefined' || listening) return;
  listening = true;
  window.addEventListener('popstate', () => {
    const run = () => {
      armRestore();
      if (!pending || !onHomePath()) return;
      markHomeScrollRestored(true);
      applyHomeScroll(pending.scrollY);
    };
    run();
    queueMicrotask(run);
  });
  let timer = 0;
  let freezeUntil = 0;
  window.addEventListener(
    'scroll',
    () => {
      if (!onHomePath() || Date.now() < freezeUntil) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(touchHomeScroll, 80);
    },
    { passive: true }
  );
  const saveBeforeLeave = () => {
    if (!onHomePath()) return;
    window.clearTimeout(timer);
    touchHomeScroll();
    freezeUntil = Date.now() + 1000;
  };
  document.addEventListener('pointerdown', saveBeforeLeave, true);
  document.addEventListener('click', saveBeforeLeave, true);
}

const BACK_URL_KEY = 'alma-home-back';

function homeUrlKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Next a veces recarga la home al volver y esa carga no figura como «back_forward».
 * pagehide guarda la URL de la home; si la siguiente carga es esa misma URL, se restaura.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (!onHomePath()) return;
    try {
      sessionStorage.setItem(BACK_URL_KEY, homeUrlKey());
    } catch {
      /* modo privado */
    }
  });

  const navType = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  let markedBack = false;
  try {
    markedBack = sessionStorage.getItem(BACK_URL_KEY) === homeUrlKey();
    if (navType?.type === 'reload' || (markedBack && onHomePath())) {
      sessionStorage.removeItem(BACK_URL_KEY);
    }
  } catch {
    markedBack = false;
  }

  if (onHomePath() && navType?.type !== 'reload' && (markedBack || isBackForward())) {
    armRestore();
    if (pending) writesHeld = true;
  }
}
