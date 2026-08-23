import { Wallet } from 'lucide-react';
import { FormSection, Field, NumberInput } from './fields';
import { formatINR } from '../../utils/format';

export function PaymentForm({ form, setField, totals, errors }) {
  const isFull = form.paymentMethod === 'full';

  return (
    <FormSection
      icon={<Wallet size={18} />}
      title="Payment"
      subtitle="Received amount & balance"
      badge={totals.balance > 0 ? `Balance ${formatINR(totals.balance)}` : 'Settled'}
    >
      <div className="field" style={{ paddingTop: 30 }}>
        <label className="field-label">Payment Method</label>
        <div className="chip-row">
          <button
            type="button"
            className={`chip${isFull ? ' active' : ''}`}
            onClick={() => {
              setField('paymentMethod', 'full');
              setField('receivedAmount', totals.grandTotal);
            }}
          >
            Full Payment
          </button>
          <button
            type="button"
            className={`chip${!isFull ? ' active' : ''}`}
            onClick={() => setField('paymentMethod', 'advance')}
          >
            Advance Payment
          </button>
        </div>
      </div>

      {!isFull && (
        <div className="field-grid" style={{ marginTop: 12 }}>
          <Field
            label="Advance Amount"
            error={errors.receivedAmount}
            hint={form.receivedAmount !== '' ? `Balance due: ${formatINR(totals.balance)}` : undefined}
          >
            <NumberInput
              min="0"
              max={totals.grandTotal}
              step="1"
              value={form.receivedAmount}
              onChange={(val) => setField('receivedAmount', val)}
            />
          </Field>
        </div>
      )}

      {isFull && (
        <div className="advance-full-info">
          Full amount of <strong>{formatINR(totals.grandTotal)}</strong> will be recorded as received.
        </div>
      )}
    </FormSection>
  );
}
