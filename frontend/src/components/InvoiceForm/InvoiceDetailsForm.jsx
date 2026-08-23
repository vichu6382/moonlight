import { FileText } from 'lucide-react';
import { FormSection, Field, TextInput, NumberInput } from './fields';

export function InvoiceDetailsForm({ form, setField, errors }) {
  return (
    <FormSection icon={<FileText size={18} />} title="Invoice Details" subtitle="Number, date and head count" badge={form.invoiceNumber}>
      <div className="field-grid">
        <Field label="Invoice Number" hint="Auto-incremented, editable">
          <TextInput value={form.invoiceNumber} onChange={(e) => setField('invoiceNumber', e.target.value)} />
        </Field>
        <Field label="Date" required error={errors.date}>
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => setField('date', e.target.value)}
          />
        </Field>
        <Field label="Head Count (Adults)" required error={errors.membersCount}>
          <NumberInput
            min="1"
            value={form.membersCount}
            onChange={(val) => setField('membersCount', val)}
          />
        </Field>
        <Field label="Child Count" hint="Children billed at 50% of package rate" error={errors.childCount}>
          <NumberInput
            min="0"
            value={form.childCount}
            onChange={(val) => setField('childCount', val)}
          />
        </Field>
        <Field label="Free Count" hint="Complimentary guests, not billed" error={errors.freeCount}>
          <NumberInput
            min="0"
            value={form.freeCount}
            onChange={(val) => setField('freeCount', val)}
          />
        </Field>
      </div>
    </FormSection>
  );
}