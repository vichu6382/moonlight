import { UtensilsCrossed } from 'lucide-react';
import { FormSection } from './fields';
import { ItemRowsEditor } from './itemEditor';

export function ExtraFoodForm({ form, setField, errors }) {
  return (
    <FormSection
      icon={<UtensilsCrossed size={18} />}
      title="Extra Food"
      subtitle="Optional extra food items"
      badge={form.extraFood.length ? `${form.extraFood.length} item(s)` : undefined}
      defaultOpen={form.extraFood.length > 0}
    >
      <ItemRowsEditor
        items={form.extraFood}
        onChange={(items) => setField('extraFood', items)}
        namePlaceholder="e.g. Chicken Biriyani"
        firstLabel="Food Item"
        errors={errors.extraFood || {}}
      />
    </FormSection>
  );
}