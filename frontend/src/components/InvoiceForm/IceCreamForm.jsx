import { IceCreamCone } from 'lucide-react';
import { FormSection } from './fields';
import { ItemRowsEditor } from './itemEditor';
import { ICE_CREAM_TYPES } from '../../data/packageConfig';

export function IceCreamForm({ form, setField, errors }) {
  return (
    <FormSection
      icon={<IceCreamCone size={18} />}
      title="Ice Cream"
      subtitle="Optional ice cream billing"
      badge={form.iceCreamEnabled ? 'Enabled' : undefined}
      defaultOpen={form.iceCreamEnabled}
    >
      <div className="toggle-row">
        <label className="toggle-label">
          <span className="toggle-switch">
            <input
              type="checkbox"
              checked={form.iceCreamEnabled}
              onChange={(e) => setField('iceCreamEnabled', e.target.checked)}
            />
            <span className="toggle-switch-slider"></span>
          </span>
          <span>{form.iceCreamEnabled ? 'Ice cream enabled' : 'Enable ice cream billing'}</span>
        </label>
      </div>
      {form.iceCreamEnabled && (
        <ItemRowsEditor
          items={form.iceCreamItems}
          onChange={(items) => setField('iceCreamItems', items)}
          nameOptions={ICE_CREAM_TYPES}
          addLabel="Add Ice Cream"
          firstLabel="Ice Cream Type"
          errors={errors.iceCreamItems || {}}
        />
      )}
    </FormSection>
  );
}
