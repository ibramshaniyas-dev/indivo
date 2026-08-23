import api from './api';

export function persistSession({ user, accessToken, refreshToken }) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
}

export async function registerCustomer(payload) {
  const { data } = await api.post('/auth/register', payload);
  persistSession(data.data);
  return data.data.user;
}

/** Authenticates but does NOT persist the session — callers must verify the account belongs
 *  in their portal (userType / isSuperAdmin) before calling persistSession, so a customer
 *  can't end up with a lingering session from the admin login form, etc. */
export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data.data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.clear();
  }
}

export function getStoredUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}
