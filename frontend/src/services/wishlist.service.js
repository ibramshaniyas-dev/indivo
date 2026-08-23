import api from './api';

export async function getWishlist() {
  const { data } = await api.get('/wishlist');
  return data.data;
}

export async function addToWishlist(productId) {
  await api.post('/wishlist', { productId });
}

export async function removeFromWishlist(productId) {
  await api.delete(`/wishlist/${productId}`);
}
