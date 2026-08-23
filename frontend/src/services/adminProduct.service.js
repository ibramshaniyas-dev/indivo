import api from './api';

export async function listProducts(params = {}) {
  const { data } = await api.get('/admin/products', { params });
  return data;
}

export async function getProduct(id) {
  const { data } = await api.get(`/admin/products/${id}`);
  return data.data;
}

export async function approveProduct(id) {
  await api.post(`/admin/products/${id}/approve`);
}

export async function rejectProduct(id, reason) {
  await api.post(`/admin/products/${id}/reject`, { reason });
}

export async function blockProduct(id) {
  await api.post(`/admin/products/${id}/block`);
}

export async function deactivateProduct(id) {
  await api.post(`/admin/products/${id}/deactivate`);
}

export async function setFeatured(id, value) {
  await api.post(`/admin/products/${id}/featured`, { value });
}
