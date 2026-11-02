import type { AlmaLocale } from '@/lib/i18n/locale';

const FUERA_DE_LISTA = new Set(['EU', 'EZ', 'UN', 'XA', 'XB', 'XC', 'ZZ', 'QO']);

function codigos(): string[] {
  const nombres = new Intl.DisplayNames(['en'], { type: 'region' });
  const lista: string[] = [];
  for (let i = 65; i <= 90; i += 1) {
    for (let j = 65; j <= 90; j += 1) {
      const codigo = String.fromCharCode(i) + String.fromCharCode(j);
      if (FUERA_DE_LISTA.has(codigo)) continue;
      const nombre = nombres.of(codigo);
      if (nombre && nombre !== codigo) lista.push(codigo);
    }
  }
  return lista;
}

export function paisesEnEspanol(): [string, ...string[]] {
  const nombres = new Intl.DisplayNames(['es'], { type: 'region' });
  const lista = codigos()
    .map((codigo) => nombres.of(codigo) ?? '')
    .filter((nombre) => nombre.length > 2)
    .filter((nombre, indice, todos) => todos.indexOf(nombre) === indice)
    .sort((a, b) => a.localeCompare(b, 'es'));
  return [...lista, 'Otro'];
}

export function opcionesDePais(locale: AlmaLocale): { value: string; label: string }[] {
  const es = new Intl.DisplayNames(['es'], { type: 'region' });
  const local = new Intl.DisplayNames([locale === 'pt' ? 'pt' : locale], { type: 'region' });
  const vistos = new Set<string>();
  const filas = codigos()
    .map((codigo) => ({ value: es.of(codigo) ?? '', label: local.of(codigo) ?? '' }))
    .filter((fila) => fila.value.length > 2 && fila.label.length > 2)
    .filter((fila) => {
      if (vistos.has(fila.value)) return false;
      vistos.add(fila.value);
      return true;
    })
    .sort((a, b) => a.label.localeCompare(b.label, locale === 'pt' ? 'pt' : locale));
  const otro = locale === 'pt' ? 'Outro' : locale === 'en' ? 'Other' : 'Otro';
  return [...filas, { value: 'Otro', label: otro }];
}
