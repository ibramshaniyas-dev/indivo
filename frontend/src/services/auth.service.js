import api from './api';

function persistSession({ user, accessToken, refreshToken }) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
}

export async function registerCustomer(payload) {
  const { data } = await api.post('/auth/register', payload);
  persistSession(data.data);
  return data.data.user;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  persistSession(data.data);
  return data.data.user;
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
