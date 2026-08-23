export function formatINR(amount) {
  const n = Number(amount) || 0;
  const digits = n % 1 === 0 ? 0 : 2;
  return (
    'Rs ' +
    new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: 2
    }).format(n)
  );
}

export function formatINR2(amount) {
  const n = Number(amount) || 0;
  return (
    'Rs ' +
    new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n)
  );
}

export function formatNumber(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(n) || 0);
}

export function toISODate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString().slice(0, 10);
}

export function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nextInvoiceNumber(seq) {
  const year = new Date().getFullYear();
  return `MLR-${year}-${String(seq).padStart(4, '0')}`;
}

export function sanitizeFileName(name) {
  const cleaned = String(name || '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, 40);
}

export function downloadFileName(invoiceNumber, customerName, ext) {
  const customer = sanitizeFileName(customerName);
  const base = `Moon-Light-Resort-Invoice-${invoiceNumber}`;
  return customer ? `${base}-${customer}.${ext}` : `${base}.${ext}`;
}