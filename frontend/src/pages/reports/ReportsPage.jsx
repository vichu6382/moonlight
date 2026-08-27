import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3, FileSpreadsheet, FileText, TrendingUp,
  DollarSign, CheckCircle2, Clock, Receipt, RefreshCw, Search,
  Calendar, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import * as api from '../../services/apiService';
import { formatINR, formatDateDDMMYYYY } from '../../utils/format';
import { exportBillingReportPDF } from '../../utils/billingReportExport';
import { exportBillingReportExcel } from '../../utils/billingReportExcel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AnimatedPage } from '../../components/common/AnimatedPage';
import toast from 'react-hot-toast';

const RANGE_PRESETS = [
  { id: 'year', label: 'Full Year' },
  { id: 'month', label: 'This Month' },
  { id: '30days', label: 'Last 30 Days' },
  { id: 'all', label: 'All Time' }
];

export function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [reportType, setReportType] = useState('sales'); // 'sales' | 'gst' | 'ledger'
  const [rangePreset, setRangePreset] = useState('year');
  const [searchQuery, setSearchQuery] = useState('');
  const [years, setYears] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [monthly, invoices, yearsList] = await Promise.all([
        api.getMonthlyStats(selectedYear),
        api.getInvoices(),
        api.getAvailableYears()
      ]);
      
      setMonthlyData(monthly || []);
      setAllInvoices(invoices || []);
      if (yearsList && yearsList.length) setYears(yearsList);
      if (isRefresh) toast.success('Report synced in real-time');
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter invoices in real-time based on selected range and search query
  const realtimeFilteredInvoices = useMemo(() => {
    const now = new Date();
    let list = [...allInvoices];

    // Filter by year if in full year preset
    if (rangePreset === 'year') {
      list = list.filter((inv) => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        return d.getFullYear() === Number(selectedYear);
      });
    } else if (rangePreset === 'month') {
      list = list.filter((inv) => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === currentMonth;
      });
    } else if (rangePreset === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      list = list.filter((inv) => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        return d >= thirtyDaysAgo && d <= now;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((inv) => {
        const str = [
          inv.invoiceNumber,
          inv.customer?.name,
          inv.customer?.gstNumber,
          inv.customer?.contact,
          inv.paymentStatus
        ].filter(Boolean).join(' ').toLowerCase();
        return str.includes(q);
      });
    }

    return list;
  }, [allInvoices, rangePreset, selectedYear, currentMonth, searchQuery]);

  // Real-time aggregates
  const realtimeTotals = useMemo(() => {
    const bills = realtimeFilteredInvoices.length;
    const sales = realtimeFilteredInvoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0);
    const received = realtimeFilteredInvoices.reduce((s, i) => s + (i.totals?.received || 0), 0);
    const pending = sales - received;
    const taxable = realtimeFilteredInvoices.reduce((s, i) => s + (i.totals?.taxableAmount || (i.totals?.grandTotal ? i.totals.grandTotal - (i.gst?.total || 0) : 0)), 0);
    const cgst = realtimeFilteredInvoices.reduce((s, i) => s + (i.gst?.cgst || 0), 0);
    const sgst = realtimeFilteredInvoices.reduce((s, i) => s + (i.gst?.sgst || 0), 0);
    const gst = cgst + sgst;

    return { bills, sales, received, pending, taxable, cgst, sgst, gst };
  }, [realtimeFilteredInvoices]);

  const gstSummary = useMemo(() => {
    return monthlyData.map((m) => ({
      ...m,
      gstTotal: (m.cgst || 0) + (m.sgst || 0)
    }));
  }, [monthlyData]);

  const handleExportPDF = () => {
    if (realtimeFilteredInvoices.length === 0) {
      toast.error('No invoices to export for current filter');
      return;
    }
    exportBillingReportPDF(realtimeFilteredInvoices, {
      year: rangePreset === 'year' ? selectedYear : undefined,
      range: rangePreset !== 'year' ? rangePreset : undefined
    });
    toast.success('Executive PDF report downloaded');
  };

  const handleExportExcel = () => {
    if (realtimeFilteredInvoices.length === 0) {
      toast.error('No invoices to export for current filter');
      return;
    }
    exportBillingReportExcel(realtimeFilteredInvoices, {
      year: rangePreset === 'year' ? selectedYear : undefined
    });
    toast.success('Excel billing report downloaded');
  };

  return (
    <AnimatedPage className="page-container">
      {/* Header with Title & Quick Realtime Sync */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">Realtime Billing Report</h1>
            <span className="live-badge" style={{ fontSize: '11px', padding: '3px 8px' }}>
              <span className="live-dot" /> LIVE SYNC
            </span>
          </div>
          <p className="page-subtitle">Interactive sales, GST compliance & real-time revenue ledger</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh real-time data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Sync Live'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportExcel}>
            <FileSpreadsheet size={14} /> Excel Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExportPDF}>
            <FileText size={14} /> PDF Report
          </button>
        </div>
      </div>

      {/* Control Bar: Report Type Switcher & Time Presets */}
      <div className="report-controls-panel">
        <div className="report-tabs">
          <button
            className={`report-tab ${reportType === 'sales' ? 'report-tab-active' : ''}`}
            onClick={() => setReportType('sales')}
          >
            <BarChart3 size={15} /> Sales Overview
          </button>
          <button
            className={`report-tab ${reportType === 'gst' ? 'report-tab-active' : ''}`}
            onClick={() => setReportType('gst')}
          >
            <Receipt size={15} /> GST Breakdown
          </button>
          <button
            className={`report-tab ${reportType === 'ledger' ? 'report-tab-active' : ''}`}
            onClick={() => setReportType('ledger')}
          >
            <Layers size={15} /> Live Ledger ({realtimeFilteredInvoices.length})
          </button>
        </div>

        <div className="report-filter-row">
          <div className="report-range-pills">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.id}
                className={`report-range-btn ${rangePreset === p.id ? 'active' : ''}`}
                onClick={() => setRangePreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {rangePreset === 'year' && (
            <div className="report-year-select-wrap">
              <Calendar size={14} className="report-select-icon" />
              <select
                className="input report-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.length ? years.map((y) => <option key={y} value={y}>{y}</option>) : <option value={currentYear}>{currentYear}</option>}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="report-kpi-grid">
        {reportType === 'sales' && (
          <>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB' }}>
                <DollarSign size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Gross Revenue</span>
                <span className="report-kpi-value">{formatINR(realtimeTotals.sales)}</span>
                <span className="report-kpi-sub">{realtimeTotals.bills} invoices issued</span>
              </div>
            </div>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
                <CheckCircle2 size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Settled Amount</span>
                <span className="report-kpi-value" style={{ color: '#059669' }}>{formatINR(realtimeTotals.received)}</span>
                <span className="report-kpi-sub">
                  {realtimeTotals.sales > 0 ? `${Math.round((realtimeTotals.received / realtimeTotals.sales) * 100)}% collected` : '0%'}
                </span>
              </div>
            </div>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(220, 38, 38, 0.12)', color: '#DC2626' }}>
                <Clock size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Pending Balance</span>
                <span className="report-kpi-value" style={{ color: realtimeTotals.pending > 0 ? '#DC2626' : '#059669' }}>
                  {formatINR(realtimeTotals.pending)}
                </span>
                <span className="report-kpi-sub">
                  {realtimeTotals.pending > 0 ? 'Awaiting settlement' : 'Fully settled'}
                </span>
              </div>
            </div>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}>
                <Receipt size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Total GST Collected</span>
                <span className="report-kpi-value">{formatINR(realtimeTotals.gst)}</span>
                <span className="report-kpi-sub">CGST + SGST Combined</span>
              </div>
            </div>
          </>
        )}

        {reportType === 'gst' && (
          <>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB' }}>
                <DollarSign size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Taxable Amount</span>
                <span className="report-kpi-value">{formatINR(realtimeTotals.taxable)}</span>
                <span className="report-kpi-sub">Base billing value</span>
              </div>
            </div>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
                <Receipt size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Central GST (CGST)</span>
                <span className="report-kpi-value">{formatINR(realtimeTotals.cgst)}</span>
                <span className="report-kpi-sub">Central component</span>
              </div>
            </div>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4' }}>
                <Receipt size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">State GST (SGST)</span>
                <span className="report-kpi-value">{formatINR(realtimeTotals.sgst)}</span>
                <span className="report-kpi-sub">State component</span>
              </div>
            </div>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                <TrendingUp size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Total Tax Yield</span>
                <span className="report-kpi-value">{formatINR(realtimeTotals.gst)}</span>
                <span className="report-kpi-sub">Gross Tax Output</span>
              </div>
            </div>
          </>
        )}

        {reportType === 'ledger' && (
          <>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB' }}>
                <Layers size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Live Invoices</span>
                <span className="report-kpi-value">{realtimeFilteredInvoices.length}</span>
                <span className="report-kpi-sub">In current selection</span>
              </div>
            </div>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
                <CheckCircle2 size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Total Invoiced</span>
                <span className="report-kpi-value">{formatINR(realtimeTotals.sales)}</span>
                <span className="report-kpi-sub">Sum of all totals</span>
              </div>
            </div>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#D97706' }}>
                <Clock size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Received Today / Live</span>
                <span className="report-kpi-value">{formatINR(realtimeTotals.received)}</span>
                <span className="report-kpi-sub">Direct collections</span>
              </div>
            </div>
            <div className="report-kpi-card">
              <div className="report-kpi-icon" style={{ background: 'rgba(220, 38, 38, 0.12)', color: '#DC2626' }}>
                <TrendingUp size={20} />
              </div>
              <div className="report-kpi-info">
                <span className="report-kpi-label">Open Receivables</span>
                <span className="report-kpi-value" style={{ color: realtimeTotals.pending > 0 ? '#DC2626' : '#059669' }}>
                  {formatINR(realtimeTotals.pending)}
                </span>
                <span className="report-kpi-sub">Pending settlement</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Interactive Charts Section (Visible for Sales and GST views) */}
      {reportType !== 'ledger' && (
        <div className="card dashboard-card">
          <div className="card-header">
            <div>
              <h3>{reportType === 'sales' ? 'Monthly Revenue Velocity' : 'Monthly Tax Distribution'}</h3>
              <p className="page-subtitle" style={{ margin: '2px 0 0', fontSize: '12px' }}>
                Year {selectedYear} monthly trends
              </p>
            </div>
            <span className="header-badge" style={{ color: '#0F172A', background: 'var(--table-head-bg)', border: '1px solid var(--card-border)' }}>
              {selectedYear}
            </span>
          </div>
          <div className="card-body chart-container" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height={290}>
              {reportType === 'sales' ? (
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--table-border-strong)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--app-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--app-muted)' }} tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value, name) => [formatINR(value), name === 'sales' ? 'Gross Sales' : 'Settled Received']}
                    contentStyle={{ borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '12px', background: 'var(--card-bg)', color: 'var(--page-title)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" name="sales" />
                  <Area type="monotone" dataKey="received" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#recGrad)" name="received" />
                </AreaChart>
              ) : (
                <BarChart data={gstSummary} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--table-border-strong)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--app-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--app-muted)' }} tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value, name) => [formatINR(value), name]}
                    contentStyle={{ borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '12px', background: 'var(--card-bg)', color: 'var(--page-title)' }}
                  />
                  <Bar dataKey="cgst" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="CGST" />
                  <Bar dataKey="sgst" fill="#06B6D4" radius={[4, 4, 0, 0]} name="SGST" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Data Breakdown: Monthly Summary OR Real-time Ledger */}
      {reportType !== 'ledger' ? (
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Monthly Breakdown — {selectedYear}</h3>
              <p className="page-subtitle" style={{ margin: '2px 0 0', fontSize: '12px' }}>
                Tabular overview of monthly gross, tax, and settlement figures
              </p>
            </div>
            <span className="report-stat-count">{monthlyData.length} Months Tracked</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-center">Bills</th>
                    <th className="text-right">Sales</th>
                    <th className="text-right">Taxable</th>
                    <th className="text-right">CGST</th>
                    <th className="text-right">SGST</th>
                    <th className="text-right">Total GST</th>
                    <th className="text-right">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {gstSummary.map((m) => (
                    <tr key={m.month}>
                      <td className="cell-bold">{m.fullName}</td>
                      <td className="text-center">{m.bills}</td>
                      <td className="text-right cell-mono">{formatINR(m.sales)}</td>
                      <td className="text-right cell-mono">{formatINR(m.taxable)}</td>
                      <td className="text-right cell-mono">{formatINR(m.cgst)}</td>
                      <td className="text-right cell-mono">{formatINR(m.sgst)}</td>
                      <td className="text-right cell-mono">{formatINR(m.gst)}</td>
                      <td className="text-right cell-mono" style={{ color: '#059669', fontWeight: 600 }}>{formatINR(m.received)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td className="cell-bold">ANNUAL TOTAL</td>
                    <td className="text-center cell-bold">{realtimeTotals.bills}</td>
                    <td className="text-right cell-mono cell-bold">{formatINR(realtimeTotals.sales)}</td>
                    <td className="text-right cell-mono cell-bold">{formatINR(realtimeTotals.taxable)}</td>
                    <td className="text-right cell-mono cell-bold">{formatINR(realtimeTotals.cgst)}</td>
                    <td className="text-right cell-mono cell-bold">{formatINR(realtimeTotals.sgst)}</td>
                    <td className="text-right cell-mono cell-bold">{formatINR(realtimeTotals.gst)}</td>
                    <td className="text-right cell-mono cell-bold" style={{ color: '#059669' }}>{formatINR(realtimeTotals.received)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Real-time Live Ledger View */
        <div className="card">
          <div className="table-controls">
            <div className="search-input-wrapper">
              <Search size={16} className="search-input-icon" />
              <input
                type="text"
                className="input search-input"
                placeholder="Search by invoice number, guest name, GST number, or payment status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="report-stat-count">
              Showing {realtimeFilteredInvoices.length} transaction(s)
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>GSTIN</th>
                  <th className="text-center">Guests</th>
                  <th className="text-right">Gross Total</th>
                  <th className="text-right">Received</th>
                  <th className="text-right">Balance</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {realtimeFilteredInvoices.map((inv) => (
                  <tr key={inv._id || inv.id}>
                    <td className="cell-mono cell-bold" style={{ color: 'var(--primary)' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td>{formatDateDDMMYYYY(inv.invoiceDate)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{inv.customer?.name || '—'}</span>
                        {inv.customer?.contact && (
                          <span style={{ fontSize: '11px', color: 'var(--app-muted)' }}>{inv.customer.contact}</span>
                        )}
                      </div>
                    </td>
                    <td className="cell-mono" style={{ fontSize: '11.5px' }}>{inv.customer?.gstNumber || '—'}</td>
                    <td className="text-center">{(inv.membersCount || 0) + (inv.childCount || 0) + (inv.freeCount || 0)}</td>
                    <td className="text-right cell-mono cell-bold">{formatINR(inv.totals?.grandTotal)}</td>
                    <td className="text-right cell-mono" style={{ color: '#059669' }}>{formatINR(inv.totals?.received)}</td>
                    <td className="text-right cell-mono" style={{ color: (inv.totals?.balance || 0) > 0 ? '#DC2626' : 'var(--app-muted)' }}>
                      {formatINR(inv.totals?.balance)}
                    </td>
                    <td className="text-center">
                      <StatusBadge status={inv.paymentStatus} />
                    </td>
                  </tr>
                ))}
                {realtimeFilteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-row">
                      No invoices found matching the current live filter.
                    </td>
                  </tr>
                )}
                {realtimeFilteredInvoices.length > 0 && (
                  <tr className="total-row">
                    <td colSpan={5} className="cell-bold">FILTERED TOTALS ({realtimeFilteredInvoices.length} INVOICES)</td>
                    <td className="text-right cell-mono cell-bold">{formatINR(realtimeTotals.sales)}</td>
                    <td className="text-right cell-mono cell-bold" style={{ color: '#059669' }}>{formatINR(realtimeTotals.received)}</td>
                    <td className="text-right cell-mono cell-bold" style={{ color: realtimeTotals.pending > 0 ? '#DC2626' : 'inherit' }}>
                      {formatINR(realtimeTotals.pending)}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}
