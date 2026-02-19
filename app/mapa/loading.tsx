export default function MapaLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0F172A] text-white">
      <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white/90">Cargando mapa…</p>
    </div>
  );
}
