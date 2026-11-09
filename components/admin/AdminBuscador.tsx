'use client';

/** Quita tildes y mayúsculas para buscar «joaquin» y encontrar «Joaquín». */
function plano(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** ¿Todas las palabras buscadas aparecen en alguno de los campos? */
export function coincideBusqueda(busqueda: string, campos: (string | null | undefined)[]): boolean {
  const palabras = plano(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const todo = plano(campos.filter(Boolean).join(' '));
  return palabras.every((p) => todo.includes(p));
}

export function AdminBuscador({
  value,
  onChange,
  placeholder,
  total,
  encontrados,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  total: number;
  encontrados: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '0 0 16px' }}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
          flex: '1 1 260px',
          maxWidth: 480,
          padding: '10px 14px',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.92)',
          fontSize: 15,
          fontFamily: 'inherit',
        }}
      />
      {value.trim() ? (
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
          {encontrados} de {total}
        </span>
      ) : null}
    </div>
  );
}
