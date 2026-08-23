import { User } from 'lucide-react';
import { FormSection, Field, TextInput } from './fields';

export function CustomerForm({ form, setField, errors }) {
  return (
    <FormSection
      icon={<User size={18} />}
      title="Customer Details"
      subtitle="Bill to information"
      badge={form.customerName ? form.customerName : 'Required'}
    >
      <div className="field-grid">
        <Field label="Customer Name" required error={errors.customerName}>
          <TextInput
            value={form.customerName}
            onChange={(e) => setField('customerName', e.target.value)}
            placeholder="e.g. E3 INNOVATIONS"
          />
        </Field>
        <Field
          label="Guest GST Number"
          hint="Optional. Select 'No GST' when the guest is unregistered."
        >
          <div className="input-row">
            <label className="check-label">
              <span className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={form.hasGuestGstin}
                  onChange={(e) => setField('hasGuestGstin', e.target.checked)}
                />
                <span className="custom-checkbox-mark"></span>
              </span>
              <span>Has GST Number</span>
            </label>
            <TextInput
              value={form.guestGstin}
              onChange={(e) => setField('guestGstin', e.target.value.toUpperCase())}
              placeholder="e.g. 33AACCP1234Q1Z8"
              disabled={!form.hasGuestGstin}
            />
          </div>
          {!form.hasGuestGstin && <div className="unregistered-note">No GST / Unregistered</div>}
        </Field>
        <Field label="Contact Number" hint="Optional">
          <TextInput
            value={form.customerContact || ''}
            onChange={(e) => setField('customerContact', e.target.value)}
            placeholder="e.g. 98765 43210"
          />
        </Field>
        <Field label="Address" hint="Optional">
          <TextInput
            value={form.customerAddress || ''}
            onChange={(e) => setField('customerAddress', e.target.value)}
            placeholder="Street, City"
          />
        </Field>
        <Field label="State" hint="Optional">
          <TextInput
            value={form.customerState || ''}
            onChange={(e) => setField('customerState', e.target.value)}
            placeholder="e.g. Tamil Nadu"
          />
        </Field>
      </div>
    </FormSection>
  );
}
