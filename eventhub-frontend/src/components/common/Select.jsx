import { useId } from 'react';
export default function Select({ label, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} {...props}>
        {children}
      </select>
    </div>
  );
}
