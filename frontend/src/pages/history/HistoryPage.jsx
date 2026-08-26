import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, Filter, ChevronDown, ChevronUp, ChevronsUpDown,
  FileSpreadsheet, FileText, Eye, Edit3, Trash2, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import * as api from '../../services/apiService';
import { filterInvoices, sortInvoices } from '../../utils/invoiceHelpers';
import { formatINR, formatDateDDMMYYYY } from '../../utils/format';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmModal } from '../../components/common/Modal';
import { AnimatedPage } from '../../components/common/AnimatedPage';
import { exportBillingReportPDF } from '../../utils/billingReportExport';
import { exportBillingReportExcel } from '../../utils/billingReportExcel';
import toast from 'react-hot-toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ROW_OPTIONS = [10, 25, 50, 100];

const SORT_COLUMNS = [
  { key: 'invoiceNumber', label: 'Invoice No' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'grandTotal', label: 'Total' },
  { key: 'received', label: 'Received' },
  { key: 'balance', label: 'Balance' }
];

export function HistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    year: 'all', month: 'all', dateFrom: '', dateTo: '',
    packageType: 'all', paymentStatus: 'all', gstApplicable: 'all',
    minAmount: '', maxAmount: '', customerName: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [allInvoices, setAllInvoices] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        const [invoices, yearsList] = await Promise.all([
          api.getInvoices(),
          api.getAvailableYears()
        ]);
        if (!cancelled) {
          setAllInvoices(invoices);
          setYears(yearsList);
        }
      } catch {
        if (!cancelled) setAllInvoices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [dataVersion]);

  const filteredInvoices = useMemo(() => {
    let invoices = allInvoices;
    const activeFilters = { ...filters };
    if (search) activeFilters.search = search;
    if (search) {
      const q = search.toLowerCase();
      invoices = invoices.filter((inv) => {
        const searchable = [
          inv.invoiceNumber, inv.customer?.name, inv.customer?.gstNumber,
          inv.customer?.contact, inv.customer?.address, inv.id
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(q);
      });
    }
    invoices = filterInvoices(invoices, activeFilters);
    invoices = sortInvoices(invoices, sortField, sortDir);
    return invoices;
  }, [allInvoices, search, filters, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / perPage));
  const pagedInvoices = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredInvoices.slice(start, start + perPage);
  }, [filteredInvoices, page, perPage]);

  const summary = useMemo(() => ({
    bills: filteredInvoices.length,
    sales: filteredInvoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0),
    received: filteredInvoices.reduce((s, i) => s + (i.totals?.received || 0), 0),
    pending: filteredInvoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0) - filteredInvoices.reduce((s, i) => s + (i.totals?.received || 0), 0),
    gst: filteredInvoices.reduce((s, i) => s + (i.gst?.total || 0), 0)
  }), [filteredInvoices]);

  const handleSort = useCallback((field) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        return field;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ year: 'all', month: 'all', dateFrom: '', dateTo: '', packageType: 'all', paymentStatus: 'all', gstApplicable: 'all', minAmount: '', maxAmount: '', customerName: '' });
    setSearch('');
    setPage(1);
    toast.success('Filters cleared');
  }, []);

  const handleDelete = useCallback(async (inv) => {
    try {
      await api.deleteInvoice(inv._id || inv.id);
      setDeleteTarget(null);
      setDataVersion((v) => v + 1);
      toast.success('Invoice deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice');
    }
  }, []);

  const hasActiveFilters = Object.entries(filters).some(([, v]) => v && v !== 'all' && v !== '');

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="sort-icon-inactive" />;
    return sortDir === 'asc' ? <ChevronUp size={13} className="sort-icon-active" /> : <ChevronDown size={13} className="sort-icon-active" />;
  };

  if (allInvoices.length === 0 && !search && !hasActiveFilters && !loading) {
    return (
      <div className="page-container">
        <EmptyState
          icon={History}
          title="No invoices yet"
          message="Create your first bill to see it here."
          action="Create New Bill"
          onAction={() => navigate('/create-bill')}
        />
      </div>
    );
  }

  return (
    <AnimatedPage className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing History</h1>
          <p className="page-subtitle">All generated invoices</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => exportBillingReportExcel(allInvoices)}>
            <FileSpreadsheet size={14} /> Excel Report
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => exportBillingReportPDF(allInvoices, filters)}>
            <FileText size={14} /> PDF Report
          </button>
        </div>
      </div>

      <div className="summary-strip">
        <div className="summary-item">
          <span className="summary-label">Filtered Bills</span>
          <span className="summary-value">{summary.bills}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Filtered Sales</span>
          <span className="summary-value">{formatINR(summary.sales)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Received</span>
          <span className="summary-value summary-received">{formatINR(summary.received)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Pending</span>
          <span className="summary-value summary-pending">{formatINR(summary.pending)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">GST</span>
          <span className="summary-value">{formatINR(summary.gst)}</span>
        </div>
      </div>

      <div className="card">
        <div className="table-controls">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search invoice number, customer name, GST number, phone number..."
          />
          <button
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} /> Filters
            {hasActiveFilters && <span className="filter-count">{Object.values(filters).filter((v) => v && v !== 'all' && v !== '').length}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">Year</label>
                <select className="input" value={filters.year} onChange={(e) => { setFilters((f) => ({ ...f, year: e.target.value })); setPage(1); }}>
                  <option value="all">All Years</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Month</label>
                <select className="input" value={filters.month} onChange={(e) => { setFilters((f) => ({ ...f, month: e.target.value })); setPage(1); }}>
                  <option value="all">All Months</option>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">From Date</label>
                <input type="date" className="input" value={filters.dateFrom} onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setPage(1); }} />
              </div>
              <div className="filter-group">
                <label className="filter-label">To Date</label>
                <input type="date" className="input" value={filters.dateTo} onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setPage(1); }} />
              </div>
              <div className="filter-group">
                <label className="filter-label">Package</label>
                <select className="input" value={filters.packageType} onChange={(e) => { setFilters((f) => ({ ...f, packageType: e.target.value })); setPage(1); }}>
                  <option value="all">All</option>
                  <option value="withFood">With Food</option>
                  <option value="withoutFood">Without Food</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Payment Status</label>
                <select className="input" value={filters.paymentStatus} onChange={(e) => { setFilters((f) => ({ ...f, paymentStatus: e.target.value })); setPage(1); }}>
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">GST</label>
                <select className="input" value={filters.gstApplicable} onChange={(e) => { setFilters((f) => ({ ...f, gstApplicable: e.target.value })); setPage(1); }}>
                  <option value="all">All</option>
                  <option value="yes">GST Applicable</option>
                  <option value="no">No GST</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Customer Name</label>
                <input type="text" className="input" placeholder="Filter by name..." value={filters.customerName} onChange={(e) => { setFilters((f) => ({ ...f, customerName: e.target.value })); setPage(1); }} />
              </div>
              <div className="filter-group">
                <label className="filter-label">Min Amount</label>
                <input type="number" className="input" placeholder="Min" value={filters.minAmount} onChange={(e) => { setFilters((f) => ({ ...f, minAmount: e.target.value })); setPage(1); }} />
              </div>
              <div className="filter-group">
                <label className="filter-label">Max Amount</label>
                <input type="number" className="input" placeholder="Max" value={filters.maxAmount} onChange={(e) => { setFilters((f) => ({ ...f, maxAmount: e.target.value })); setPage(1); }} />
              </div>
            </div>
            {hasActiveFilters && (
              <button className="btn btn-sm btn-ghost" onClick={handleClearFilters}>
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        )}

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                {SORT_COLUMNS.map(({ key, label }) => (
                  <th key={key} className={key === 'grandTotal' || key === 'received' || key === 'balance' ? 'text-right' : ''} onClick={() => handleSort(key)}>
                    <span className="th-sortable">{label} <SortIcon field={key} /></span>
                  </th>
                ))}
                <th>Package</th>
                <th className="text-center">Members</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedInvoices.map((inv) => (
                <tr key={inv._id || inv.id}>
                  <td className="cell-mono">{inv.invoiceNumber}</td>
                  <td>{formatDateDDMMYYYY(inv.invoiceDate)}</td>
                  <td>{inv.customer?.name || '—'}</td>
                  <td className="text-right cell-mono">{formatINR(inv.totals?.grandTotal)}</td>
                  <td className="text-right cell-mono">{formatINR(inv.totals?.received)}</td>
                  <td className="text-right cell-mono">{formatINR(inv.totals?.balance)}</td>
                  <td>{inv.package?.label || '—'}</td>
                  <td className="text-center">{(inv.membersCount || 0) + (inv.childCount || 0) + (inv.freeCount || 0)}</td>
                  <td className="text-center"><StatusBadge status={inv.paymentStatus} /></td>
                  <td className="text-center">
                    <div className="action-buttons">
                      <button className="icon-btn" title="View" onClick={() => navigate(`/history/${inv._id || inv.id}`)}><Eye size={14} /></button>
                      <button className="icon-btn" title="Edit" onClick={() => navigate(`/create-bill/edit/${inv._id || inv.id}`)}><Edit3 size={14} /></button>
                      <button className="icon-btn danger" title="Delete" onClick={() => setDeleteTarget(inv)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedInvoices.length === 0 && (
                <tr><td colSpan={10} className="empty-row">No invoices match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <div className="pagination-info">
            Showing {allInvoices.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, allInvoices.length)} of {allInvoices.length}
          </div>
          <div className="pagination-controls">
            <select className="input pagination-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
              {ROW_OPTIONS.map((n) => <option key={n} value={n}>{n} rows</option>)}
            </select>
            <button className="icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button key={p} className={`icon-btn ${p === page ? 'icon-btn-active' : ''}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              );
            })}
            <button className="icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget)}
        title="Delete Invoice?"
        message={`This action cannot be undone. Invoice ${deleteTarget?.invoiceNumber} will be permanently deleted.`}
        confirmText="Delete Invoice"
        danger
      />
    </AnimatedPage>
  );
}
