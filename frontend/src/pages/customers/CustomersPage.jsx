import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Eye } from 'lucide-react';
import * as api from '../../services/apiService';
import { formatINR, formatDateDDMMYYYY } from '../../utils/format';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchInput } from '../../components/common/SearchInput';

export function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchCustomers() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCustomerStats();
        if (!cancelled) setCustomers(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load customers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCustomers();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.contact.includes(q) ||
      c.gstNumber.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const selected = useMemo(() => {
    if (!selectedCustomer) return null;
    return customers.find((c) => c.name === selectedCustomer.name) || null;
  }, [customers, selectedCustomer]);

  if (loading) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Users}
          title="Loading customers..."
          message="Please wait while we fetch your customer data."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Users}
          title="Error loading customers"
          message={error}
          action="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Users}
          title="No customers yet"
          message="Customer data will appear here once you create invoices."
          action="Create New Bill"
          onAction={() => navigate('/create-bill')}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} customers total</p>
        </div>
      </div>

      <div className="card">
        <div className="table-controls">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customers by name, phone, or GST number..."
          />
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>GSTIN</th>
                <th className="text-center">Total Bills</th>
                <th className="text-right">Total Sales</th>
                <th className="text-right">Pending</th>
                <th>Last Invoice</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.name}>
                  <td className="cell-bold">{c.name}</td>
                  <td>{c.contact || '—'}</td>
                  <td className="cell-mono">{c.gstNumber || '—'}</td>
                  <td className="text-center">{c.totalBills}</td>
                  <td className="text-right cell-mono">{formatINR(c.totalSales)}</td>
                  <td className="text-right cell-mono" style={{ color: c.totalPending > 0 ? '#DC2626' : '#16A34A' }}>
                    {formatINR(c.totalPending)}
                  </td>
                  <td>{formatDateDDMMYYYY(c.lastInvoiceDate)}</td>
                  <td className="text-center">
                    <button className="icon-btn" title="View Profile" onClick={() => setSelectedCustomer(c)}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty-row">No customers match your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="customer-profile-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="customer-profile-panel" onClick={(e) => e.stopPropagation()}>
            <div className="customer-profile-header">
              <h2>{selected.name}</h2>
              <button className="icon-btn" onClick={() => setSelectedCustomer(null)}>✕</button>
            </div>
            <div className="customer-profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-label">Total Bills</span>
                <span className="profile-stat-value">{selected.totalBills}</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-label">Total Sales</span>
                <span className="profile-stat-value">{formatINR(selected.totalSales)}</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-label">Total Paid</span>
                <span className="profile-stat-value" style={{ color: '#16A34A' }}>{formatINR(selected.totalReceived)}</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-label">Pending</span>
                <span className="profile-stat-value" style={{ color: selected.totalPending > 0 ? '#DC2626' : '#16A34A' }}>{formatINR(selected.totalPending)}</span>
              </div>
            </div>
            <div className="customer-profile-info">
              {selected.contact && <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{selected.contact}</span></div>}
              {selected.gstNumber && <div className="detail-row"><span className="detail-label">GSTIN</span><span className="detail-value">{selected.gstNumber}</span></div>}
              {selected.address && <div className="detail-row"><span className="detail-label">Address</span><span className="detail-value">{selected.address}</span></div>}
              {selected.state && <div className="detail-row"><span className="detail-label">State</span><span className="detail-value">{selected.state}</span></div>}
            </div>
            <h3 className="profile-section-title">Invoice History</h3>
            <div className="profile-invoices">
              {selected.invoices.map((inv) => (
                <div key={inv._id || inv.id} className="profile-invoice-row" onClick={() => { setSelectedCustomer(null); navigate(`/history/${inv._id || inv.id}`); }}>
                  <div>
                    <span className="cell-mono">{inv.invoiceNumber}</span>
                    <span className="profile-invoice-date">{formatDateDDMMYYYY(inv.invoiceDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="cell-mono">{formatINR(inv.totals?.grandTotal)}</span>
                    <span className={`profile-invoice-status status-${inv.paymentStatus}`}>{inv.paymentStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
