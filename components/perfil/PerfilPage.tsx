'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { UserProfile, Muestra } from '@/lib/almamundi/perfil-queries';
import type { StoryData } from '@/lib/story-schema';
import { MuestraCard } from './MuestraCard';
import { GuardadasGrid } from './GuardadasGrid';
import { NuevaMuestraModal } from './NuevaMuestraModal';

const BG = '#e8ecf0';
const SH_LIGHT = 'rgba(255,255,255,0.85)';
const SH_DARK = 'rgba(163,177,198,0.6)';
const TEXT_1 = '#1a2332';
const TEXT_2 = '#4a5568';
const TEXT_3 = '#8896a5';
const ORANGE = '#ff6b2b';
const ORANGE_2 = '#ff8c55';
const GREEN = '#00d4aa';

type TabId = 'muestras' | 'guardadas' | 'propias' | 'temas';

type Props = {
  perfil: UserProfile;
  muestras: Muestra[];
  guardadas: StoryData[];
  propias: StoryData[];
  isOwner: boolean;
};

export function PerfilPage({ perfil, muestras: initialMuestras, guardadas, propias, isOwner }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('muestras');
  const [isMobile, setIsMobile] = useState(false);
  const [muestras, setMuestras] = useState<Muestra[]>(initialMuestras);
  const [frase, setFrase] = useState(perfil.frase ?? '');
  const [editingFrase, setEditingFrase] = useState(false);
  const [fraseInput, setFraseInput] = useState(perfil.frase ?? '');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setMuestras(initialMuestras);
  }, [initialMuestras]);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const saveFrase = async () => {
    const value = fraseInput.trim();
    setEditingFrase(false);
    if (value === frase) return;
    setFrase(value);
    if (!db || !perfil.uid) return;
    try {
      await updateDoc(doc(db, 'users', perfil.uid), { frase: value });
    } catch (err) {
      setFrase(perfil.frase ?? '');
    }
  };

  const temasCont = useMemo(() => {
    const acc: Record<string, number> = {};
    guardadas.forEach((h) => {
      (h.temas ?? []).forEach((t) => {
        acc[t] = (acc[t] || 0) + 1;
      });
    });
    return acc;
  }, [guardadas]);
  const temasSorted = useMemo(
    () => Object.entries(temasCont).sort((a, b) => b[1] - a[1]),
    [temasCont]
  );

  const heroHeight = isMobile ? 130 : 160;
  const avatarSize = isMobile ? 60 : 72;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        paddingBottom: 48,
      }}
    >
      {/* Hero */}
      <div
        style={{
          height: heroHeight,
          margin: isMobile ? '0.8rem 0.8rem 0' : '1.2rem 1.2rem 0',
          borderRadius: 20,
          background: 'linear-gradient(135deg, #1a2332, #0f1a2e, #1a1a14)',
          boxShadow: `8px 8px 24px ${SH_DARK}, -4px -4px 16px ${SH_LIGHT}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,43,0.3) 0%, transparent 70%)',
            top: -40,
            left: -40,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,170,0.2) 0%, transparent 70%)',
            bottom: -30,
            right: -30,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,140,85,0.2) 0%, transparent 70%)',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            padding: '1.2rem 1.5rem',
            height: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {!editingFrase ? (
            <>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 300,
                  fontSize: '0.92rem',
                  color: frase ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.4)',
                  fontStyle: 'italic',
                  flex: 1,
                }}
              >
                {frase || 'Escribe tu frase...'}
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingFrase(true);
                    setFraseInput(frase);
                  }}
                  style={{
                    padding: '0.4rem 0.7rem',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  Editar frase
                </button>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={fraseInput}
                onChange={(e) => setFraseInput(e.target.value)}
                onBlur={saveFrase}
                onKeyDown={(e) => e.key === 'Enter' && saveFrase()}
                autoFocus
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 10,
                  padding: '0.5rem 0.8rem',
                  color: '#fff',
                  fontSize: '0.92rem',
                }}
              />
              <button
                type="button"
                onClick={saveFrase}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  background: ORANGE,
                  color: '#fff',
                }}
              >
                Guardar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Avatar + info */}
      <div
        style={{
          margin: isMobile ? '0 0.8rem' : '0 1.2rem',
          paddingTop: 0,
          marginTop: -avatarSize / 2,
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_2})`,
            border: `3px solid ${BG}`,
            boxShadow: `5px 5px 12px ${SH_DARK}, -3px -3px 8px ${SH_LIGHT}`,
          }}
        />
        <h1
          style={{
            margin: '0.75rem 0 0',
            fontFamily: 'Fraunces, serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '1.2rem',
            color: TEXT_1,
          }}
        >
          {perfil.nombre}
        </h1>
        {perfil.ubicacion && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: ORANGE,
            }}
          >
            {perfil.ubicacion}
          </p>
        )}
        {perfil.bio && (
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.78rem',
              fontWeight: 300,
              color: TEXT_2,
              textAlign: 'center',
              maxWidth: 320,
            }}
          >
            {perfil.bio}
          </p>
        )}
        {isOwner && (
          <button
            type="button"
            style={{
              marginTop: 12,
              padding: '0.5rem 1rem',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              background: BG,
              color: TEXT_2,
              boxShadow: `4px 4px 8px ${SH_DARK}, -4px -4px 8px ${SH_LIGHT}`,
            }}
          >
            Editar perfil
          </button>
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          margin: '1.2rem 1.2rem 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        {[
          { num: muestras.length, label: 'Muestras' },
          { num: guardadas.length, label: 'Guardadas' },
          { num: propias.length, label: 'Mis historias' },
        ].map(({ num, label }) => (
          <div
            key={label}
            style={{
              background: BG,
              borderRadius: 14,
              padding: '0.9rem 0.5rem',
              textAlign: 'center',
              boxShadow: `4px 4px 8px ${SH_DARK}, -4px -4px 8px ${SH_LIGHT}`,
            }}
          >
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: '1.4rem', color: TEXT_1 }}>
              {num}
            </div>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: TEXT_3, marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          margin: '1.2rem 1.2rem 0',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {(
          [
            { id: 'muestras' as TabId, label: 'Muestras' },
            { id: 'guardadas' as TabId, label: 'Guardadas' },
            { id: 'propias' as TabId, label: 'Mis historias' },
            { id: 'temas' as TabId, label: 'Temas' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            style={{
              flexShrink: 0,
              padding: '0.5rem 1rem',
              borderRadius: 50,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              background: activeTab === id ? `linear-gradient(135deg, ${ORANGE}, ${ORANGE_2})` : BG,
              color: activeTab === id ? '#fff' : TEXT_2,
              boxShadow: activeTab === id ? `3px 3px 10px rgba(255,107,43,0.35)` : `4px 4px 8px ${SH_DARK}, -4px -4px 8px ${SH_LIGHT}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ margin: '1rem 1.2rem 0' }}>
        {activeTab === 'muestras' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: 14,
            }}
          >
            {muestras.map((m) => (
              <MuestraCard key={m.id} muestra={m} onClick={() => {}} />
            ))}
            {isOwner && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setModalOpen(true)}
                onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
                style={{
                  background: BG,
                  boxShadow: `inset 4px 4px 8px ${SH_DARK}, inset -4px -4px 8px ${SH_LIGHT}`,
                  borderRadius: 16,
                  minHeight: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: TEXT_3,
                }}
              >
                + Nueva muestra
              </div>
            )}
          </div>
        )}

        {activeTab === 'guardadas' && (
          <GuardadasGrid
            historias={guardadas}
            onLoadMore={() => {}}
            hasMore={false}
            columns={isMobile ? 2 : 4}
          />
        )}

        {activeTab === 'propias' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {propias.map((h) => (
              <a
                key={h.id}
                href={`/historias/${h.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.6rem 0.8rem',
                  background: BG,
                  borderRadius: 12,
                  boxShadow: `5px 5px 12px ${SH_DARK}, -3px -3px 8px ${SH_LIGHT}`,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 8,
                    background: h.imageUrl ? `url(${h.imageUrl}) center/cover` : 'linear-gradient(135deg, #1a2332, #2d3748)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 500, color: TEXT_1 }}>{h.titulo}</p>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: h.status === 'published' ? 'rgba(0,212,170,0.12)' : 'rgba(255,107,43,0.15)',
                      color: h.status === 'published' ? '#047857' : ORANGE,
                    }}
                  >
                    {h.status === 'published' ? 'Publicada' : 'En revisión'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {activeTab === 'temas' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {temasSorted.map(([tema, count], i) => (
              <span
                key={tema}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 50,
                  background: BG,
                  boxShadow: `4px 4px 8px ${SH_DARK}, -4px -4px 8px ${SH_LIGHT}`,
                  fontSize: i < 3 ? '0.8rem' : '0.7rem',
                  color: TEXT_2,
                }}
              >
                {tema} <span style={{ color: ORANGE, marginLeft: 4 }}>{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <NuevaMuestraModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(m) => setMuestras((prev) => [m, ...prev])}
        autorId={perfil.uid}
        autorNombre={perfil.nombre}
      />
    </div>
  );
}
