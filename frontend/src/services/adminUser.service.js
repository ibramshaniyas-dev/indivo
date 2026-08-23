import api from './api';

export async function listAdmins() {
  const { data } = await api.get('/admin/users');
  return data.data;
}

export async function createAdmin(payload) {
  const { data } = await api.post('/admin/users', payload);
  return data.data;
}

export async function updateAdmin(id, payload) {
  await api.put(`/admin/users/${id}`, payload);
}

export async function resetAdminPassword(id, password) {
  await api.post(`/admin/users/${id}/reset-password`, { password });
}

export async function forceLogoutAdmin(id) {
  await api.post(`/admin/users/${id}/force-logout`);
}
