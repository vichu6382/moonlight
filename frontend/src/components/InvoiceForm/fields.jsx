import { useState } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export function FormSection({ icon, title, subtitle, badge, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`form-section${open ? ' is-open' : ''}`}>
      <button type="button" className="form-section-header" onClick={() => setOpen((o) => !o)}>
        <span className="form-section-icon">{icon}</span>
        <span className="form-section-titles">
          <span className="form-section-title">{title}</span>
          {subtitle && <span className="form-section-subtitle">{subtitle}</span>}
        </span>
        {badge && <span className="form-section-badge">{badge}</span>}
        <ChevronDown size={18} className="form-section-chevron" />
      </button>
      {open && <div className="form-section-body">{children}</div>}
    </div>
  );
}

export function Field({ label, required, error, hint, children }) {
  return (
    <div className={`field${error ? ' field-error' : ''}`}>
      <label className="field-label">
        {label}
        {required && <span className="field-required"> *</span>}
      </label>
      {children}
      {error && (
        <span className="field-error-text">
          <AlertCircle size={12} /> {error}
        </span>
      )}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export function TextInput(props) {
  return <input type="text" className="input" {...props} />;
}

export function NumberInput({ min, max, step, value, onChange, onBlur, ...props }) {
  const minNum = min !== undefined ? Number(min) : undefined;
  const maxNum = max !== undefined ? Number(max) : undefined;

  const fix = (raw) => {
    if (raw === '' || raw === '-' || raw === null || raw === undefined) {
      return minNum !== undefined ? String(minNum) : '0';
    }
    let n = Number(raw);
    if (!Number.isFinite(n)) return minNum !== undefined ? String(minNum) : '0';
    if (n < 0) return minNum !== undefined ? String(Math.max(minNum, 0)) : '0';
    if (maxNum !== undefined && n > maxNum) return String(maxNum);
    return raw;
  };

  return (
    <input
      type="number"
      className="input"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onChange(fix(e.target.value))}
      onKeyDown={(e) => {
        if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
      }}
      {...props}
    />
  );
}

export function Select(props) {
  return <select className="input" {...props} />;
}