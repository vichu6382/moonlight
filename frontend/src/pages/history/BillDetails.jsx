import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileDown, FileSpreadsheet, Printer, Edit3, Trash2
} from 'lucide-react';
import * as api from '../../services/apiService';
import { InvoicePreview } from '../../components/InvoicePreview/InvoicePreview';
import { PreviewScale } from '../../components/InvoicePreview/PreviewScale';
import { calculateInvoice } from '../../utils/calculations';
import { formatINR, formatDateDDMMYYYY } from '../../utils/format';
import { exportInvoiceToPDF } from '../../utils/pdfExport';
import { exportInvoiceToExcel } from '../../utils/excelExport';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/Modal';
import { PACKAGE_CONFIG } from '../../data/packageConfig';
import { SELLER } from '../../data/sellerData';
import toast from 'react-hot-toast';

function buildInvoiceData(inv) {
  const pkg = inv.package || {};
  const fakeForm = {
    headCount: inv.membersCount || 0,
    childCount: inv.childCount || 0,
    packagePrice: pkg.pricePerMember || 0,
    extraFood: inv.extraFood || [],
    iceCreamItems: inv.iceCream || [],
    coolDrinkItems: inv.coolDrinks || [],
    discountMode: inv.discount?.type || 'percent',
    discountValue: inv.discount?.value || 0,
    gstPercent: inv.gst?.rate || 0,
    receivedAmount: inv.totals?.received || 0
  };
  const totals = calculateInvoice(fakeForm, PACKAGE_CONFIG);

  return {
    seller: inv.seller || SELLER,
    invoiceNumber: inv.invoiceNumber,
    dateISO: inv.invoiceDate,
    customerName: inv.customer?.name || '',
    hasGuestGstin: !!inv.customer?.gstNumber,
    guestGstin: inv.customer?.gstNumber || '',
    members: inv.membersCount || 0,
    children: inv.childCount || 0,
    free: inv.freeCount || 0,
    packageTypeKey: pkg.type || 'withFood',
    packageLabel: pkg.label || '',
    packageRateText: formatINR(pkg.pricePerMember),
    childRateText: formatINR(totals.childRate),
    discountMode: inv.discount?.type || 'percent',
    discountValue: inv.discount?.value || 0,
    gstPercent: totals.gstPercent,
    extraFood: inv.extraFood || [],
    iceCreamItems: inv.iceCream || [],
    coolDrinkItems: inv.coolDrinks || [],
    receivedAmount: inv.totals?.received || 0,
    paymentMethod: inv.paymentMethod || 'full',
    showSignatory: inv.showSignatory !== false,
    signatoryName: inv.authorizedSignatory || 'Manager',
    theme: inv.theme,
    totals
  };
}

