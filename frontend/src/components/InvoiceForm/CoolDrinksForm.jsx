import { CupSoda } from 'lucide-react';
import { FormSection } from './fields';
import { ItemRowsEditor } from './itemEditor';
import { COOL_DRINK_TYPES } from '../../data/packageConfig';

export function CoolDrinksForm({ form, setField, errors }) {
  return (
    <FormSection
      icon={<CupSoda size={18} />}
      title="Cool Drinks"
      subtitle="Optional cool drink billing"
      badge={form.coolDrinksEnabled ? 'Enabled' : undefined}
      defaultOpen={form.coolDrinksEnabled}
    >
      <div className="toggle-row">
        <label className="toggle-label">
          <span className="toggle-switch">
            <input
              type="checkbox"
              checked={form.coolDrinksEnabled}
              onChange={(e) => setField('coolDrinksEnabled', e.target.checked)}
            />
            <span className="toggle-switch-slider"></span>
          </span>
          <span>{form.coolDrinksEnabled ? 'Cool drinks enabled' : 'Enable cool drinks billing'}</span>
        </label>
      </div>
      {form.coolDrinksEnabled && (
        <ItemRowsEditor
          items={form.coolDrinkItems}
          onChange={(items) => setField('coolDrinkItems', items)}
          nameOptions={COOL_DRINK_TYPES}
          addLabel="Add Cool Drink"
          firstLabel="Cool Drink Type"
          errors={errors.coolDrinkItems || {}}
        />
      )}
    </FormSection>
  );
}
