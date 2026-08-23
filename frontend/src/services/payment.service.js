import api from './api';

export async function getPaymentConfig() {
  const { data } = await api.get('/payments/config');
  return data.data;
}

export async function createPayment(orderId) {
  const { data } = await api.post('/payments/create', { orderId });
  return data.data;
}

export async function verifyPayment(payload) {
  const { data } = await api.post('/payments/verify', payload);
  return data.data;
}
