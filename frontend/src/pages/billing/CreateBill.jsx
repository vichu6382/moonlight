import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText, Save, FilePlus2, FileDown, FileSpreadsheet,
  Printer, ArrowLeft, Sparkles
} from 'lucide-react';
import { InvoiceForm } from '../../components/InvoiceForm/InvoiceForm';
import { InvoicePreview } from '../../components/InvoicePreview/InvoicePreview';
import { PreviewScale } from '../../components/InvoicePreview/PreviewScale';
import { SELLER } from '../../data/sellerData';
import { PACKAGE_CONFIG } from '../../data/packageConfig';
import { calculateInvoice } from '../../utils/calculations';
import { formatINR } from '../../utils/format';
import { exportInvoiceToPDF } from '../../utils/pdfExport';
import { exportInvoiceToExcel } from '../../utils/excelExport';
import * as api from '../../services/apiService';
import { AnimatedPage } from '../../components/common/AnimatedPage';
import toast from 'react-hot-toast';

function defaultForm(invoiceNumber, settings) {
  const pkg = settings?.invoice?.defaultPackage || 'withFood';
  return {
    sellerName: settings?.business?.name || SELLER.name,
    ourGstin: settings?.business?.gstin || SELLER.gstin,
    customerName: '',
    customerContact: '',
    customerAddress: '',
    customerState: '',
    hasGuestGstin: true,
    guestGstin: '',
    invoiceNumber,
    date: new Date().toISOString().slice(0, 10),
    membersCount: 1,
    childCount: 0,
    freeCount: 0,
    packageType: pkg,
    packagePrice: PACKAGE_CONFIG[pkg]?.pricePerMember ?? PACKAGE_CONFIG.withFood.pricePerMember,
    discountMode: 'percent',
    discountValue: 0,
    gstPercent: settings?.invoice?.defaultGst ?? 18,
    extraFood: [],
    iceCreamEnabled: false,
    iceCreamItems: [],
    coolDrinksEnabled: false,
    coolDrinkItems: [],
    receivedAmount: 0,
    paymentMethod: 'full',
    showSignatory: true,
    signatoryName: settings?.invoice?.defaultSignatory || SELLER.defaultSignatory,
    theme: settings?.invoice?.theme || 'classicPurple'
  };
}

function buildEditForm(inv, settings) {
  return {
    sellerName: inv.seller?.name || SELLER.name,
    ourGstin: inv.seller?.gstin || SELLER.gstin,
    customerName: inv.customer?.name || '',
    customerContact: inv.customer?.contact || '',
    customerAddress: inv.customer?.address || '',
    customerState: inv.customer?.state || '',
    hasGuestGstin: !!inv.customer?.gstNumber,
    guestGstin: inv.customer?.gstNumber || '',
    invoiceNumber: inv.invoiceNumber,
    date: inv.invoiceDate || '',
    membersCount: inv.membersCount || 1,
    childCount: inv.childCount || 0,
    freeCount: inv.freeCount || 0,
    packageType: inv.package?.type || 'withFood',
    packagePrice: inv.package?.pricePerMember || PACKAGE_CONFIG.withFood.pricePerMember,
    discountMode: inv.discount?.type || 'percent',
    discountValue: inv.discount?.value || 0,
    gstPercent: inv.gst?.rate || 18,
    extraFood: inv.extraFood || [],
    iceCreamEnabled: (inv.iceCream || []).length > 0,
    iceCreamItems: inv.iceCream || [],
    coolDrinksEnabled: (inv.coolDrinks || []).length > 0,
    coolDrinkItems: inv.coolDrinks || [],
    receivedAmount: inv.totals?.received || 0,
    paymentMethod: inv.paymentMethod || (inv.totals?.received > 0 && inv.totals?.balance <= 0 ? 'full' : 'advance'),
    showSignatory: inv.showSignatory !== false,
    signatoryName: inv.authorizedSignatory || SELLER.defaultSignatory,
    theme: inv.theme || settings?.invoice?.theme || 'classicPurple'
  };
}

