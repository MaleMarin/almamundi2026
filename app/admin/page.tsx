'use client';

/**
 * Panel Admin AlmaMundi — protegido con Firebase Auth.
 * Solo usuarios con email en lib/adminEmails.ts pueden entrar; el resto → redirect /mapa.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  type User,
  signOut,
} from 'firebase/auth';
import { isAdminEmail } from '@/lib/adminEmails';
import {
  Check,
  X,
  Star,
  Archive,
  Plus,
  LogOut,
  BarChart3,
  FileText,
  MapPin,
  Image as ImageIcon,
  Mic,
  Video,
  FolderOpen,
} from 'lucide-react';

const BG = '#0a0f24';
const APP_FONT = "'Avenir Light', Avenir, sans-serif";

const glassCard = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 22,
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)' as const,
  boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
  padding: '20px 24px',
};

type StoryStatus = 'pending' | 'active' | 'archived' | 'rejected';
type StoryFormat = 'video' | 'audio' | 'text' | 'photos';

type Story = {
  id: string;
  title: string;
  alias: string;
  place: string;
  lat: number | null;
  lng: number | null;
  format: StoryFormat;
  mediaUrl: string;
  topic: string[];
  status: StoryStatus;
  activeSince: number | null;
  isFeatured: boolean;
  resonances: number;
  createdAt: number | null;
  authorEmail: string | null;
  rightsAccepted: boolean;
};

type Collection = {
  id: string;
  title: string;
  slug: string;
  description: string;
  storyIds: string[];
};

type Stats = {
  pending: number;
  active: number;
  archived: number;
  rejected: number;
  totalResonances: number;
  mostSharedStory: { id: string; title: string; resonances: number } | null;
};

const FORMAT_LABEL: Record<StoryFormat, string> = {
  video: 'Video',
  audio: 'Audio',
  text: 'Texto',
  photos: 'Fotos',
};

function formatDate(ts: number | null): string {
  if (ts == null) return '—';
  return new Date(ts).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function daysRemaining(activeSince: number | null): number | null {
  if (activeSince == null) return null;
  const days = 15;
  const end = activeSince + days * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const left = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
  return Math.max(0, left);
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [section, setSection] = useState<'pendientes' | 'mapa' | 'archivo' | 'colecciones' | 'stats'>('pendientes');
  const [pendingStories, setPendingStories] = useState<Story[]>([]);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [archivedFilter, setArchivedFilter] = useState<{ topic?: string; place?: string; format?: StoryFormat }>({});
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getAuthHeaders = useCallback((): HeadersInit => {
    if (!idToken) return {};
    return { Authorization: `Bearer ${idToken}` };
  }, [idToken]);

  // Auth state
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setIdToken(null);
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }
      const token = await u.getIdToken();
      setIdToken(token);
      if (!isAdminEmail(u.email ?? null)) {
        router.replace('/#mapa');
        return;
      }
      setIsAdmin(true);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!email.trim() || !password) {
      setLoginError('Email y contraseña requeridos.');
      return;
    }
    if (!auth) {
      setLoginError('Firebase no configurado.');
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Error al iniciar sesión';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    if (auth) signOut(auth);
    setUser(null);
    setIdToken(null);
    setIsAdmin(false);
  };

  // Fetch data
  const fetchPending = useCallback(async () => {
    const res = await fetch('/api/admin/stories?status=pending', { headers: getAuthHeaders() });
    if (res.status === 401 || res.status === 403) {
      router.replace('/#mapa');
      return;
    }
    const data = (await res.json()) as { stories?: Story[] };
    setPendingStories(data.stories ?? []);
  }, [getAuthHeaders, router]);

  const fetchActive = useCallback(async () => {
    const res = await fetch('/api/admin/stories?status=active', { headers: getAuthHeaders() });
    if (res.status === 401 || res.status === 403) {
      router.replace('/#mapa');
      return;
    }
    const data = (await res.json()) as { stories?: Story[] };
    setActiveStories(data.stories ?? []);
  }, [getAuthHeaders, router]);

  const fetchArchived = useCallback(async () => {
    const res = await fetch('/api/admin/stories?status=archived', { headers: getAuthHeaders() });
    if (res.status === 401 || res.status === 403) {
      router.replace('/#mapa');
      return;
    }
    const data = (await res.json()) as { stories?: Story[] };
    setArchivedStories(data.stories ?? []);
  }, [getAuthHeaders, router]);

  const fetchCollections = useCallback(async () => {
    const res = await fetch('/api/admin/collections', { headers: getAuthHeaders() });
    if (res.status === 401 || res.status === 403) {
      router.replace('/#mapa');
      return;
    }
    const data = (await res.json()) as { collections?: Collection[] };
    setCollections(data.collections ?? []);
  }, [getAuthHeaders, router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats', { headers: getAuthHeaders() });
    if (res.status === 401 || res.status === 403) {
      router.replace('/#mapa');
      return;
    }
    const data = (await res.json()) as Stats & { error?: string };
    setStats(data);
  }, [getAuthHeaders, router]);

  useEffect(() => {
    if (!isAdmin || !idToken) return;
    setLoading(true);
    (async () => {
      try {
        await Promise.all([fetchPending(), fetchActive(), fetchArchived(), fetchCollections(), fetchStats()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, idToken, fetchPending, fetchActive, fetchArchived, fetchCollections, fetchStats]);

  const patchStory = async (id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/stories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        showToast(action === 'approve' ? '✅ Aprobada al mapa' : action === 'reject' ? '❌ Rechazada' : action === 'feature' ? '⭐ Destacada' : '📦 Archivada');
        await Promise.all([fetchPending(), fetchActive(), fetchArchived(), fetchStats()]);
      } else {
        showToast(data.error ?? 'Error');
      }
    } catch {
      showToast('Error al actualizar');
    } finally {
      setActionLoading(null);
    }
  };

  const createCollection = async () => {
    const title = newCollectionTitle.trim();
    if (!title) return;
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title, description: newCollectionDesc.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        showToast('Colección creada');
        setNewCollectionTitle('');
        setNewCollectionDesc('');
        await fetchCollections();
      } else {
        showToast(data.error ?? 'Error');
      }
    } catch {
      showToast('Error al crear colección');
    }
  };

  const addStoryToCollection = async (collectionId: string, storyId: string) => {
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ storyId }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok) showToast('Agregada a la colección');
      else showToast('Ya está en la colección o error');
    } catch {
      showToast('Error');
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100dvh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: APP_FONT, color: 'rgba(255,255,255,0.7)' }}>
        Cargando…
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div style={{ minHeight: '100dvh', background: BG, fontFamily: APP_FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ ...glassCard, maxWidth: 400, width: '100%' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginBottom: 8 }}>Panel Admin AlmaMundi</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 24 }}>Inicia sesión con tu cuenta del equipo.</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 14,
                marginBottom: 12,
                fontFamily: APP_FONT,
                outline: 'none',
              }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 14,
                marginBottom: 16,
                fontFamily: APP_FONT,
                outline: 'none',
              }}
            />
            {loginError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 999,
                background: '#ff4500',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                fontFamily: APP_FONT,
              }}
            >
              {loginLoading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const sections: { id: typeof section; label: string; icon: React.ReactNode }[] = [
    { id: 'pendientes', label: 'Historias pendientes', icon: <FileText size={18} /> },
    { id: 'mapa', label: 'En el mapa', icon: <MapPin size={18} /> },
    { id: 'archivo', label: 'Archivo', icon: <Archive size={18} /> },
    { id: 'colecciones', label: 'Colecciones', icon: <FolderOpen size={18} /> },
    { id: 'stats', label: 'Estadísticas', icon: <BarChart3 size={18} /> },
  ];

  const filteredArchived = archivedStories.filter((s) => {
    if (archivedFilter.topic && !s.topic?.includes(archivedFilter.topic)) return false;
    if (archivedFilter.place && !s.place?.toLowerCase().includes(archivedFilter.place.toLowerCase())) return false;
    if (archivedFilter.format && s.format !== archivedFilter.format) return false;
    return true;
  });

  const FormatIcon = ({ format }: { format: StoryFormat }) => {
    if (format === 'video') return <Video size={14} />;
    if (format === 'audio') return <Mic size={14} />;
    if (format === 'photos') return <ImageIcon size={14} />;
    return <FileText size={14} />;
  };

  return (
    <div style={{ minHeight: '100dvh', background: BG, fontFamily: APP_FONT, color: 'rgba(255,255,255,0.92)', padding: '24px 16px' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 13,
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast}
        </div>
      )}

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Panel Admin AlmaMundi</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.9)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: APP_FONT,
            }}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.14)',
              background: section === s.id ? 'rgba(255,69,0,0.2)' : 'rgba(255,255,255,0.06)',
              color: section === s.id ? '#ff6b35' : 'rgba(255,255,255,0.85)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: APP_FONT,
            }}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </nav>

      {loading && section !== 'stats' && (
        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 40 }}>Cargando…</p>
      )}

      {/* 1. Historias pendientes */}
      {section === 'pendientes' && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingStories.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40 }}>No hay historias pendientes.</p>
          )}
          {pendingStories.map((s) => (
            <div key={s.id} style={glassCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(255,69,0,0.2)', border: '1px solid rgba(255,69,0,0.4)', color: '#fdba74' }}>
                      <FormatIcon format={s.format} /> {FORMAT_LABEL[s.format] ?? s.format}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.place}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{formatDate(s.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', color: 'rgba(255,255,255,0.95)' }}>{s.title}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>Alias: {s.alias || '—'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    disabled={actionLoading === s.id}
                    onClick={() => patchStory(s.id, 'approve')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: '1px solid rgba(34,197,94,0.5)',
                      background: 'rgba(34,197,94,0.2)',
                      color: '#86efac',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: APP_FONT,
                    }}
                  >
                    <Check size={16} /> Aprobar al mapa
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === s.id}
                    onClick={() => patchStory(s.id, 'reject')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: '1px solid rgba(239,68,68,0.5)',
                      background: 'rgba(239,68,68,0.2)',
                      color: '#fca5a5',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: APP_FONT,
                    }}
                  >
                    <X size={16} /> Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Historias en el mapa */}
      {section === 'mapa' && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeStories.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40 }}>No hay historias activas en el mapa.</p>
          )}
          {activeStories.map((s) => {
            const days = daysRemaining(s.activeSince);
            return (
              <div key={s.id} style={glassCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>
                        <FormatIcon format={s.format} /> {FORMAT_LABEL[s.format] ?? s.format}
                      </span>
                      {s.isFeatured && (
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(255,215,0,0.2)', color: '#fde047' }}>⭐ Destacada</span>
                      )}
                      {days != null && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{days} días restantes</span>
                      )}
                    </div>
                    <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', color: 'rgba(255,255,255,0.95)' }}>{s.title}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{s.place} · {s.alias || '—'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!s.isFeatured && (
                      <button
                        type="button"
                        disabled={actionLoading === s.id}
                        onClick={() => patchStory(s.id, 'feature')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 999,
                          border: '1px solid rgba(255,215,0,0.4)',
                          background: 'rgba(255,215,0,0.15)',
                          color: '#fde047',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          fontFamily: APP_FONT,
                        }}
                      >
                        <Star size={16} /> Destacar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionLoading === s.id}
                      onClick={() => patchStory(s.id, 'archive')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.25)',
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: APP_FONT,
                      }}
                    >
                      <Archive size={16} /> Mover al archivo
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Archivo */}
      {section === 'archivo' && !loading && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Filtrar por tema"
              value={archivedFilter.topic ?? ''}
              onChange={(e) => setArchivedFilter((f) => ({ ...f, topic: e.target.value.trim() || undefined }))}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 14,
                width: 160,
                fontFamily: APP_FONT,
                outline: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Filtrar por lugar"
              value={archivedFilter.place ?? ''}
              onChange={(e) => setArchivedFilter((f) => ({ ...f, place: e.target.value.trim() || undefined }))}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 14,
                width: 160,
                fontFamily: APP_FONT,
                outline: 'none',
              }}
            />
            <select
              value={archivedFilter.format ?? ''}
              onChange={(e) => setArchivedFilter((f) => ({ ...f, format: (e.target.value || undefined) as StoryFormat | undefined }))}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 14,
                fontFamily: APP_FONT,
                outline: 'none',
              }}
            >
              <option value="">Todos los formatos</option>
              {(Object.keys(FORMAT_LABEL) as StoryFormat[]).map((f) => (
                <option key={f} value={f}>{FORMAT_LABEL[f]}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredArchived.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40 }}>No hay historias en el archivo con esos filtros.</p>
            )}
            {filteredArchived.map((s) => (
              <div key={s.id} style={glassCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }}>
                      <FormatIcon format={s.format} /> {FORMAT_LABEL[s.format] ?? s.format}
                    </span>
                    <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', color: 'rgba(255,255,255,0.95)' }}>{s.title}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{s.place} · {s.topic?.join(', ') || '—'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Agregar a colección:</span>
                    <select
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) addStoryToCollection(id, s.id);
                        e.target.value = '';
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 13,
                        fontFamily: APP_FONT,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Elegir…</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Colecciones */}
      {section === 'colecciones' && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={glassCard}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Nueva colección</h2>
            <input
              type="text"
              placeholder="Título"
              value={newCollectionTitle}
              onChange={(e) => setNewCollectionTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 14,
                marginBottom: 10,
                fontFamily: APP_FONT,
                outline: 'none',
              }}
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={newCollectionDesc}
              onChange={(e) => setNewCollectionDesc(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 14,
                marginBottom: 12,
                fontFamily: APP_FONT,
                outline: 'none',
                resize: 'vertical',
              }}
            />
            <button
              type="button"
              onClick={createCollection}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                background: '#ff4500',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: APP_FONT,
              }}
            >
              <Plus size={18} /> Nueva colección
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {collections.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', padding: 24 }}>Aún no hay colecciones.</p>
            )}
            {collections.map((c) => (
              <div key={c.id} style={glassCard}>
                <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', color: 'rgba(255,255,255,0.95)' }}>{c.title}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>/{c.slug}</p>
                {c.description && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>{c.description}</p>}
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>{c.storyIds.length} historias</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Estadísticas */}
      {section === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {stats && (
            <>
              <div style={glassCard}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendientes</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#f59e0b' }}>{stats.pending}</p>
              </div>
              <div style={glassCard}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>En el mapa</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#22c55e' }}>{stats.active}</p>
              </div>
              <div style={glassCard}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Archivadas</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'rgba(255,255,255,0.8)' }}>{stats.archived}</p>
              </div>
              <div style={glassCard}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resonancias (total)</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#a78bfa' }}>{stats.totalResonances}</p>
              </div>
              {stats.mostSharedStory && (
                <div style={{ ...glassCard, gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historia más compartida</p>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px', color: 'rgba(255,255,255,0.95)' }}>{stats.mostSharedStory.title}</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{stats.mostSharedStory.resonances} resonancias</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
