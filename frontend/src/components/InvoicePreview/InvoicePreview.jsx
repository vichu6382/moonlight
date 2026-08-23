import { useMemo } from 'react';
import { getTheme } from '../../themes/invoiceThemes';
import { InvoiceHeader } from './InvoiceHeader';
import { BillToSection } from './BillToSection';
import { InvoiceItems } from './InvoiceItems';
import { InvoiceSummary } from './InvoiceSummary';
import { AmountInWords } from './AmountInWords';
import { AuthorizedSignatory } from './AuthorizedSignatory';

export function InvoicePreview({ invoiceData }) {
  const seller = invoiceData.seller;
  const theme = useMemo(() => getTheme(invoiceData.theme), [invoiceData.theme]);

  const themeVars = {
    '--inv-primary': theme.primaryColor,
    '--inv-secondary': theme.secondaryColor,
    '--inv-accent': theme.accentColor,
    '--inv-border': theme.borderColor,
    '--inv-text': theme.textColor,
    '--inv-header-bg': theme.headerBg,
    '--inv-table-header-bg': theme.tableHeaderBg,
    '--inv-table-header-color': theme.tableHeaderColor,
    '--inv-table-alt': theme.tableAltRow,
    '--inv-table-sub': theme.tableSubHeader,
    '--inv-table-sub-color': theme.tableSubHeaderColor,
    '--inv-grand-total-bg': theme.grandTotalBg,
    '--inv-grand-total-color': theme.grandTotalColor,
    '--inv-gold-tint': theme.goldTint,
    '--inv-gold-tint-color': theme.goldTintColor,
    '--inv-footer-bg': theme.footerBg,
    '--inv-footer-border': theme.footerBorderColor,
    '--inv-signatory-color': theme.signatoryColor,
    '--inv-amount-words-bg': theme.amountWordsBg,
    '--inv-amount-words-border': theme.amountWordsBorder,
    '--inv-tagline-color': theme.taglineColor,
    '--inv-address-color': theme.addressColor,
    '--inv-gstin-color': theme.gstinColor,
    '--inv-logo-frame-bg': theme.logoFrameBg,
    '--inv-body-bg': theme.bodyBg,
    '--inv-font': theme.fontFamily,
    '--inv-summary-label-color': theme.summaryLabelColor,
    '--inv-summary-value-color': theme.summaryValueColor
  };

  return (
    <div className="invoice-preview">
      <div className="invoice-sheet" style={themeVars}>
        <InvoiceHeader seller={seller} theme={theme} />
        <div className="invoice-body">
          <BillToSection invoiceData={invoiceData} />
          <InvoiceItems invoiceData={invoiceData} />
          <InvoiceSummary invoiceData={invoiceData} />
          <AmountInWords amount={invoiceData.totals.grandTotal} />
          <div className="invoice-terms">
            <div className="invoice-terms-title">TERMS AND CONDITIONS</div>
            <p>Thank you for doing business with us.</p>
          </div>
          {invoiceData.showSignatory && (
            <AuthorizedSignatory seller={seller} signatoryName={invoiceData.signatoryName} />
          )}
        </div>
        <div className="invoice-footer">
          <p className="invoice-footer-text">
            MOON LIGHT RESORT &bull; GSTIN {seller.gstin} &bull; {seller.stateCode} - {seller.stateName}
          </p>
          <p className="invoice-footer-sub">{seller.addressLine1} {seller.addressLine2}</p>
        </div>
      </div>
    </div>
  );
}
