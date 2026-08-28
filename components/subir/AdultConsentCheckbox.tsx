'use client';

type AdultConsentCheckboxProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  privacyHref?: string;
};

/**
 * Casilla 18+ + privacidad en la pantalla de datos.
 * Un solo componente para home y /subir (ambos usan StoryModal).
 */
export function AdultConsentCheckbox({
  id = 'privacy',
  checked,
  onChange,
  privacyHref = '/privacidad',
}: AdultConsentCheckboxProps) {
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
      />
      <label htmlFor={id} className="text-[11px] font-semibold leading-snug text-gray-600 md:text-xs">
        Declaro que soy mayor de 18 años, o que actúo como adulto responsable o representante de una institución y
        cuento con la autorización expresa de quien aparece en esta historia. Leí y acepto la{' '}
        <a className="text-orange-600 underline" href={privacyHref} target="_blank" rel="noreferrer">
          política de privacidad
        </a>
        .
      </label>
    </div>
  );
}
