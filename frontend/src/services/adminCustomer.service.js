import api from './api';

export async function listCustomers(params = {}) {
  const { data } = await api.get('/admin/customers', { params });
  return data;
}

export async function activateCustomer(id) {
  await api.post(`/admin/customers/${id}/activate`);
}

export async function deactivateCustomer(id) {
  await api.post(`/admin/customers/${id}/deactivate`);
}

export async function blockCustomer(id) {
  await api.post(`/admin/customers/${id}/block`);
}
