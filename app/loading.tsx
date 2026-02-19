export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0F172A] text-white">
      <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-lg font-medium text-white/90">Cargando AlmaMundi…</p>
      <a href="/mapa" className="text-orange-400 hover:text-orange-300 underline text-sm">
        Ir al mapa
      </a>
    </div>
  );
}
