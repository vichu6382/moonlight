import { useEffect, useRef, useState } from 'react';
import { FileDown, FileText, FileSpreadsheet, Printer, Save, Eraser, FilePlus2, Moon } from 'lucide-react';
import { InvoiceForm } from '../InvoiceForm/InvoiceForm';
import { InvoicePreview } from '../InvoicePreview/InvoicePreview';

export function Dashboard({
  form,
  totals,
  errors,
  setField,
  setPackageType,
  invoiceData,
  exporting,
  onPdf,
  onExcel,
  onPrint,
  onSaveDraft,
  onClearDraft,
  onNewInvoice
}) {
  const scaleWrapRef = useRef(null);
  const sheetRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(1123);

  useEffect(() => {
    const wrap = scaleWrapRef.current;
    const sheet = sheetRef.current;
    if (!wrap || !sheet) return;
    const update = () => {
      const containerWidth = wrap.clientWidth;
      const sheetW = sheet.offsetWidth;
      const s = containerWidth > 0 && sheetW > 0 ? Math.min(1, containerWidth / sheetW) : 1;
      setScale(s);
      setSheetHeight(Math.round(sheet.offsetHeight * s));
    };
    update();
    const roWrap = new ResizeObserver(update);
    roWrap.observe(wrap);
    const roSheet = new ResizeObserver(update);
    roSheet.observe(sheet);
    return () => {
      roWrap.disconnect();
      roSheet.disconnect();
    };
  }, []);
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <span className="app-header-logo">
            <Moon size={22} />
          </span>
          <div>
            <h1>Moon Light Resort</h1>
            <p>Booking & Billing System</p>
          </div>
        </div>
        <div className="app-header-actions">
          <button type="button" className="btn btn-outline" onClick={onSaveDraft} disabled={exporting}>
            <Save size={16} /> Save Draft
          </button>
          <button type="button" className="btn btn-outline" onClick={onClearDraft} disabled={exporting}>
            <Eraser size={16} /> Clear Draft
          </button>
          <button type="button" className="btn btn-primary" onClick={onNewInvoice} disabled={exporting}>
            <FilePlus2 size={16} /> New Invoice
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="app-form-col">
          <div className="card form-card">
            <div className="form-panel-header">
              <div className="form-panel-title">
                <h2>Booking Details</h2>
                <p>Fill the form — preview &amp; exports update instantly</p>
              </div>
              <span className="live-badge">
                <span className="live-dot" /> Live
              </span>
            </div>
            <InvoiceForm
              form={form}
              setField={setField}
              setPackageType={setPackageType}
              totals={totals}
              errors={errors}
            />
          </div>
        </section>

        <section className="app-preview-col">
          <div className="card card-preview">
            <div className="preview-toolbar">
              <span className="preview-toolbar-title">
                <FileText size={16} /> Live Invoice Preview
              </span>
              <div className="preview-toolbar-buttons">
                <button type="button" className="btn btn-primary" onClick={onPdf} disabled={exporting}>
                  <FileDown size={16} /> {exporting === 'pdf' ? 'Generating PDF…' : 'Download PDF'}
                </button>
                <button type="button" className="btn btn-green" onClick={onExcel} disabled={exporting}>
                  <FileSpreadsheet size={16} /> {exporting === 'excel' ? 'Generating Excel…' : 'Download Excel'}
                </button>
                <button type="button" className="btn btn-outline" onClick={onPrint} disabled={exporting}>
                  <Printer size={16} /> Print
                </button>
              </div>
            </div>
            <div className="preview-scroll">
              <div className="preview-scale" ref={scaleWrapRef} style={{ height: sheetHeight }}>
                <div className="preview-scale-inner" style={{ transform: `scale(${scale})` }}>
                  <InvoicePreview invoiceData={invoiceData} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}