function validateForm(form) {
  const errors = {};
  if (!form.customerName.trim()) errors.customerName = 'Customer name is required.';
  if (!form.date) errors.date = 'Date is required.';
  const headCount = Number(form.membersCount);
  if (form.membersCount === '' || form.membersCount === null || !Number.isFinite(headCount) || headCount < 1) {
    errors.membersCount = 'Member count must be at least 1.';
  }
  const childCount = Number(form.childCount);
  if (form.childCount === '' || form.childCount === null || !Number.isFinite(childCount) || childCount < 0) {
    errors.childCount = 'Child count cannot be negative.';
  }
  const freeCount = Number(form.freeCount);
  if (form.freeCount === '' || form.freeCount === null || !Number.isFinite(freeCount) || freeCount < 0) {
    errors.freeCount = 'Free count cannot be negative.';
  }
  if (!form.packageType) errors.packageType = 'Select a package type.';
  if (Number(form.packagePrice) < 1) errors.packagePrice = 'Package price must be at least 1.';
  if (Number(form.discountValue) < 0) errors.discountValue = 'Discount cannot be negative.';
  if (Number(form.gstPercent) < 0) errors.gstPercent = 'GST cannot be negative.';
  if (Number(form.receivedAmount) < 0) errors.receivedAmount = 'Received amount cannot be negative.';
  return errors;
}

function buildInvoiceRecord(form, totals, settings) {
  const b = settings?.business || {};
  return {
    theme: form.theme,
    invoiceDate: form.date,
    seller: {
      name: b.name,
      addressLine1: b.addressLine1,
      addressLine2: b.addressLine2,
      gstin: b.gstin,
      stateCode: b.stateCode,
      stateName: b.stateName,
      placeOfSupply: b.placeOfSupply
    },
    invoiceNumber: form.invoiceNumber,
    customer: {
      name: form.customerName,
      gstNumber: form.hasGuestGstin ? form.guestGstin : '',
      contact: form.customerContact,
      address: form.customerAddress,
      state: form.customerState
    },
    membersCount: Number(form.membersCount) || 0,
    childCount: Number(form.childCount) || 0,
    freeCount: Number(form.freeCount) || 0,
    package: {
      type: form.packageType,
      label: PACKAGE_CONFIG[form.packageType]?.label || '',
      pricePerMember: Number(form.packagePrice) || 0,
      total: totals.packageTotal
    },
    discount: {
      type: form.discountMode,
      value: Number(form.discountValue) || 0,
      amount: totals.discountAmount
    },
    extraFood: form.extraFood || [],
    iceCream: form.iceCreamEnabled ? (form.iceCreamItems || []) : [],
    coolDrinks: form.coolDrinksEnabled ? (form.coolDrinkItems || []) : [],
    gst: {
      rate: totals.gstPercent,
      taxableAmount: totals.taxableAmount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      total: totals.gstAmount
    },
    totals: {
      subtotal: totals.grossSubtotal,
      grandTotal: totals.grandTotal,
      received: totals.received,
      balance: totals.balance
    },
    paymentStatus: totals.balance <= 0 ? 'paid' : totals.received > 0 ? 'partial' : 'unpaid',
    paymentMethod: form.paymentMethod || 'full',
    authorizedSignatory: form.showSignatory ? form.signatoryName : '',
    showSignatory: form.showSignatory
  };
}

