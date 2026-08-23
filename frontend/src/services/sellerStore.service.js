import api from './api';

export async function getSellerStore(id) {
  const { data } = await api.get(`/sellers/${id}/store`);
  return data.data;
}
