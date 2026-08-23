import api from './api';

export async function placeOrder(payload) {
  const { data } = await api.post('/checkout', payload);
  return data.data;
}
