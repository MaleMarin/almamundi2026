import type { AlmaLocale } from '@/lib/i18n/locale';

export type CasoTexto = {
  id: string;
  titulo: string;
  texto: string;
  ciudad: string;
  pais: string;
  locale: AlmaLocale;
  grupo: 'inventada' | 'previo';
};

export const FECHA_PIE = new Date(2026, 9, 22, 12, 0, 0);
