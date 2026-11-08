import api from './api';

const get = async (url, params) => (await api.get(url, { params })).data.data;

export const getMyGrowth = () => get('/sellers/me/growth');
export const getMySettlements = (params) => get('/sellers/me/settlements', params);
export const getAdminInsights = () => get('/admin/insights');
export const getSellerPerformance = (days) => get('/admin/performance', { days });
export const getSearchInsights = (days) => get('/admin/search-insights', { days });
export const getPayoutsDue = () => get('/admin/settlements/due');
export const getSettlementHistory = (params) => get('/admin/settlements', params);

export async function recordPayout(sellerId, payload) {
  const { data } = await api.post(`/admin/settlements/${sellerId}/pay`, payload);
  return data;
}
