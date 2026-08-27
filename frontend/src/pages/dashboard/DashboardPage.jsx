import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, DollarSign, CheckCircle2, Clock, Receipt, TrendingUp,
  Calendar, BarChart3, FilePlus2, History, Users, ArrowRight,
  Sparkles, RefreshCw, ShieldAlert
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import * as api from '../../services/apiService';
import { formatINR, formatDateDDMMYYYY } from '../../utils/format';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AnimatedPage } from '../../components/common/AnimatedPage';

const STAT_CARDS = [
  { key: 'totalBills', label: 'Total Invoices', icon: FileText, format: false, color: '#2563EB', sub: 'Issued bills' },
  { key: 'totalSales', label: 'Gross Revenue', icon: DollarSign, format: true, color: '#0F172A', sub: 'Total billing value' },
  { key: 'totalReceived', label: 'Collected', icon: CheckCircle2, format: true, color: '#059669', sub: 'Settled payments' },
  { key: 'totalPending', label: 'Pending Balance', icon: Clock, format: true, color: '#DC2626', sub: 'Awaiting clearance' },
  { key: 'totalGST', label: 'GST Collected', icon: Receipt, format: true, color: '#6366F1', sub: 'Tax liability yield' },
  { key: 'thisMonthSales', label: 'This Month', icon: TrendingUp, format: true, color: '#0284C7', sub: 'Current month total' },
  { key: 'thisYearSales', label: 'This Year', icon: Calendar, format: true, color: '#D97706', sub: 'Year-to-date total' },
  { key: 'avgBill', label: 'Average Ticket', icon: BarChart3, format: true, color: '#8B5CF6', sub: 'Per invoice average' }
];

const QUICK_ACTIONS = [
  { label: 'Create New Bill', desc: 'Generate customer invoice', to: '/create-bill', icon: FilePlus2, color: '#2563EB' },
  { label: 'Billing History', desc: 'Search & manage invoices', to: '/history', icon: History, color: '#059669' },
  { label: 'Analytics Reports', desc: 'Sales, GST & Live ledger', to: '/reports', icon: BarChart3, color: '#8B5CF6' },
  { label: 'Guest Directory', desc: 'Customer accounts & history', to: '/customers', icon: Users, color: '#0284C7' }
];

const DATE_SHORTCUTS = [
  { label: 'Today', key: 'today' },
  { label: 'This Week', key: 'thisWeek' },
  { label: 'This Month', key: 'thisMonth' },
  { label: 'This Year', key: 'thisYear' },
  { label: 'All Time', key: 'all' }
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDateRange(shortcut) {
  const now = new Date();
  const start = new Date(now);
  switch (shortcut) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: now.toISOString() };
    case 'thisWeek':
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: now.toISOString() };
    case 'thisMonth':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: now.toISOString() };
    case 'thisYear':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: now.toISOString() };
    default:
      return null;
  }
}

const PIE_COLORS = ['#059669', '#D97706', '#DC2626'];

