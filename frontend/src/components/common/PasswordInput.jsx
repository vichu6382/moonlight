import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordInput({ value, onChange, placeholder = 'Enter password', disabled, className = '', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        className={`input ${className}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
