'use client';

/**
 * Etiqueta obligatoria para relatos demo / beta_demo (Opción A, copy fijo editorial).
 */
import {
  DEMO_STORY_LABEL,
  DEMO_STORY_NOTICE,
  storyShowsDemoDisclaimer,
} from '@/lib/demo-stories-public';
import type { StoryPoint } from '@/lib/map-data/stories';

export type DemoStoryDisclosureProps = {
  story: Pick<
    StoryPoint,
    | 'id'
    | 'isDemo'
    | 'isBetaDemo'
    | 'isRealStory'
    | 'editorialStatus'
    | 'demoNotice'
  >;
  /** `card` = tarjeta carrusel; `panel` = listado/map drawer; `page` = detalle */
  variant?: 'card' | 'panel' | 'page';
  /** Contraste en fondos claros (/historias interior). */
  onLightBackground?: boolean;
  className?: string;
};

export function DemoStoryDisclosure({
  story,
  variant = 'page',
  onLightBackground = false,
  className = '',
}: DemoStoryDisclosureProps) {
  if (!storyShowsDemoDisclaimer(story as StoryPoint)) return null;

  const notice =
    typeof story.demoNotice === 'string' && story.demoNotice.trim()
      ? story.demoNotice.trim()
      : DEMO_STORY_NOTICE;

  const isCompact = variant === 'panel' || variant === 'card';

  const shell =
    onLightBackground
      ? 'rounded-xl border border-amber-800/35 bg-amber-50 px-3 py-2.5 text-left shadow-sm'
      : 'rounded-xl border border-amber-700/55 bg-amber-950/25 px-3 py-2.5 text-left shadow-inner';

  const titleCls = onLightBackground
    ? 'text-[11px] font-semibold uppercase tracking-wide text-amber-950/95'
    : 'text-[11px] font-semibold uppercase tracking-wide text-amber-200/95';

  const bodyCls = onLightBackground
    ? isCompact
      ? 'mt-1 text-[11px] leading-snug text-gray-800 line-clamp-3'
      : 'mt-1.5 text-sm leading-relaxed text-gray-800'
    : isCompact
      ? 'mt-1 text-[11px] leading-snug text-amber-100/88 line-clamp-3'
      : 'mt-1.5 text-sm leading-relaxed text-amber-50/92';

  return (
    <aside
      className={`${shell} ${className}`}
      role="note"
      aria-label={DEMO_STORY_LABEL}
      data-demo-disclosure="true"
    >
      <p className={titleCls}>{DEMO_STORY_LABEL}</p>
      <p className={bodyCls}>{notice}</p>
    </aside>
  );
}
