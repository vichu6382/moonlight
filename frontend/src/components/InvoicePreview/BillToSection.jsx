import { formatDateDDMMYYYY } from '../../utils/format';

export function BillToSection({ invoiceData }) {
  const dateDisplay = formatDateDDMMYYYY(invoiceData.dateISO);
  return (
    <div className="invoice-info-grid">
      <div className="invoice-info-col">
        <h3 className="invoice-info-heading">BILL TO</h3>
        <p className="invoice-customer-name">{invoiceData.customerName || '—'}</p>
        {invoiceData.hasGuestGstin && invoiceData.guestGstin ? (
          <p>GSTIN: {invoiceData.guestGstin}</p>
        ) : (
          <p>GST: Unregistered / No GST</p>
        )}
        <p>
          Heads: {invoiceData.members + invoiceData.children} ({invoiceData.members} Adult
          {invoiceData.members !== 1 ? 's' : ''} + {invoiceData.children} Child
          {invoiceData.children !== 1 ? 'ren' : ''}
          {invoiceData.free > 0 ? ` + ${invoiceData.free} Free` : ''})
        </p>
        <p>Package Type: {invoiceData.packageLabel}</p>
        <p>Package Rate: {invoiceData.packageRateText} / member</p>
      </div>
      <div className="invoice-info-col invoice-info-col-right">
        <h3 className="invoice-info-heading">INVOICE DETAILS</h3>
        <p>Invoice No: <strong>{invoiceData.invoiceNumber}</strong></p>
        <p>Date: {dateDisplay}</p>
        <p>Place of Supply: {invoiceData.seller.stateName} ({invoiceData.seller.stateCode})</p>
      </div>
    </div>
  );
}