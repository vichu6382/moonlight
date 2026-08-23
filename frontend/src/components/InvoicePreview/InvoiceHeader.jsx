import { logoDataUrl } from '../../utils/logoHelper';

export function InvoiceHeader({ seller, theme }) {
  return (
    <div className="invoice-header" style={{ background: theme?.headerBackground || undefined }}>
      <div className="invoice-header-left">
        <div className="invoice-logo-frame" style={{ background: theme?.logoFrameBg || '#fff' }}>
          <img src={logoDataUrl()} alt={`${seller.name} logo`} className="invoice-logo" />
        </div>
      </div>
      <div className="invoice-header-center">
        <h1 className="invoice-resort-name">{seller.name}</h1>
        <p className="invoice-address" style={{ color: theme?.addressColor || undefined }}>
          {seller.addressLine1}
          <br />
          {seller.addressLine2}
        </p>
        <p className="invoice-gstin" style={{ color: theme?.gstinColor || undefined }}>
          GSTIN: {seller.gstin} &nbsp;|&nbsp; State: {seller.stateCode} - {seller.stateName}
        </p>
      </div>
      <div className="invoice-header-right">
        <div className="invoice-title-box" style={{ borderColor: theme?.accentColor || undefined }}>
          <span className="invoice-title-text">TAX</span>
          <span className="invoice-title-text">INVOICE</span>
        </div>
      </div>
    </div>
  );
}