export function BillDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    async function fetchInvoice() {
      try {
        setLoading(true);
        const data = await api.getInvoiceById(id);
        if (!cancelled) setInv(data);
      } catch {
        if (!cancelled) setInv(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchInvoice();
    return () => { cancelled = true; };
  }, [id]);

  const invoiceData = useMemo(() => inv ? buildInvoiceData(inv) : null, [inv]);

  const handlePdf = useCallback(async () => {
    if (!invoiceData) return;
    setExporting('pdf');
    try {
      const sheet = document.querySelector('.invoice-sheet');
      if (!sheet) throw new Error('Invoice sheet not found');
      document.body.classList.add('export-capture');
      await new Promise((r) => setTimeout(r, 80));
      try {
        await exportInvoiceToPDF(sheet, inv.invoiceNumber, () => {}, inv.customer?.name);
      } finally {
        document.body.classList.remove('export-capture');
      }
      toast.success('PDF downloaded successfully.');
    } catch {
      toast.error('PDF export failed.');
    } finally {
      setExporting(null);
    }
  }, [invoiceData, inv]);

  const handleExcel = useCallback(async () => {
    if (!invoiceData) return;
    setExporting('excel');
    try {
      await exportInvoiceToExcel(invoiceData, inv.invoiceNumber);
      toast.success('Excel downloaded successfully.');
    } catch {
      toast.error('Excel export failed.');
    } finally {
      setExporting(null);
    }
  }, [invoiceData, inv]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDelete = useCallback(async () => {
    try {
      await api.deleteInvoice(id);
      toast.success('Invoice deleted successfully');
      navigate('/history');
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice');
    }
  }, [id, navigate]);

  if (!inv || !invoiceData) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Invoice not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/history')}>Back to History</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/history')}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 className="page-title">{inv.invoiceNumber}</h1>
            <p className="page-subtitle">{inv.customer?.name} — {formatDateDDMMYYYY(inv.invoiceDate)}</p>
          </div>
        </div>
        <div className="page-header-actions">
          <StatusBadge status={inv.paymentStatus} />
          <button className="btn btn-primary btn-sm" onClick={handlePdf} disabled={exporting}>
            <FileDown size={14} /> PDF
          </button>
          <button className="btn btn-green btn-sm" onClick={handleExcel} disabled={exporting}>
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>
            <Printer size={14} /> Print
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/create-bill/edit/${id}`)}>
            <Edit3 size={14} /> Edit
          </button>
          <button className="btn btn-outline btn-sm" style={{ color: '#DC2626' }} onClick={() => setDeleteOpen(true)}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="bill-details-grid">
        <div className="bill-details-info">
          <div className="card">
            <div className="card-header"><h3>Invoice Information</h3></div>
            <div className="card-body">
              <div className="detail-rows">
                <div className="detail-row">
                  <span className="detail-label">Invoice Number</span>
                  <span className="detail-value">{inv.invoiceNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{formatDateDDMMYYYY(inv.invoiceDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Customer</span>
                  <span className="detail-value">{inv.customer?.name || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Contact</span>
                  <span className="detail-value">{inv.customer?.contact || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">GSTIN</span>
                  <span className="detail-value">{inv.customer?.gstNumber || 'Unregistered'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{inv.customer?.address || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Members</span>
                  <span className="detail-value">{(inv.membersCount || 0) + (inv.childCount || 0)} ({inv.membersCount || 0} adults + {inv.childCount || 0} children{inv.freeCount ? ` + ${inv.freeCount} free` : ''})</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Package</span>
                  <span className="detail-value">{inv.package?.label || '—'} — {formatINR(inv.package?.pricePerMember)}/member</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Status</span>
                  <StatusBadge status={inv.paymentStatus} />
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Method</span>
                  <span className="detail-value">{inv.paymentMethod === 'full' ? 'Full Payment' : 'Advance Payment'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Payment Summary</h3></div>
            <div className="card-body">
              <div className="detail-rows">
                <div className="detail-row">
                  <span className="detail-label">Subtotal</span>
                  <span className="detail-value">{formatINR(inv.totals?.subtotal)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Discount</span>
                  <span className="detail-value">{formatINR(inv.discount?.amount || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Taxable Amount</span>
                  <span className="detail-value">{formatINR(inv.gst?.taxableAmount)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">GST ({inv.gst?.rate}%)</span>
                  <span className="detail-value">{formatINR(inv.gst?.total)}</span>
                </div>
                <div className="detail-row detail-row-total">
                  <span className="detail-label">Grand Total</span>
                  <span className="detail-value">{formatINR(inv.totals?.grandTotal)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Received</span>
                  <span className="detail-value" style={{ color: '#16A34A' }}>{formatINR(inv.totals?.received)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Payment Method</span>
                  <span className="detail-value" style={{ fontWeight: 600 }}>{inv.paymentMethod === 'full' ? 'Full Payment' : 'Advance Payment'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Balance</span>
                  <span className="detail-value" style={{ color: inv.totals?.balance > 0 ? '#DC2626' : '#16A34A' }}>{formatINR(inv.totals?.balance)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bill-details-preview">
          <div className="card card-preview">
<div className="preview-scroll">
                <PreviewScale>
                  <InvoicePreview invoiceData={invoiceData} />
                </PreviewScale>
              </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Invoice?"
        message={`This action cannot be undone. Invoice ${inv.invoiceNumber} will be permanently deleted.`}
        confirmText="Delete Invoice"
        danger
      />
    </div>
  );
}
