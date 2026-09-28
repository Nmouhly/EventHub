import { useId } from 'react';
export default function Input({ label, error, id, ...props }) {
  const generated = useId();
  const fieldId = id || generated;
  return (
    <div className="field">
      {label && <label htmlFor={fieldId}>{label}</label>}
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error && (
        <small className="field-error" id={`${fieldId}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}
