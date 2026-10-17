import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function InputField({ label, required, error, hint, className = '', ...props }: InputFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <input className={`input ${error ? 'input-error' : ''}`} {...props} />
      {error ? (
        <p className="mt-1 text-xs text-error-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-neutral-400">{hint}</p>
      ) : null}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function SelectField({ label, required, error, children, className = '', ...props }: SelectFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <select className={`input ${error ? 'input-error' : ''}`} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
}

interface TextAreaFieldProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
}

export function TextAreaField({ label, required, error, className = '', ...props }: TextAreaFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <textarea className={`input ${error ? 'input-error' : ''} resize-none`} rows={3} {...props} />
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
}
