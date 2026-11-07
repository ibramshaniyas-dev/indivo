import api from './api';

export async function getSellerAnalytics(range) {
  const { data } = await api.get('/sellers/me/analytics', { params: { range } });
  return data.data;
}

export async function getPlatformAnalytics(range) {
  const { data } = await api.get('/admin/analytics', { params: { range } });
  return data.data;
}
