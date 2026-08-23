import api from './api';

export async function listAddresses() {
  const { data } = await api.get('/customers/me/addresses');
  return data.data;
}

export async function addAddress(payload) {
  await api.post('/customers/me/addresses', payload);
}

export async function removeAddress(id) {
  await api.delete(`/customers/me/addresses/${id}`);
}

export async function setDefaultAddress(id) {
  await api.post(`/customers/me/addresses/${id}/default`);
}
