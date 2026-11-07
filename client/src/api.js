const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken() { return localStorage.getItem('ida_token'); }
export function setSession(token, user) {
  localStorage.setItem('ida_token', token);
  localStorage.setItem('ida_user', JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem('ida_token');
  localStorage.removeItem('ida_user');
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem('ida_user') || 'null'); } catch { return null; }
}
export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

export async function apiDownload(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.detail || 'PDF download failed.');
  }

  return response.blob();
}