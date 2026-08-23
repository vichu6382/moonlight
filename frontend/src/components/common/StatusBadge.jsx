export function StatusBadge({ status }) {
  const config = {
    paid: { label: 'PAID', className: 'status-paid' },
    partial: { label: 'PARTIAL', className: 'status-partial' },
    unpaid: { label: 'UNPAID', className: 'status-unpaid' }
  };
  const { label, className } = config[status] || config.unpaid;
  return (
    <span className={`status-badge ${className}`}>
      <span className="status-badge-dot" />
      {label}
    </span>
  );
}
