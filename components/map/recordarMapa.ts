/**
 * Antes de ir del mapa a una página interna, deja en la dirección actual el estado del mapa
 * (capa y pregunta abierta). Así «Atrás» devuelve al mismo lugar del globo (Ana, 5 nov 2026).
 */
export function recordarMapa(direccion: string): void {
  try {
    window.history.replaceState(window.history.state, '', direccion);
  } catch {
    /* sin historial disponible: se navega igual */
  }
}
