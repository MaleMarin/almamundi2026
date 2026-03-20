'use client';

import { useState } from 'react';
import VideoPlayer from '@/components/historia/VideoPlayer';
import AudioPlayer from '@/components/historia/AudioPlayer';
import TextoReader from '@/components/historia/TextoReader';
import FotoAlbum from '@/components/historia/FotoAlbum';
import { MOCK_STORIES } from '@/lib/almamundi/mock-data';
import { SITE_FONT_STACK } from '@/lib/typography';

type ActiveFormat = 'video' | 'audio' | 'texto' | 'fotos' | null;

const CARDS: { key: ActiveFormat; emoji: string; name: string }[] = [
  { key: 'video', emoji: '🎬', name: 'Video' },
  { key: 'audio', emoji: '🎧', name: 'Audio' },
  { key: 'texto', emoji: '📝', name: 'Texto' },
  { key: 'fotos', emoji: '📷', name: 'Fotos' },
];

export default function PrototipoPage() {
  const [activeFormat, setActiveFormat] = useState<ActiveFormat>(null);

  return (
    <>
    <div
      className="font-sans"
      style={{
        minHeight: '100vh',
        background: '#f5f3ef',
        fontFamily: SITE_FONT_STACK,
        padding: '3rem 2rem',
      }}
    >
      <h1
        style={{
          fontFamily: SITE_FONT_STACK,
          fontSize: '2.5rem',
          fontWeight: 600,
          color: '#2a2520',
          textAlign: 'center',
          marginBottom: '2.5rem',
        }}
      >
        Prototipos AlmaMundi
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1.5rem',
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        {CARDS.map(({ key, emoji, name }) => (
          <div
            key={key}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '2rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>{emoji}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 500, color: '#2a2520' }}>{name}</span>
            <button
              type="button"
              onClick={() => setActiveFormat(key)}
              style={{
                padding: '0.6rem 1.25rem',
                background: '#c9a96e',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                fontFamily: SITE_FONT_STACK,
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Ver prototipo
            </button>
          </div>
        ))}
      </div>

      {activeFormat === 'video' && (
        <VideoPlayer
          historia={MOCK_STORIES.video}
          onClose={() => setActiveFormat(null)}
        />
      )}
      {activeFormat === 'audio' && (
        <AudioPlayer
          historia={MOCK_STORIES.audio}
          onClose={() => setActiveFormat(null)}
        />
      )}
      {activeFormat === 'texto' && (
        <TextoReader
          historia={MOCK_STORIES.texto}
          onClose={() => setActiveFormat(null)}
        />
      )}
      {activeFormat === 'fotos' && (
        <FotoAlbum
          historia={MOCK_STORIES.fotos}
          onClose={() => setActiveFormat(null)}
        />
      )}
    </div>
    </>
  );
}
