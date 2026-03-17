/** Pantalla de carga al recargar/navegar: mismo fondo que la home para evitar destello de "página antigua". */
export default function Loading() {
  return (
    <div
      className="fixed inset-0 min-h-screen flex flex-col items-center justify-center gap-4 z-[9999]"
      style={{ background: 'var(--home-bg, #E0E5EC)' }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-8 h-8 border-2 border-[var(--almamundi-orange,#ff4500)] border-t-transparent rounded-full animate-spin opacity-70" />
      <p className="text-sm font-medium text-gray-600">Cargando…</p>
    </div>
  );
}
