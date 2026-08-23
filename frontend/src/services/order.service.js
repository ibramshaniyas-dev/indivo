import api from './api';

export async function listMyOrders() {
  const { data } = await api.get('/orders');
  return data.data;
}

export async function getMyOrder(id) {
  const { data } = await api.get(`/orders/${id}`);
  return data.data;
}
