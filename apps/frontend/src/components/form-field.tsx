import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  const inputId = id ?? inputProps.name;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
          error ? 'border-brand-red' : 'border-gray-300'
        }`}
        {...inputProps}
      />
      {error ? <p className="mt-1 text-xs text-brand-red-dark">{error}</p> : null}
    </div>
  );
}
