/** Coloca el panel del globo sobre los fundidos y lo frena antes del fundido inferior. */
export function placeGlobeStoryPanel(panel: HTMLElement): void {
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const fade = document.querySelector('.map-universe-fade-after');
  const fadeTop = fade instanceof HTMLElement ? fade.getBoundingClientRect().top : window.innerHeight;
  const bottomLimit = Math.min(window.innerHeight, fadeTop);
  const header = [...document.querySelectorAll('header')].find((node) => {
    const box = node.getBoundingClientRect();
    return getComputedStyle(node).position === 'fixed' && box.top <= 1 && box.height > 40;
  });
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
  const stage = document.querySelector('.map-universe-stage');
  const stageRect = stage instanceof HTMLElement ? stage.getBoundingClientRect() : null;
  const top = Math.max(24, headerBottom + 24, stageRect ? stageRect.top + 24 : 24);
  const available = Math.max(160, bottomLimit - top);

  panel.style.position = 'fixed';
  panel.style.zIndex = '8';
  panel.style.height = 'auto';
  panel.style.maxHeight = `${available}px`;
  if (mobile) {
    panel.style.top = 'auto';
    panel.style.bottom = `${Math.max(0, window.innerHeight - bottomLimit)}px`;
    panel.style.left = '0px';
    panel.style.right = '0px';
    panel.style.width = '100%';
  } else {
    panel.style.top = `${top}px`;
    panel.style.bottom = 'auto';
    panel.style.left = 'auto';
    panel.style.width = '420px';
    panel.style.right = `${stageRect ? Math.max(24, window.innerWidth - stageRect.right + 24) : 24}px`;
  }

  const card = panel.querySelector<HTMLElement>('.story-map-panel__card');
  const sheet = panel.querySelector<HTMLElement>('.story-map-panel__sheet');
  if (card) card.style.maxHeight = `${available}px`;
  if (sheet) sheet.style.maxHeight = `${available}px`;
}

/** La rueda y el trackpad desplazan el panel y no la página ni el globo. */
export function bindGlobePanelScroll(panel: HTMLElement, scroll: HTMLElement): () => void {
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroll.clientHeight : 1;
    scroll.scrollTop += event.deltaY * unit;
  };
  const stop = (event: Event) => event.stopPropagation();
  panel.addEventListener('wheel', onWheel, { passive: false, capture: true });
  panel.addEventListener('touchmove', stop, { passive: true });
  panel.addEventListener('pointerdown', stop);
  return () => {
    panel.removeEventListener('wheel', onWheel, { capture: true });
    panel.removeEventListener('touchmove', stop);
    panel.removeEventListener('pointerdown', stop);
  };
}

export function globePanelHasMore(el: HTMLElement): boolean {
  return el.scrollTop + el.clientHeight < el.scrollHeight - 2;
}
