import { BadgePercent } from 'lucide-react';
import { FormSection, Field, NumberInput } from './fields';
import { GST_TAX_RATES } from '../../data/packageConfig';
import { formatINR } from '../../utils/format';

export function DiscountGstForm({ form, setField, totals, errors }) {
  return (
    <FormSection
      icon={<BadgePercent size={18} />}
      title="Discount & GST"
      subtitle="Auto calculated"
      badge={`${totals.gstPercent}% GST`}
    >
      <div className="field-grid">
        <Field label="Discount Mode">
          <div className="segmented">
            <button
              type="button"
              className={form.discountMode === 'percent' ? 'active' : ''}
              onClick={() => setField('discountMode', 'percent')}
            >
              Percentage
            </button>
            <button
              type="button"
              className={form.discountMode === 'amount' ? 'active' : ''}
              onClick={() => setField('discountMode', 'amount')}
            >
              Fixed Amount
            </button>
          </div>
        </Field>
        <Field
          label={form.discountMode === 'percent' ? 'Discount %' : 'Discount Amount'}
          error={errors.discountValue}
          hint={form.discountValue ? `Discount value: ${formatINR(totals.discountAmount)}` : undefined}
        >
          <NumberInput
            min="0"
            value={form.discountValue}
            onChange={(val) => setField('discountValue', val)}
          />
        </Field>
        <Field
          label="GST %"
          required
          error={errors.gstPercent}
          hint={totals.gstPercent ? `GST amount: ${formatINR(totals.gstAmount)}` : undefined}
        >
          <NumberInput
            min="0"
            max="100"
            step="0.25"
            value={form.gstPercent}
            onChange={(val) => setField('gstPercent', val)}
          />
          <div className="chip-row">
            {GST_TAX_RATES.map((r) => (
              <button
                key={r}
                type="button"
                className={`chip${Number(form.gstPercent) === r ? ' active' : ''}`}
                onClick={() => setField('gstPercent', r)}
              >
                {r}%
              </button>
            ))}
          </div>
        </Field>
      </div>
    </FormSection>
  );
}
