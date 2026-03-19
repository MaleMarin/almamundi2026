/**
 * Esquema completo de una historia en AlmaMundi.
 * Este es el contrato de datos entre Firestore, la UI y las APIs.
 *
 * COLECCIÓN FIRESTORE: "stories"
 * (cambia FIRESTORE_COLLECTION si tu colección se llama diferente)
 */

export const FIRESTORE_COLLECTION = 'stories'

// ─── Formato ─────────────────────────────────────────────────────────────────
export type Formato = 'video' | 'audio' | 'texto' | 'foto'

/** Detecta el formato de una historia según sus campos */
export function detectarFormato(data: Partial<StoryData>): Formato {
  if (data.videoUrl) return 'video'
  if (data.audioUrl) return 'audio'
  if (data.imageUrl || (data.images && data.images.length > 0)) return 'foto'
  return 'texto'
}

// ─── Ubicación ───────────────────────────────────────────────────────────────
export type Ubicacion = {
  ciudad?: string
  pais?: string
  lat?: number
  lng?: number
  label?: string // texto libre si no hay lat/lng
}

// ─── Autor ───────────────────────────────────────────────────────────────────
export type Autor = {
  id?: string
  nombre: string
  avatar?: string
  bio?: string
  ubicacion?: string
}

// ─── Estado de curación ──────────────────────────────────────────────────────
export type EstadoCuracion =
  | 'pending' // recién subida, esperando revisión
  | 'reviewing' // admin la está viendo
  | 'published' // aprobada y visible
  | 'rejected' // rechazada
  | 'archived' // publicada pero archivada

// ─── Historia completa ───────────────────────────────────────────────────────
export type StoryData = {
  // Identidad
  id: string
  titulo: string
  subtitulo?: string
  descripcion?: string
  quote?: string // cita destacada para el player

  // Contenido según formato
  videoUrl?: string
  audioUrl?: string
  imageUrl?: string // imagen principal / thumbnail
  images?: string[] // galería de fotos
  texto?: string // contenido escrito
  duracion?: number // segundos (video o audio)

  // Metadatos de clasificación ← EL CORAZÓN DE ESTE SISTEMA
  formato: Formato
  temas: string[] // slugs de TEMAS, ej: ['amor', 'perdida']
  tags?: string[] // tags libres adicionales
  ubicacion?: Ubicacion

  // Autor
  autor: Autor

  // Curación
  status: EstadoCuracion
  curadorId?: string // uid del admin que aprobó
  curadorNota?: string // nota interna del curador
  publishedAt?: string // ISO cuando se publicó
  createdAt: string // ISO cuando se subió
  updatedAt: string // ISO última modificación

  // Contadores (se actualizan aparte)
  views?: number
  resonances?: number
  readers?: number
}

// ─── Lo que viene del formulario de subida ───────────────────────────────────
/** Campos que llegan cuando el usuario sube una historia */
export type StorySubmission = Pick<
  StoryData,
  | 'titulo'
  | 'subtitulo'
  | 'descripcion'
  | 'videoUrl'
  | 'audioUrl'
  | 'imageUrl'
  | 'images'
  | 'texto'
  | 'duracion'
  | 'tags'
  | 'ubicacion'
  | 'autor'
> & { quote?: string }

/** Construye un documento inicial para guardar en Firestore al subir */
export function buildStoryPendiente(submission: StorySubmission, id: string): StoryData {
  const now = new Date().toISOString()
  return {
    ...submission,
    id,
    formato: detectarFormato(submission), // ← auto-detectado al subir
    temas: [], // ← se asignan en curación
    status: 'pending',
    autor: submission.autor,
    createdAt: now,
    updatedAt: now,
    views: 0,
    resonances: 0,
    readers: 0,
  }
}

/** Construye el diff que se aplica al publicar (en curación) */
export type PublishPayload = {
  temas: string[] // slugs confirmados por el admin
  curadorId: string
  curadorNota?: string
  ubicacion?: Ubicacion // puede completarse en curación
  quote?: string
}

export function buildPublishUpdate(payload: PublishPayload): Partial<StoryData> {
  return {
    status: 'published',
    temas: payload.temas,
    curadorId: payload.curadorId,
    curadorNota: payload.curadorNota,
    ubicacion: payload.ubicacion,
    quote: payload.quote,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
