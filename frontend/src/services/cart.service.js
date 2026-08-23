import api from './api';

export async function getCart() {
  const { data } = await api.get('/cart');
  return data.data;
}

export async function addToCart(productVariantId, quantity = 1) {
  const { data } = await api.post('/cart/items', { productVariantId, quantity });
  return data.data;
}

export async function updateCartItem(itemId, quantity) {
  const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
  return data.data;
}

export async function removeCartItem(itemId) {
  const { data } = await api.delete(`/cart/items/${itemId}`);
  return data.data;
}
