import api from './api';

export async function listMyOrders(params = {}) {
  const { data } = await api.get('/sellers/orders', { params });
  return data.data;
}

export async function getMyOrder(id) {
  const { data } = await api.get(`/sellers/orders/${id}`);
  return data.data;
}

export async function updateOrderStatus(id, payload) {
  await api.post(`/sellers/orders/${id}/status`, payload);
}
