import api from './api';

export async function listRoles() {
  const { data } = await api.get('/admin/roles');
  return data.data;
}

export async function getRole(id) {
  const { data } = await api.get(`/admin/roles/${id}`);
  return data.data;
}

export async function listPermissionsCatalog() {
  const { data } = await api.get('/admin/roles/permissions');
  return data.data;
}

export async function createRole(payload) {
  const { data } = await api.post('/admin/roles', payload);
  return data.data;
}

export async function updateRole(id, payload) {
  await api.put(`/admin/roles/${id}`, payload);
}

export async function cloneRole(id) {
  await api.post(`/admin/roles/${id}/clone`);
}

export async function deleteRole(id) {
  await api.delete(`/admin/roles/${id}`);
}
