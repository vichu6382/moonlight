import { PenLine } from 'lucide-react';
import { FormSection, Field, TextInput } from './fields';

export function SignatureForm({ form, setField }) {
  return (
    <FormSection
      icon={<PenLine size={18} />}
      title="Signature"
      subtitle="Authorized signatory on invoice"
    >
      <div className="toggle-row">
        <label className="toggle-label">
          <span className="toggle-switch">
            <input
              type="checkbox"
              checked={form.showSignatory}
              onChange={(e) => setField('showSignatory', e.target.checked)}
            />
            <span className="toggle-switch-slider"></span>
          </span>
          <span>Show Authorized Signatory</span>
        </label>
      </div>
      {form.showSignatory && (
        <div className="field-grid" style={{ marginTop: 12 }}>
          <Field label="Authorized Signatory">
            <TextInput
              value={form.signatoryName}
              onChange={(e) => setField('signatoryName', e.target.value)}
            />
          </Field>
        </div>
      )}
    </FormSection>
  );
}
