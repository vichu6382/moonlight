const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (res.status === 401 && !path.includes('/auth/me')) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (res.status === 401) {
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    const error = new Error(err.message || 'Request failed');
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export async function getMe() {
  return request('/auth/me');
}

export async function getInvoices() {
  return request('/invoices');
}

export async function getInvoiceById(id) {
  return request(`/invoices/${id}`);
}

export async function createInvoice(data) {
  return request('/invoices', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateInvoice(id, updates) {
  return request(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function deleteInvoice(id) {
  return request(`/invoices/${id}`, { method: 'DELETE' });
}

export async function searchInvoices(query) {
  return request(`/invoices/search?q=${encodeURIComponent(query)}`);
}

export async function getSequence() {
  return request('/invoices/sequence');
}

export async function getDashboardStats() {
  return request('/stats/dashboard');
}

export async function getMonthlyStats(year) {
  return request(`/stats/monthly/${year}`);
}

export async function getPaymentStats() {
  return request('/stats/payments');
}

export async function getAvailableYears() {
  return request('/stats/years');
}

export async function getCustomerStats() {
  return request('/customers');
}

export async function getActivities(limit = 20) {
  return request(`/activities?limit=${limit}`);
}

export async function getSettings() {
  return request('/settings');
}

export async function updateSettings(section, data) {
  return request('/settings', {
    method: 'PUT',
    body: JSON.stringify({ section, data })
  });
}

export async function resetSettings() {
  return request('/settings/reset', { method: 'POST' });
}

export async function exportBackup() {
  return request('/backup/export');
}

export async function importBackup(data, password, confirmOverwrite) {
  return request('/backup/import', {
    method: 'POST',
    body: JSON.stringify({ data, password, confirmOverwrite })
  });
}

export async function clearAllData(password) {
  return request('/backup/clear', {
    method: 'DELETE',
    body: JSON.stringify({ password })
  });
}