/* ---------- PIXEL-PERFECT CREATE BILL SKELETON LOADER ---------- */
function CreateBillSkeleton() {
  return (
    <div className="bill-skeleton-layout">
      {/* Left Column Form Skeleton */}
      <section className="bill-skeleton-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton-pulse" style={{ height: '22px', width: '180px' }} />
            <div className="skeleton-pulse" style={{ height: '13px', width: '260px' }} />
          </div>
          <div className="skeleton-pulse" style={{ height: '28px', width: '80px', borderRadius: '9999px' }} />
        </div>

        {/* 5 Accordion Skeletons */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bill-skeleton-section">
            <div className="skeleton-pulse" style={{ width: '36px', height: '36px', borderRadius: '9px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div className="skeleton-pulse" style={{ height: '14px', width: `${40 + (i * 12) % 30}%` }} />
              <div className="skeleton-pulse" style={{ height: '11px', width: `${60 + (i * 7) % 20}%` }} />
            </div>
            <div className="skeleton-pulse" style={{ width: '20px', height: '20px', borderRadius: '6px' }} />
          </div>
        ))}
      </section>

      {/* Right Column Invoice Sheet Skeleton */}
      <section className="bill-skeleton-preview">
        <div className="bill-skeleton-sheet">
          {/* Top Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--card-border)' }}>
            <div className="skeleton-pulse" style={{ height: '18px', width: '140px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="skeleton-pulse" style={{ height: '32px', width: '70px', borderRadius: '7px' }} />
              <div className="skeleton-pulse" style={{ height: '32px', width: '75px', borderRadius: '7px' }} />
              <div className="skeleton-pulse" style={{ height: '32px', width: '70px', borderRadius: '7px' }} />
            </div>
          </div>

          {/* Invoice Document Placeholder */}
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--table-head-bg)' }}>
            <div className="skeleton-pulse" style={{ height: '70px', width: '100%', borderRadius: '10px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="skeleton-pulse" style={{ height: '90px', borderRadius: '8px' }} />
              <div className="skeleton-pulse" style={{ height: '90px', borderRadius: '8px' }} />
            </div>
            <div className="skeleton-pulse" style={{ height: '180px', width: '100%', borderRadius: '8px' }} />
            <div className="skeleton-pulse" style={{ height: '80px', width: '100%', borderRadius: '8px' }} />
          </div>

          {/* Save Bar */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '12px' }}>
            <div className="skeleton-pulse" style={{ height: '40px', width: '160px', borderRadius: '8px' }} />
          </div>
        </div>
      </section>
    </div>
  );
}

