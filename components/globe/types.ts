/**
 * Tipos para el sistema de Globo 3D con cámaras en vivo.
 */

export type LiveCameraType = "youtube" | "hls" | "iframe" | "link";
export type LiveCameraCategory = "city" | "nature" | "space";

export type LiveCamera = {
  id: string;
  title: string;
  source: string;
  type: LiveCameraType;
  url: string;
  lat: number;
  lng: number;
  category: LiveCameraCategory;
  country: string;
};
