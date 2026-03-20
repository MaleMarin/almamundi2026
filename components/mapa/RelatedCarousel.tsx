'use client';

import { useEffect, useState, useRef } from 'react';
import type { StoryPoint } from '@/lib/map-data/stories';
import { SITE_FONT_STACK } from '@/lib/typography';

type Props = {
  currentStoryId: string;
  onSelect: (story: StoryPoint) => void;
};

export function RelatedCarousel({ currentStoryId, onSelect }: Props) {
  const [stories, setStories] = useState<StoryPoint[]>([]);
  const [active, setActive] = useState(1);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  useEffect(() => {
    fetch(`/api/stories/${currentStoryId}/similar`)
      .then((r) => r.json())
      .then((d: { similar?: StoryPoint[] }) => {
        const list = d.similar ?? [];
        setStories(list);
        setActive(
          list.length === 0 ? 0 : Math.min(list.length - 1, Math.max(0, Math.floor(list.length / 2)))
        );
      })
      .catch(() => {});
  }, [currentStoryId]);

  if (stories.length === 0) return null;

  const prev = () => setActive((a) => Math.max(0, a - 1));
  const next = () => setActive((a) => Math.min(stories.length - 1, a + 1));

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    startX.current = e.clientX;
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!dragging) return;
    setDragging(false);
    const diff = startX.current - e.clientX;
    if (diff > 40) next();
    if (diff < -40) prev();
  };
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 40) next();
    if (diff < -40) prev();
  };

  return (
    <div style={{ marginTop: 32 }}>
      <p
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          margin: '0 0 20px',
          fontFamily: SITE_FONT_STACK,
        }}
      >
        También podría resonar contigo
      </p>

      <div style={{ perspective: '800px', perspectiveOrigin: '50% 50%' }}>
        <div
          style={{
            position: 'relative',
            height: 220,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            overflow: 'hidden',
          }}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={() => setDragging(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {stories.map((s, i) => {
            const offset = i - active;
            const absOff = Math.abs(offset);

            if (absOff > 2) return null;

            const translateX = offset * 160;
            const translateZ = -absOff * 60;
            const rotateY = offset * -18;
            const scale = 1 - absOff * 0.12;
            const opacity = 1 - absOff * 0.35;
            const zIndex = 10 - absOff;
            const isCurrent = offset === 0;

            return (
              <div
                key={s.id ?? i}
                onClick={() => {
                  if (isCurrent) {
                    onSelect(s);
                  } else {
                    setActive(i);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 200,
                  height: 160,
                  marginLeft: -100,
                  marginTop: -80,
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transformStyle: 'preserve-3d',
                  opacity,
                  zIndex,
                  transition: dragging ? 'none' : 'all 400ms cubic-bezier(0.22,1,0.36,1)',
                  cursor: 'pointer',
                  borderRadius: 16,
                  background: isCurrent
                    ? 'rgba(255,255,255,0.09)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${
                    isCurrent ? 'rgba(249,115,22,0.30)' : 'rgba(255,255,255,0.08)'
                  }`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: isCurrent
                    ? '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.15)'
                    : '0 8px 24px rgba(0,0,0,0.3)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  overflow: 'hidden',
                }}
              >
                {isCurrent && (
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.08) 0%, transparent 70%)',
                      borderRadius: 16,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: isCurrent
                        ? 'rgba(249,115,22,0.70)'
                        : 'rgba(255,255,255,0.25)',
                      margin: '0 0 4px',
                      fontFamily: SITE_FONT_STACK,
                    }}
                  >
                    {[s.city, s.country].filter(Boolean).join(', ')}
                  </p>

                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: isCurrent ? 400 : 300,
                      color: isCurrent
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(255,255,255,0.60)',
                      margin: 0,
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      fontFamily: SITE_FONT_STACK,
                    }}
                  >
                    {s.title ?? s.label}
                  </p>

                  {isCurrent && (
                    <p
                      style={{
                        fontSize: 10,
                        color: 'rgba(249,115,22,0.60)',
                        margin: '8px 0 0',
                        fontFamily: SITE_FONT_STACK,
                        letterSpacing: '0.04em',
                      }}
                    >
                      Toca para abrir →
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          marginTop: 16,
        }}
      >
        {stories.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            style={{
              width: i === active ? 20 : 6,
              height: 6,
              borderRadius: 999,
              background:
                i === active ? 'rgba(249,115,22,0.70)' : 'rgba(255,255,255,0.18)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              outline: 'none',
              transition: 'all 300ms ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