export function CreateBillPage() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const s = await api.getSettings();
        if (cancelled) return;
        setSettings(s);
        if (editId) {
          const inv = await api.getInvoiceById(editId);
          if (cancelled) return;
          if (!inv) {
            toast.error('Invoice not found');
            navigate('/history');
            return;
          }
          setForm(buildEditForm(inv, s));
        } else {
          setForm(defaultForm('NEW', s));
        }
      } catch {
        toast.error('Failed to load bill settings');
        navigate('/history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [editId, navigate]);

  const totals = useMemo(() => (form ? calculateInvoice(form, PACKAGE_CONFIG) : null), [form]);

  const invoiceData = useMemo(
    () => (form && totals ? {
      seller: {
        name: form.sellerName || SELLER.name,
        addressLine1: SELLER.addressLine1,
        addressLine2: SELLER.addressLine2,
        gstin: form.ourGstin || SELLER.gstin,
        stateCode: SELLER.stateCode,
        stateName: SELLER.stateName,
        placeOfSupply: SELLER.placeOfSupply
      },
      invoiceNumber: form.invoiceNumber,
      dateISO: form.date,
      customerName: form.customerName,
      hasGuestGstin: form.hasGuestGstin,
      guestGstin: form.guestGstin,
      members: Number(form.membersCount) || 0,
      children: Number(form.childCount) || 0,
      free: Number(form.freeCount) || 0,
      packageTypeKey: form.packageType,
      packageLabel: PACKAGE_CONFIG[form.packageType]?.label ?? '',
      packageRateText: formatINR(totals.packageRate),
      childRateText: formatINR(totals.childRate),
      discountMode: form.discountMode,
      discountValue: form.discountValue,
      gstPercent: totals.gstPercent,
      extraFood: form.extraFood,
      iceCreamItems: form.iceCreamEnabled ? form.iceCreamItems : [],
      coolDrinkItems: form.coolDrinksEnabled ? form.coolDrinkItems : [],
      receivedAmount: form.receivedAmount,
      paymentMethod: form.paymentMethod || 'full',
      showSignatory: form.showSignatory,
      signatoryName: form.signatoryName,
      theme: form.theme,
      totals
    } : null),
    [form, totals]
  );

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setPackageType = useCallback((key) => {
    setForm((prev) => ({
      ...prev,
      packageType: key,
      packagePrice: PACKAGE_CONFIG[key]?.pricePerMember ?? prev.packagePrice
    }));
  }, []);

  const runExport = useCallback(
    async (kind, fn) => {
      const validationErrors = validateForm(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length) {
        toast.error('Please complete required fields before exporting.');
        return;
      }
      setExporting(kind);
      try {
        await fn();
        toast.success(`${kind === 'pdf' ? 'PDF' : 'Excel'} downloaded successfully.`);
      } catch (err) {
        console.error(`Export ${kind} failed:`, err);
        toast.error(`Export failed: ${err.message || 'unknown error'}`);
      } finally {
        setExporting(null);
      }
    },
    [form]
  );

  const handlePdf = useCallback(
    () =>
      runExport('pdf', async () => {
        const sheet = document.querySelector('.invoice-sheet');
        if (!sheet) throw new Error('Invoice sheet preview not found');
        document.body.classList.add('export-capture');
        await new Promise((r) => setTimeout(r, 60));
        try {
          await exportInvoiceToPDF(sheet, form?.invoiceNumber, () => {}, form?.customerName);
        } finally {
          document.body.classList.remove('export-capture');
        }
      }),
    [runExport, form?.invoiceNumber, form?.customerName]
  );

  const handleExcel = useCallback(
    () => runExport('excel', () => exportInvoiceToExcel(invoiceData, form?.invoiceNumber)),
    [runExport, invoiceData, form?.invoiceNumber]
  );

  const handlePrint = useCallback(() => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      toast.error('Please complete required fields before printing.');
      return;
    }
    window.print();
  }, [form]);

  const handleSave = useCallback(async () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      toast.error('Please fix highlighted form errors before saving.');
      return;
    }
    const record = buildInvoiceRecord(form, totals, settings);
    try {
      if (editId) {
        await api.updateInvoice(editId, record);
        toast.success('Invoice updated successfully.');
      } else {
        await api.createInvoice(record);
        toast.success('Invoice generated and saved successfully.');
      }
      navigate('/history');
    } catch (err) {
      toast.error(err.message || 'Failed to save invoice');
    }
  }, [form, totals, settings, editId, navigate]);

  const handleNewInvoice = useCallback(async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
      setForm(defaultForm('NEW', s));
      setErrors({});
      navigate('/create-bill');
      toast.success('New invoice template initialized.');
    } catch {
      toast.error('Failed to load default settings');
    }
  }, [navigate]);

  if (loading || !form) {
    return <CreateBillSkeleton />;
  }

  return (
    <AnimatedPage className="page-container bill-page">
      <div className="bill-layout">
        {/* Left Column: Form Controls */}
        <section className="bill-form-col">
          <div className="card form-card">
            <div className="form-panel-header">
              <div className="form-panel-title">
                <h2>{editId ? `Edit Invoice (${form.invoiceNumber})` : 'Create New Bill'}</h2>
                <p>Interactive billing form — real-time preview on right</p>
              </div>
              <div className="form-panel-actions">
                {editId ? (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/history')}>
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : (
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleNewInvoice} title="Reset to new invoice">
                    <FilePlus2 size={14} /> Reset
                  </button>
                )}
                <span className="live-badge">
                  <Sparkles size={11} /> Live Preview
                </span>
              </div>
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

        {/* Right Column: Live Invoice Preview */}
        <section className="bill-preview-col">
          <div className="card card-preview">
            <div className="preview-toolbar">
              <span className="preview-toolbar-title">
                <FileText size={16} /> Live Document Preview
              </span>
              <div className="preview-toolbar-buttons">
                <button type="button" className="btn btn-primary btn-sm" onClick={handlePdf} disabled={exporting}>
                  <FileDown size={14} /> {exporting === 'pdf' ? 'Building PDF…' : 'PDF'}
                </button>
                <button type="button" className="btn btn-green btn-sm" onClick={handleExcel} disabled={exporting}>
                  <FileSpreadsheet size={14} /> {exporting === 'excel' ? 'Building Excel…' : 'Excel'}
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={handlePrint} disabled={exporting}>
                  <Printer size={14} /> Print
                </button>
              </div>
            </div>

            <div className="preview-scroll">
              <PreviewScale>
                <InvoicePreview invoiceData={invoiceData} />
              </PreviewScale>
            </div>

            <div className="preview-save-bar">
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={16} /> {editId ? 'Save Changes' : 'Generate & Save Bill'}
              </button>
              {editId && (
                <button className="btn btn-outline" onClick={() => navigate('/history')}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </AnimatedPage>
  );
}