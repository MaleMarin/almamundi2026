'use client';

/**
 * Footer unificado para páginas internas: misma estética que la home (E0E5EC, Avenir, ALMAMUNDI).
 */
import Link from 'next/link';

const APP_FONT = `'Avenir Light', Avenir, sans-serif`;

export function Footer() {
  return (
    <footer
      className="w-full pb-24 pt-20 md:pt-28 px-6 flex flex-col items-center relative z-20 bg-[#E0E5EC]"
      style={{ fontFamily: APP_FONT }}
    >
      <div className="mb-14 mt-6 w-full flex justify-center select-none">
        <h1 className="text-6xl md:text-[120px] lg:text-[180px] text-center leading-none almamundi-footer-title">
          ALMAMUNDI
        </h1>
      </div>

      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center md:items-end text-base font-medium pt-10 pb-4 text-gray-600 gap-10">
        <div className="flex flex-col items-center md:items-start">
          <span className="block mb-3 opacity-70">Una iniciativa de</span>
          <img src="/logo-precisar.png" alt="Precisar" className="h-14 w-auto object-contain" />
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-10 opacity-90">
          <Link href="/#intro" className="hover:text-gray-900 transition-colors font-bold">
            Nuestro propósito
          </Link>
          <Link href="/#como-funciona" className="hover:text-gray-900 transition-colors font-bold">
            ¿Cómo funciona?
          </Link>
          <Link href="/#historias" className="hover:text-gray-900 transition-colors font-bold">
            Historias
          </Link>
          <Link href="/historias" className="hover:text-gray-900 transition-colors font-bold">
            Archivo
          </Link>
          <Link href="/#mapa" className="hover:text-gray-900 transition-colors font-bold">
            Mapa
          </Link>
        </div>
      </div>
    </footer>
  );
}
