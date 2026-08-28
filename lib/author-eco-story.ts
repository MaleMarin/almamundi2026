import 'server-only';
import { getAdminDb } from '@/lib/firebase/admin';
import { AUTHOR_ECO_TOKEN_FIELD, authorEcoTokensMatch } from '@/lib/author-eco-token';
import { parseEcoVadState, type EcoVadState } from '@/lib/huella/eco-vad';

export type AuthorEcoPageData = {
  title: string;
  narrativeText: string;
  submissionId: string;
  format: 'video' | 'audio' | 'texto' | 'foto';
  city: string;
  country: string;
  footerAtIso: string;
  resonanceCount: number;
  ecoVad: EcoVadState | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickText(...cands: unknown[]): string {
  for (const c of cands) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
}

function toSubirFormat(raw: unknown): AuthorEcoPageData['format'] {
  const s = String(raw ?? '').toLowerCase();
  if (s === 'video') return 'video';
  if (s === 'audio') return 'audio';
  if (s === 'image' || s === 'foto' || s === 'photo') return 'foto';
  return 'texto';
}

function dateFromFirestore(v: unknown): Date {
  if (v && typeof v === 'object' && typeof (v as { toDate?: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate();
  }
  if (v && typeof v === 'object' && typeof (v as { seconds?: number }).seconds === 'number') {
    return new Date((v as { seconds: number }).seconds * 1000);
  }
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Carga la página privada del autor. Si el token no coincide o falta, devuelve null (la ruta responde 404).
 * No incluye el texto de los mensajes de resonancia.
 */
export async function loadAuthorEcoPage(
  storyId: string,
  token: string | undefined
): Promise<AuthorEcoPageData | null> {
  const id = storyId.trim();
  const provided = typeof token === 'string' ? token.trim() : '';
  if (!id || !provided) return null;

  let db;
  try {
    db = getAdminDb();
  } catch {
    return null;
  }

  const ref = db.collection('stories').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = (snap.data() ?? {}) as Record<string, unknown>;
  const stored = typeof data[AUTHOR_ECO_TOKEN_FIELD] === 'string' ? data[AUTHOR_ECO_TOKEN_FIELD].trim() : '';
  if (!authorEcoTokensMatch(stored, provided)) return null;

  const ubic = asRecord(data.ubicacion);
  const title = pickText(data.title, data.titulo, 'Tu historia');
  const narrativeText = pickText(
    data.text,
    data.transcription,
    data.context,
    data.quote,
    data.body,
    data.excerpt,
    title
  );
  const submissionId = pickText(data.sourceSubmissionId, id);
  const city = pickText(data.city, data.ciudad, ubic?.ciudad, ubic?.nombre);
  const country = pickText(data.country, data.pais, data.countryLabel, ubic?.pais);
  const footerAt = dateFromFirestore(data.createdAt ?? data.publishedAt);

  let resonanceCount = 0;
  try {
    const agg = await ref.collection('affective_messages').count().get();
    resonanceCount = agg.data().count;
  } catch {
    const all = await ref.collection('affective_messages').get();
    resonanceCount = all.size;
  }

  return {
    title,
    narrativeText,
    submissionId,
    format: toSubirFormat(data.format ?? data.formato),
    city,
    country,
    footerAtIso: footerAt.toISOString(),
    resonanceCount,
    ecoVad: parseEcoVadState(data.ecoVad),
  };
}
