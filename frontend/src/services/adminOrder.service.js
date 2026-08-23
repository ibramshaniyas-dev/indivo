import api from './api';

export async function listOrders(params = {}) {
  const { data } = await api.get('/admin/orders', { params });
  return data;
}

export async function getOrder(id) {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data.data;
}
