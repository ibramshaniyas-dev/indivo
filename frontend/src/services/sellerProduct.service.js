import api from './api';

export async function listMyProducts(params = {}) {
  const { data } = await api.get('/sellers/products', { params });
  return data.data;
}

export async function getMyProduct(id) {
  const { data } = await api.get(`/sellers/products/${id}`);
  return data.data;
}

export async function createProduct(payload) {
  const { data } = await api.post('/sellers/products', payload);
  return data.data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/sellers/products/${id}`, payload);
  return data.data;
}

export async function addVariant(id, payload) {
  const { data } = await api.post(`/sellers/products/${id}/variants`, payload);
  return data.data;
}

export async function uploadImages(id, files) {
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append('images', f));
  const { data } = await api.post(`/sellers/products/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function submitForReview(id) {
  await api.post(`/sellers/products/${id}/submit`);
}
