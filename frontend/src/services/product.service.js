import api from './api';

export async function listProducts(params = {}) {
  const { data } = await api.get('/products', { params });
  return data;
}

export async function getProductBySlug(slug) {
  const { data } = await api.get(`/products/${slug}`);
  return data.data;
}
