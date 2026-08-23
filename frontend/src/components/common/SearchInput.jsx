import { useState, useRef } from 'react';
import { Search } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search...', debounce = 300 }) {
  const [local, setLocal] = useState(value || '');
  const timer = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocal(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(val), debounce);
  };

  return (
    <div className="search-input-wrapper">
      <Search size={16} className="search-input-icon" />
      <input
        type="text"
        className="input search-input"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
}
