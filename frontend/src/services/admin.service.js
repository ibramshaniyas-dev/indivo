import api from './api';

export async function listSellers(status) {
  const { data } = await api.get('/admin/sellers', { params: status ? { status } : {} });
  return data;
}

export async function getSeller(id) {
  const { data } = await api.get(`/admin/sellers/${id}`);
  return data.data;
}

export async function approveSeller(id) {
  await api.post(`/admin/sellers/${id}/approve`);
}

export async function rejectSeller(id, reason) {
  await api.post(`/admin/sellers/${id}/reject`, { reason });
}

export async function verifyDocument(sellerId, docId, status) {
  await api.post(`/admin/sellers/${sellerId}/documents/${docId}/verify`, { status });
}
