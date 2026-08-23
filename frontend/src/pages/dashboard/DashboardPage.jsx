import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, DollarSign, CheckCircle, Clock, Receipt, TrendingUp,
  Calendar, BarChart3, FilePlus2, History, Users, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as api from '../../services/apiService';
import { formatINR, formatDateDDMMYYYY } from '../../utils/format';
import { StatusBadge } from '../../components/common/StatusBadge';

const STAT_CARDS = [
  { key: 'totalBills', label: 'Total Bills', icon: FileText, format: false, color: '#4F46E5' },
  { key: 'totalSales', label: 'Total Sales', icon: DollarSign, format: true, color: '#059669' },
  { key: 'totalReceived', label: 'Received', icon: CheckCircle, format: true, color: '#10B981' },
  { key: 'totalPending', label: 'Pending', icon: Clock, format: true, color: '#F59E0B' },
  { key: 'totalGST', label: 'GST Collected', icon: Receipt, format: true, color: '#8B5CF6' },
  { key: 'thisMonthSales', label: 'This Month', icon: TrendingUp, format: true, color: '#0EA5E9' },
  { key: 'thisYearSales', label: 'This Year', icon: Calendar, format: true, color: '#EC4899' },
  { key: 'avgBill', label: 'Avg Bill', icon: BarChart3, format: true, color: '#6366F1' }
];

const QUICK_ACTIONS = [
  { label: 'Create New Bill', to: '/create-bill', icon: FilePlus2, color: '#4F46E5' },
  { label: 'View History', to: '/history', icon: History, color: '#059669' },
  { label: 'Reports', to: '/reports', icon: BarChart3, color: '#8B5CF6' },
  { label: 'Customers', to: '/customers', icon: Users, color: '#0EA5E9' }
];

const DATE_SHORTCUTS = [
  { label: 'Today', key: 'today' },
  { label: 'This Week', key: 'thisWeek' },
  { label: 'This Month', key: 'thisMonth' },
  { label: 'This Year', key: 'thisYear' },
  { label: 'All Time', key: 'all' }
];

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

