import api from './api';

export async function getCommissionOverview(range) {
  const { data } = await api.get('/admin/commission', { params: { range } });
  return data.data;
}

export async function getCommissionLedger(params) {
  const { data } = await api.get('/admin/commission/ledger', { params });
  return data.data;
}

export async function updateDefaultCommission(rate) {
  const { data } = await api.put('/admin/commission/global', rate);
  return data;
}

export async function updateSellerCommission(sellerId, rate) {
  const { data } = await api.put(`/admin/commission/sellers/${sellerId}`, rate);
  return data;
}

export async function resetSellerCommission(sellerId) {
  const { data } = await api.delete(`/admin/commission/sellers/${sellerId}`);
  return data;
}

export async function getMyEarnings(params) {
  const { data } = await api.get('/sellers/me/earnings', { params });
  return data.data;
}