/* ---------- MODERN DEDICATED SKELETON LOADER ---------- */
function DashboardSkeleton() {
  return (
    <div className="db-page db-skeleton-wrap">
      {/* Header Skeleton */}
      <div className="db-skeleton-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton-pulse" style={{ height: '20px', width: '180px' }} />
          <div className="skeleton-pulse" style={{ height: '32px', width: '280px' }} />
          <div className="skeleton-pulse" style={{ height: '14px', width: '320px' }} />
        </div>
        <div className="skeleton-pulse" style={{ height: '38px', width: '340px', borderRadius: '10px' }} />
      </div>

      {/* 8-Card KPI Grid Skeleton */}
      <div className="db-stats-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="db-skeleton-stat-card">
            <div className="skeleton-pulse db-skeleton-circle" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="skeleton-pulse" style={{ height: '12px', width: '50%' }} />
              <div className="skeleton-pulse" style={{ height: '22px', width: '75%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Dual Chart Row Skeleton */}
      <div className="db-charts-row">
        <div className="db-card" style={{ height: '380px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div className="skeleton-pulse" style={{ height: '18px', width: '160px' }} />
            <div className="skeleton-pulse" style={{ height: '18px', width: '60px' }} />
          </div>
          <div className="skeleton-pulse" style={{ height: '270px', width: '100%', borderRadius: '10px' }} />
        </div>

        <div className="db-card" style={{ height: '380px', padding: '20px' }}>
          <div className="skeleton-pulse" style={{ height: '18px', width: '140px', marginBottom: '24px' }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div className="skeleton-pulse" style={{ width: '140px', height: '140px', borderRadius: '50%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="skeleton-pulse" style={{ height: '18px', width: '100%' }} />
            <div className="skeleton-pulse" style={{ height: '18px', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="db-actions-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="db-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="skeleton-pulse" style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton-pulse" style={{ height: '14px', width: '70%' }} />
              <div className="skeleton-pulse" style={{ height: '10px', width: '45%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Row Skeleton */}
      <div className="db-bottom-row">
        <div className="db-card" style={{ height: '320px', padding: '20px' }}>
          <div className="skeleton-pulse" style={{ height: '18px', width: '120px', marginBottom: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-pulse" style={{ height: '40px', width: '100%' }} />
            ))}
          </div>
        </div>
        <div className="db-card" style={{ height: '320px', padding: '20px' }}>
          <div className="skeleton-pulse" style={{ height: '18px', width: '140px', marginBottom: '16px' }} />
          <div className="skeleton-pulse" style={{ height: '220px', width: '100%' }} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [dateShortcut, setDateShortcut] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalBills: 0, totalSales: 0, totalReceived: 0, totalPending: 0,
    totalGST: 0, thisMonthSales: 0, thisYearSales: 0, avgBill: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [paymentData, setPaymentData] = useState({
    paid: { amount: 0, count: 0 },
    partial: { amount: 0, count: 0 },
    unpaid: { amount: 0, count: 0 }
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [activities, setActivities] = useState([]);

  const currentYear = new Date().getFullYear();
  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, monthlyRes, paymentRes, invoicesRes, activitiesRes] = await Promise.all([
          api.getDashboardStats(),
          api.getMonthlyStats(currentYear),
          api.getPaymentStats(),
          api.getInvoices(),
          api.getActivities(10)
        ]);
        if (!cancelled) {
          setStats(statsRes || {});
          setMonthlyData(monthlyRes || []);
          setPaymentData(paymentRes || { paid: { amount: 0, count: 0 }, partial: { amount: 0, count: 0 }, unpaid: { amount: 0, count: 0 } });
          setAllInvoices(invoicesRes || []);
          setRecentInvoices((invoicesRes || []).slice(0, 8));
          setActivities(activitiesRes || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load dashboard metrics');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDashboardData();
    return () => { cancelled = true; };
  }, [currentYear]);

  const dateRange = useMemo(() => getDateRange(dateShortcut), [dateShortcut]);

  const filteredStats = useMemo(() => {
    if (!dateRange) return stats;
    const invoices = allInvoices.filter((inv) => {
      const d = new Date(inv.invoiceDate || inv.createdAt);
      return d >= new Date(dateRange.from) && d <= new Date(dateRange.to);
    });
    const totalSales = invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0);
    const totalReceived = invoices.reduce((s, i) => s + (i.totals?.received || 0), 0);
    return {
      totalBills: invoices.length,
      totalSales,
      totalReceived,
      totalPending: totalSales - totalReceived,
      totalGST: invoices.reduce((s, i) => s + (i.gst?.total || 0), 0),
      thisMonthSales: stats.thisMonthSales,
      thisYearSales: stats.thisYearSales,
      avgBill: invoices.length > 0 ? totalSales / invoices.length : 0
    };
  }, [dateRange, stats, allInvoices]);

  const totalPaymentValue = useMemo(() => {
    return (paymentData.paid.amount || 0) + (paymentData.partial.amount || 0) + (paymentData.unpaid.amount || 0);
  }, [paymentData]);

  const collectionPercent = useMemo(() => {
    if (totalPaymentValue === 0) return 0;
    return Math.round(((paymentData.paid.amount || 0) / totalPaymentValue) * 100);
  }, [totalPaymentValue, paymentData.paid.amount]);

  const pieData = useMemo(() => [
    { name: 'Paid', value: paymentData.paid.amount || 0, count: paymentData.paid.count || 0, color: '#059669' },
    { name: 'Partial', value: paymentData.partial.amount || 0, count: paymentData.partial.count || 0, color: '#D97706' },
    { name: 'Unpaid', value: paymentData.unpaid.amount || 0, count: paymentData.unpaid.count || 0, color: '#DC2626' }
  ].filter((d) => d.value > 0), [paymentData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="db-page">
        <div className="db-error">
          <div className="db-error-icon">
            <ShieldAlert size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Unable to load dashboard</h2>
          <p style={{ margin: 0, color: 'var(--app-muted)' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (stats.totalBills === 0 && allInvoices.length === 0) {
    return (
      <div className="db-page">
        <div className="db-empty">
          <div className="db-empty-icon">
            <FileText size={40} />
          </div>
          <h2>Welcome to Moon Light Resort!</h2>
          <p>No invoices have been recorded yet. Start by generating your first customer invoice.</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-bill')}>
            <FilePlus2 size={16} /> Create First Invoice
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage className="db-page">
      {/* Hero Header */}
      <div className="db-header">
        <div className="db-header-left">
          <div className="db-greeting-badge">
            <Sparkles size={13} /> {greeting}, Management Team
          </div>
          <h1 className="db-title">Executive Operations Hub</h1>
          <p className="db-subtitle">Live resort billing metrics, revenue trends & financial settlements</p>
        </div>

        <div className="db-header-right">
          <div className="db-date-filters">
            {DATE_SHORTCUTS.map((s) => (
              <button
                key={s.key}
                className={`db-date-btn ${dateShortcut === s.key ? 'db-date-btn-active' : ''}`}
                onClick={() => setDateShortcut(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-bill')}>
            <FilePlus2 size={15} /> New Invoice
          </button>
        </div>
      </div>

      {/* 8-Card KPI Grid */}
      <div className="db-stats-grid">
        {STAT_CARDS.map(({ key, label, icon: Icon, format, color }) => (
          <div key={key} className="db-stat-card" style={{ '--stat-accent': color }}>
            <div className="db-stat-icon" style={{ background: `${color}14`, color }}>
              <Icon size={20} />
            </div>
            <div className="db-stat-info">
              <span className="db-stat-label">{label}</span>
              <span className="db-stat-value">{format ? formatINR(filteredStats[key] || 0) : (filteredStats[key] || 0)}</span>
            </div>
            <div className="db-stat-accent-bar" style={{ background: color }} />
          </div>
        ))}
      </div>

      {/* Dual Analytics Row: Revenue Velocity & Payment Health */}
      <div className="db-charts-row">
        {/* Monthly Revenue Velocity */}
        <div className="db-card db-chart-card">
          <div className="db-card-header">
            <div className="db-card-header-left">
              <h3>Monthly Revenue Velocity</h3>
              <span className="db-card-header-sub">Gross billing trend across year {currentYear}</span>
            </div>
            <span className="db-card-badge">{currentYear} Full Year</span>
          </div>
          <div className="db-card-body">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="dbBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="dbRecGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--table-border-strong)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--app-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--app-muted)' }} tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value, name) => [formatINR(value), name === 'sales' ? 'Gross Revenue' : 'Settled Amount']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '12px', background: 'var(--card-bg)', color: 'var(--page-title)' }}
                />
                <Bar dataKey="sales" fill="url(#dbBarGrad)" radius={[5, 5, 0, 0]} name="sales" />
                <Bar dataKey="received" fill="url(#dbRecGrad)" radius={[5, 5, 0, 0]} name="received" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Health & Collection Status */}
        <div className="db-card db-payment-card">
          <div className="db-card-header">
            <div className="db-card-header-left">
              <h3>Settlement Health</h3>
              <span className="db-card-header-sub">Collections vs outstanding</span>
            </div>
            <span className="live-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>
              <span className="live-dot" /> {collectionPercent}% Settled
            </span>
          </div>
          <div className="db-card-body">
            {pieData.length > 0 ? (
              <div className="db-payment-content">
                <div className="db-payment-chart-wrap">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={74}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {pieData.map((d, i) => (
                          <Cell key={i} fill={d.color || PIE_COLORS[i % 3]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatINR(value)}
                        contentStyle={{ borderRadius: '10px', fontSize: '12px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="db-payment-center-label">
                    <span className="db-payment-center-val">{collectionPercent}%</span>
                    <span className="db-payment-center-sub">Collected</span>
                  </div>
                </div>

                {/* Progress Breakdown Bars */}
                <div className="db-payment-progress-list">
                  {[
                    { label: 'Paid in Full', amount: paymentData.paid.amount, count: paymentData.paid.count, color: '#059669' },
                    { label: 'Partial Advance', amount: paymentData.partial.amount, count: paymentData.partial.count, color: '#D97706' },
                    { label: 'Unpaid / Pending', amount: paymentData.unpaid.amount, count: paymentData.unpaid.count, color: '#DC2626' }
                  ].map((p) => {
                    const pct = totalPaymentValue > 0 ? Math.round((p.amount / totalPaymentValue) * 100) : 0;
                    return (
                      <div key={p.label} className="db-payment-progress-row">
                        <div className="db-payment-progress-meta">
                          <span className="db-payment-progress-name">
                            <span className="db-payment-progress-dot" style={{ background: p.color }} />
                            {p.label} ({p.count})
                          </span>
                          <span className="db-payment-progress-amount">{formatINR(p.amount)}</span>
                        </div>
                        <div className="db-progress-track">
                          <div className="db-progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="db-no-data">No payment transactions recorded</div>
            )}
          </div>
        </div>
      </div>

      {/* Executive Quick Actions */}
      <div className="db-actions-grid">
        {QUICK_ACTIONS.map(({ label, desc, to, icon: Icon, color }) => (
          <button
            key={to}
            className="db-action-btn"
            onClick={() => navigate(to)}
            style={{ '--action-color': color }}
          >
            <div className="db-action-icon" style={{ background: `${color}14`, color }}>
              <Icon size={22} />
            </div>
            <div className="db-action-text">
              <span className="db-action-label">{label}</span>
              <span className="db-action-desc">{desc}</span>
            </div>
            <ArrowRight size={16} className="db-action-arrow" />
          </button>
        ))}
      </div>

      {/* Bottom Row: Activity Feed & Recent Invoices Table */}
      <div className="db-bottom-row">
        {/* Recent Activity Audit */}
        <div className="db-card">
          <div className="db-card-header">
            <h3>Recent Audit Activity</h3>
            <span className="db-card-badge">{activities.length} logs</span>
          </div>
          <div className="db-card-body db-card-body-scroll">
            {activities.length > 0 ? (
              <div className="db-activity-list">
                {activities.slice(0, 7).map((act, idx) => (
                  <div key={act._id || act.id || idx} className="db-activity-item">
                    <div className="db-activity-dot" />
                    <div className="db-activity-content">
                      <span className="db-activity-type">{act.type}</span>
                      {act.customerName && <span className="db-activity-customer">{act.customerName}</span>}
                    </div>
                    <span className="db-activity-date">{formatDateDDMMYYYY(act.date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="db-no-data">No recent activity</div>
            )}
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="db-card">
          <div className="db-card-header">
            <h3>Recent Invoices</h3>
            <button className="db-view-all" onClick={() => navigate('/history')}>
              View All History <ArrowRight size={13} />
            </button>
          </div>
          <div className="db-card-body db-card-body-scroll" style={{ padding: 0 }}>
            <div className="db-bills-table-wrap">
              <table className="db-bills-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer Name</th>
                    <th>Date</th>
                    <th className="db-th-right">Amount</th>
                    <th className="db-th-center">Status</th>
                    <th className="db-th-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv._id || inv.id}>
                      <td className="db-td-mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ fontWeight: 500 }}>{inv.customer?.name || '—'}</td>
                      <td>{formatDateDDMMYYYY(inv.invoiceDate)}</td>
                      <td className="db-td-right db-td-mono" style={{ fontWeight: 700 }}>
                        {formatINR(inv.totals?.grandTotal)}
                      </td>
                      <td className="db-td-center">
                        <StatusBadge status={inv.paymentStatus} />
                      </td>
                      <td className="db-td-center">
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => navigate(`/history/${inv._id || inv.id}`)}
                          style={{ padding: '3px 8px', fontSize: '11.5px' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
