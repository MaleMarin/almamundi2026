/**
 * Capa única de contenido para Política Digital V2.
 * Todo el sitio se organiza por estos metadatos (tipado y filtrable).
 */

export type ContentKind =
  | 'experiencia'
  | 'analisis'
  | 'norma'
  | 'programa'
  | 'senial'
  | 'licitacion';

export type ContentItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  kind: ContentKind;
  stateCodes?: string[];
  topics?: string[];
  publishedAt: string;
  updatedAt?: string;
  featured?: boolean;
  hero?: boolean;
  legacySource?: 'politica-digital-old';
  image?: {
    src?: string;
    alt?: string;
    mode?: 'placeholder' | 'photo' | 'hybrid' | 'abstract';
  };
  source?: {
    name?: string;
    url?: string;
  };
  metadata?: {
    priority?: number;
    recency?: 'none' | 'old' | 'medium' | 'recent';
    impact?: 'low' | 'medium' | 'high';
    region?: string;
    institution?: string;
  };
};

export type StateProfile = {
  code: string;
  name: string;
  slug: string;
  summary?: string;
  heroTone?: 'quiet' | 'active' | 'recent';
  topics?: string[];
  dominantKinds?: ContentKind[];
};
