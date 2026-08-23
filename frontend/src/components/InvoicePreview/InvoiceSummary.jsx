import { formatINR2 } from '../../utils/format';

export function InvoiceSummary({ invoiceData }) {
  const t = invoiceData.totals;
  const halfGst = (t.gstPercent / 2).toFixed(2);
  const methodLabel = invoiceData.paymentMethod === 'full' ? 'Full Payment' : 'Advance Payment';
  const rows = [
    { label: 'Subtotal (Package + Food + Ice Cream + Cool Drinks)', value: formatINR2(t.grossSubtotal), bold: false, fill: false },
    {
      label: `Discount${invoiceData.discountMode === 'percent' ? ` (${invoiceData.discountValue}%)` : ' (Fixed)'}`,
      value: formatINR2(t.discountAmount),
      bold: false,
      fill: false
    },
    { label: 'Taxable Amount', value: formatINR2(t.taxableAmount), bold: true, fill: false },
    { label: `CGST @ ${halfGst}%`, value: formatINR2(t.cgst), bold: false, fill: false },
    { label: `SGST @ ${halfGst}%`, value: formatINR2(t.sgst), bold: false, fill: false },
    { label: 'Total GST', value: formatINR2(t.gstAmount), bold: false, fill: false },
    { label: 'Grand Total', value: formatINR2(t.grandTotal), bold: true, fill: true },
    { label: 'Received Amount', value: formatINR2(t.received), bold: false, fill: false },
    { label: 'Payment Method', value: methodLabel, bold: false, fill: false },
    { label: 'Balance', value: formatINR2(t.balance), bold: true, fill: false }
  ];

  return (
    <div className="invoice-summary">
      <div className="invoice-summary-title">PRICE SUMMARY</div>
      <table className="invoice-table invoice-summary-table">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={row.fill ? 'row-grand-total' : row.bold ? 'row-strong' : ''}>
              <td>{row.label}</td>
              <td className="col-right strong">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}