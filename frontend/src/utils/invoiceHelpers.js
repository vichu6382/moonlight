export function filterInvoices(invoices, filters) {
  let result = [...invoices];

  if (filters.year && filters.year !== 'all') {
    result = result.filter((inv) => {
      const d = new Date(inv.invoiceDate || inv.createdAt);
      return d.getFullYear() === Number(filters.year);
    });
  }

  if (filters.month && filters.month !== 'all') {
    result = result.filter((inv) => {
      const d = new Date(inv.invoiceDate || inv.createdAt);
      return d.getMonth() === Number(filters.month);
    });
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    result = result.filter((inv) => new Date(inv.invoiceDate || inv.createdAt) >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter((inv) => new Date(inv.invoiceDate || inv.createdAt) <= to);
  }

  if (filters.packageType && filters.packageType !== 'all') {
    result = result.filter((inv) => inv.package?.type === filters.packageType);
  }

  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    result = result.filter((inv) => inv.paymentStatus === filters.paymentStatus);
  }

  if (filters.gstApplicable !== undefined && filters.gstApplicable !== 'all') {
    if (filters.gstApplicable === 'yes') {
      result = result.filter((inv) => inv.gst?.rate > 0);
    } else {
      result = result.filter((inv) => !inv.gst?.rate || inv.gst.rate === 0);
    }
  }

  if (filters.minAmount) {
    result = result.filter((inv) => inv.totals?.grandTotal >= Number(filters.minAmount));
  }

  if (filters.maxAmount) {
    result = result.filter((inv) => inv.totals?.grandTotal <= Number(filters.maxAmount));
  }

  if (filters.customerName) {
    const q = filters.customerName.toLowerCase();
    result = result.filter((inv) => (inv.customer?.name || '').toLowerCase().includes(q));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((inv) => {
      const searchable = [
        inv.invoiceNumber,
        inv.customer?.name,
        inv.customer?.gstNumber,
        inv.customer?.contact,
        inv.id
      ].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(q);
    });
  }

  return result;
}

export function sortInvoices(invoices, sortField, sortDir) {
  if (!sortField) return invoices;
  const sorted = [...invoices];
  sorted.sort((a, b) => {
    let valA, valB;
    switch (sortField) {
      case 'invoiceNumber':
        valA = a.invoiceNumber || '';
        valB = b.invoiceNumber || '';
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      case 'date':
        valA = new Date(a.invoiceDate || a.createdAt).getTime();
        valB = new Date(b.invoiceDate || b.createdAt).getTime();
        break;
      case 'customer':
        valA = (a.customer?.name || '').toLowerCase();
        valB = (b.customer?.name || '').toLowerCase();
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      case 'grandTotal':
        valA = a.totals?.grandTotal || 0;
        valB = b.totals?.grandTotal || 0;
        break;
      case 'received':
        valA = a.totals?.received || 0;
        valB = b.totals?.received || 0;
        break;
      case 'balance':
        valA = a.totals?.balance || 0;
        valB = b.totals?.balance || 0;
        break;
      default:
        return 0;
    }
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });
  return sorted;
}
