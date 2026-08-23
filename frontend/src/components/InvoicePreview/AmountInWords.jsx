import { numberToWords } from '../../utils/numberToWords';

export function AmountInWords({ amount }) {
  return (
    <div className="invoice-amount-words">
      <span className="invoice-amount-words-label">Amount in Words:</span>
      <span className="invoice-amount-words-value">{numberToWords(amount)}</span>
    </div>
  );
}