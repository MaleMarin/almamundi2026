'use client';

type AdultConsentCheckboxProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

/**
 * Casilla de consentimiento en la pantalla de datos.
 * El texto llega por i18n desde el padre.
 */
export function AdultConsentCheckbox({
  id = 'privacy',
  checked,
  onChange,
  label }: AdultConsentCheckboxProps) {
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
      />
      <label htmlFor={id} className="text-[11px] font-semibold leading-snug text-gray-700 md:text-xs">
        {label}
      </label>
    </div>
  );
}
