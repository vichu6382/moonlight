import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, FileSpreadsheet, FileText, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as api from '../../services/apiService';
import { filterInvoices } from '../../utils/invoiceHelpers';
import { formatINR } from '../../utils/format';
import { exportBillingReportPDF } from '../../utils/billingReportExport';
import { exportBillingReportExcel } from '../../utils/billingReportExcel';
import toast from 'react-hot-toast';

export function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [reportType, setReportType] = useState('sales');
  const [years, setYears] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchYears() {
      try {
        const y = await api.getAvailableYears();
        if (!cancelled) setYears(y);
      } catch { if (!cancelled) setYears([]); }
    }
    fetchYears();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchMonthly() {
      try {
        setLoading(true);
        const [monthly, invoices] = await Promise.all([
          api.getMonthlyStats(selectedYear),
          api.getInvoices()
        ]);
        if (!cancelled) {
          setMonthlyData(monthly);
          setAllInvoices(invoices);
        }
      } catch {
        if (!cancelled) setMonthlyData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMonthly();
    return () => { cancelled = true; };
  }, [selectedYear]);

  const gstSummary = useMemo(() => {
    return monthlyData.map((m) => ({
      ...m,
      gstTotal: m.cgst + m.sgst
    }));
  }, [monthlyData]);

  const yearTotals = useMemo(() => ({
    sales: monthlyData.reduce((s, m) => s + m.sales, 0),
    received: monthlyData.reduce((s, m) => s + m.received, 0),
    bills: monthlyData.reduce((s, m) => s + m.bills, 0),
    taxable: monthlyData.reduce((s, m) => s + m.taxable, 0),
    cgst: monthlyData.reduce((s, m) => s + m.cgst, 0),
    sgst: monthlyData.reduce((s, m) => s + m.sgst, 0),
    gst: monthlyData.reduce((s, m) => s + m.gst, 0)
  }), [monthlyData]);

  const handleExportPDF = () => {
    const invoices = filterInvoices(allInvoices, { year: String(selectedYear) });
    if (invoices.length === 0) { toast.error('No data to export'); return; }
    exportBillingReportPDF(invoices, { year: selectedYear });
    toast.success('PDF report downloaded');
  };

  const handleExportExcel = () => {
    const invoices = filterInvoices(allInvoices, { year: String(selectedYear) });
    if (invoices.length === 0) { toast.error('No data to export'); return; }
    exportBillingReportExcel(invoices, { year: selectedYear });
    toast.success('Excel report downloaded');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Sales, GST, and payment reports</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-green btn-sm" onClick={handleExportExcel}>
            <FileSpreadsheet size={14} /> Excel Report
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExportPDF}>
            <FileText size={14} /> PDF Report
          </button>
        </div>
      </div>

      <div className="report-controls">
        <div className="report-tabs">
          <button className={`report-tab ${reportType === 'sales' ? 'report-tab-active' : ''}`} onClick={() => setReportType('sales')}>
            <BarChart3 size={14} /> Sales Report
          </button>
          <button className={`report-tab ${reportType === 'gst' ? 'report-tab-active' : ''}`} onClick={() => setReportType('gst')}>
            <Download size={14} /> GST Report
          </button>
        </div>
        <select className="input" style={{ width: 'auto' }} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="report-summary-strip">
        {reportType === 'sales' ? (
          <>
            <div className="report-stat">
              <span className="report-stat-label">Total Bills</span>
              <span className="report-stat-value">{yearTotals.bills}</span>
            </div>
            <div className="report-stat">
              <span className="report-stat-label">Total Sales</span>
              <span className="report-stat-value">{formatINR(yearTotals.sales)}</span>
            </div>
            <div className="report-stat">
              <span className="report-stat-label">Received</span>
              <span className="report-stat-value" style={{ color: '#16A34A' }}>{formatINR(yearTotals.received)}</span>
            </div>
            <div className="report-stat">
              <span className="report-stat-label">Pending</span>
              <span className="report-stat-value" style={{ color: '#DC2626' }}>{formatINR(yearTotals.sales - yearTotals.received)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="report-stat">
              <span className="report-stat-label">Total Taxable</span>
              <span className="report-stat-value">{formatINR(yearTotals.taxable)}</span>
            </div>
            <div className="report-stat">
              <span className="report-stat-label">Total CGST</span>
              <span className="report-stat-value">{formatINR(yearTotals.cgst)}</span>
            </div>
            <div className="report-stat">
              <span className="report-stat-label">Total SGST</span>
              <span className="report-stat-value">{formatINR(yearTotals.sgst)}</span>
            </div>
            <div className="report-stat">
              <span className="report-stat-label">Total GST</span>
              <span className="report-stat-value">{formatINR(yearTotals.gst)}</span>
            </div>
          </>
        )}
      </div>

      <div className="card dashboard-card">
        <div className="card-header">
          <h3>{reportType === 'sales' ? 'Monthly Sales' : 'Monthly GST'} — {selectedYear}</h3>
        </div>
        <div className="card-body chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={reportType === 'sales' ? monthlyData : gstSummary} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [formatINR(value), reportType === 'sales' ? 'Sales' : 'GST']} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
              {reportType === 'sales' ? (
                <>
                  <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Sales" />
                  <Bar dataKey="received" fill="#10B981" radius={[4, 4, 0, 0]} name="Received" />
                </>
              ) : (
                <>
                  <Bar dataKey="cgst" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="CGST" />
                  <Bar dataKey="sgst" fill="#06B6D4" radius={[4, 4, 0, 0]} name="SGST" />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Monthly Summary — {selectedYear}</h3>
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
                    <td>{m.fullName}</td>
                    <td className="text-center">{m.bills}</td>
                    <td className="text-right cell-mono">{formatINR(m.sales)}</td>
                    <td className="text-right cell-mono">{formatINR(m.taxable)}</td>
                    <td className="text-right cell-mono">{formatINR(m.cgst)}</td>
                    <td className="text-right cell-mono">{formatINR(m.sgst)}</td>
                    <td className="text-right cell-mono">{formatINR(m.gst)}</td>
                    <td className="text-right cell-mono">{formatINR(m.received)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td className="cell-bold">Total</td>
                  <td className="text-center cell-bold">{yearTotals.bills}</td>
                  <td className="text-right cell-mono cell-bold">{formatINR(yearTotals.sales)}</td>
                  <td className="text-right cell-mono cell-bold">{formatINR(yearTotals.taxable)}</td>
                  <td className="text-right cell-mono cell-bold">{formatINR(yearTotals.cgst)}</td>
                  <td className="text-right cell-mono cell-bold">{formatINR(yearTotals.sgst)}</td>
                  <td className="text-right cell-mono cell-bold">{formatINR(yearTotals.gst)}</td>
                  <td className="text-right cell-mono cell-bold">{formatINR(yearTotals.received)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