const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export function DashboardPage() {
  const navigate = useNavigate();
  const [dateShortcut, setDateShortcut] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({ totalBills: 0, totalSales: 0, totalReceived: 0, totalPending: 0, totalGST: 0, thisMonthSales: 0, thisYearSales: 0, avgBill: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [paymentData, setPaymentData] = useState({ paid: { amount: 0, count: 0 }, partial: { amount: 0, count: 0 }, unpaid: { amount: 0, count: 0 } });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [activities, setActivities] = useState([]);

  const currentYear = new Date().getFullYear();

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
          setStats(statsRes);
          setMonthlyData(monthlyRes);
          setPaymentData(paymentRes);
          setAllInvoices(invoicesRes);
          setRecentInvoices(invoicesRes.slice(0, 10));
          setActivities(activitiesRes);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load dashboard data');
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
    return {
      totalBills: invoices.length,
      totalSales: invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0),
      totalReceived: invoices.reduce((s, i) => s + (i.totals?.received || 0), 0),
      totalPending: invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0) - invoices.reduce((s, i) => s + (i.totals?.received || 0), 0),
      totalGST: invoices.reduce((s, i) => s + (i.gst?.total || 0), 0),
      thisMonthSales: stats.thisMonthSales,
      thisYearSales: stats.thisYearSales,
      avgBill: invoices.length > 0 ? invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0) / invoices.length : 0
    };
  }, [dateRange, stats, allInvoices]);

  const pieData = [
    { name: 'Paid', value: paymentData.paid.amount },
    { name: 'Partial', value: paymentData.partial.amount },
    { name: 'Unpaid', value: paymentData.unpaid.amount }
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="db-page">
        <div className="db-loading">
          <div className="db-loading-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="db-page">
        <div className="db-error">
          <div className="db-error-icon">!</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (stats.totalBills === 0) {
    return (
      <div className="db-page">
        <div className="db-empty">
          <div className="db-empty-icon">
            <FileText size={40} />
          </div>
          <h2>No invoices yet</h2>
          <p>Create your first bill to get started with the billing system.</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-bill')}>
            <FilePlus2 size={16} /> Create New Bill
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="db-page">
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1 className="db-title">Dashboard</h1>
          <span className="db-subtitle">Welcome back! Here's your billing overview.</span>
        </div>
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
      </div>

      {/* Stat Cards */}
      <div className="db-stats-grid">
        {STAT_CARDS.map(({ key, label, icon: Icon, format, color }) => (
          <div key={key} className="db-stat-card" style={{ '--stat-accent': color }}>
            <div className="db-stat-icon" style={{ background: `${color}18`, color }}>
              <Icon size={20} />
            </div>
            <div className="db-stat-info">
              <span className="db-stat-label">{label}</span>
              <span className="db-stat-value">{format ? formatINR(filteredStats[key]) : filteredStats[key]}</span>
            </div>
            <div className="db-stat-accent-bar" style={{ background: color }} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="db-charts-row">
        {/* Revenue Chart */}
        <div className="db-card db-chart-card">
          <div className="db-card-header">
            <h3>Monthly Revenue</h3>
            <span className="db-card-badge">{currentYear}</span>
          </div>
          <div className="db-card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border, #E0E0E0)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--app-muted, #757575)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--app-muted, #757575)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [formatINR(value), 'Revenue']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid var(--card-border, #E0E0E0)', fontSize: '12px', background: 'var(--card-bg, #fff)', color: 'var(--page-title, #212121)' }}
                  cursor={{ fill: 'rgba(79, 70, 229, 0.06)' }}
                />
                <Bar dataKey="sales" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status */}
        <div className="db-card db-payment-card">
          <div className="db-card-header">
            <h3>Payment Status</h3>
          </div>
          <div className="db-card-body">
            {pieData.length > 0 ? (
              <div className="db-payment-content">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % 3]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatINR(value)} contentStyle={{ borderRadius: '10px', fontSize: '12px', background: 'var(--card-bg, #fff)', border: '1px solid var(--card-border, #E0E0E0)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="db-payment-legend">
                  {[
                    { name: 'Paid', count: paymentData.paid.count, color: '#10B981' },
                    { name: 'Partial', count: paymentData.partial.count, color: '#F59E0B' },
                    { name: 'Unpaid', count: paymentData.unpaid.count, color: '#EF4444' }
                  ].filter(d => d.count > 0).map((d) => (
                    <div key={d.name} className="db-legend-item">
                      <span className="db-legend-dot" style={{ background: d.color }} />
                      <span className="db-legend-label">{d.name}</span>
                      <span className="db-legend-count">{d.count} bills</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="db-no-data">No payment data</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="db-card">
        <div className="db-card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="db-card-body">
          <div className="db-actions-grid">
            {QUICK_ACTIONS.map(({ label, to, icon: Icon, color }) => (
              <button key={to} className="db-action-btn" onClick={() => navigate(to)} style={{ '--action-color': color }}>
                <div className="db-action-icon" style={{ background: `${color}15`, color }}>
                  <Icon size={20} />
                </div>
                <span className="db-action-label">{label}</span>
                <ArrowRight size={14} className="db-action-arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Activity + Bills */}
      <div className="db-bottom-row">
        {/* Recent Activity */}
        <div className="db-card">
          <div className="db-card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="db-card-body db-card-body-scroll">
            {activities.length > 0 ? (
              <div className="db-activity-list">
                {activities.slice(0, 8).map((act, idx) => (
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

        {/* Recent Bills */}
        <div className="db-card">
          <div className="db-card-header">
            <h3>Recent Bills</h3>
            <button className="db-view-all" onClick={() => navigate('/history')}>
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="db-card-body db-card-body-scroll">
            <div className="db-bills-table-wrap">
              <table className="db-bills-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th className="db-th-right">Amount</th>
                    <th className="db-th-center">Status</th>
                    <th className="db-th-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv._id || inv.id}>
                      <td className="db-td-mono">{inv.invoiceNumber}</td>
                      <td>{inv.customer?.name || '—'}</td>
                      <td>{formatDateDDMMYYYY(inv.invoiceDate)}</td>
                      <td className="db-td-right">{formatINR(inv.totals?.grandTotal)}</td>
                      <td className="db-td-center">
                        <StatusBadge status={inv.paymentStatus} />
                      </td>
                      <td className="db-td-center">
                        <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/history/${inv._id || inv.id}`)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
