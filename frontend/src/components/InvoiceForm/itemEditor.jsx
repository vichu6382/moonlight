import { Plus, Trash2 } from 'lucide-react';
import { NumberInput } from './fields';
import { lineAmount } from '../../utils/calculations';
import { formatINR } from '../../utils/format';

export function ItemRowsEditor({
  items,
  onChange,
  nameOptions = null,
  namePlaceholder = 'Item name',
  addLabel = 'Add Item',
  firstLabel = 'Item',
  errors = {}
}) {
  const updateItem = (index, patch) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', qty: 1, rate: 0 }]);
  };

  return (
    <div className="item-editor">
      <div className="item-editor-head item-editor-grid">
        <span>{firstLabel}</span>
        <span>Qty</span>
        <span>Rate</span>
        <span>Amount</span>
        <span></span>
      </div>
      {items.length === 0 && <div className="item-editor-empty">No items added yet.</div>}
      {items.map((item, index) => (
        <div key={item.id} className={`item-editor-row item-editor-grid${errors[item.id] ? ' has-error' : ''}`}>
          <div className="item-editor-name">
            {nameOptions ? (
              <>
                <select
                  className="input"
                  value={nameOptions.includes(item.name) ? item.name : 'Other'}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateItem(index, { name: v === 'Other' ? '' : v });
                  }}
                >
                  <option value="">Select type…</option>
                  {nameOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {item.name && !nameOptions.includes(item.name) && (
                  <input
                    className="input input-custom-name"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    placeholder="Enter custom name"
                  />
                )}
              </>
            ) : (
              <input
                className="input"
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                placeholder={namePlaceholder}
              />
            )}
            {errors[item.id] && <span className="field-error-text">{errors[item.id]}</span>}
          </div>
          <NumberInput
            min="1"
            value={item.qty}
            onChange={(val) => updateItem(index, { qty: val })}
          />
          <NumberInput
            min="0"
            step="0.01"
            value={item.rate}
            onChange={(val) => updateItem(index, { rate: val })}
          />
          <div className="item-editor-amount">{formatINR(lineAmount(item))}</div>
          <button type="button" className="icon-btn danger" onClick={() => removeItem(index)} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
}