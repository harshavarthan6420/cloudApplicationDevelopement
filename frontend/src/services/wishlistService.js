import api from './api';

export async function getWishlistItems() {
  const response = await api.get('/api/wishlist');
  return response.data;
}

export async function addWishlistItem(payload) {
  const response = await api.post('/api/wishlist', payload);
  return response.data;
}

export async function deleteWishlistItem(id) {
  const response = await api.delete(`/api/wishlist/${id}`);
  return response.data;
}
