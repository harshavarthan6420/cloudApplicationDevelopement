import api from './api';

export async function getReviews() {
  const response = await api.get('/api/reviews');
  return response.data;
}

export async function createReview(payload) {
  const response = await api.post('/api/reviews', payload);
  return response.data;
}

export async function updateReview(id, payload) {
  const response = await api.put(`/api/reviews/${id}`, payload);
  return response.data;
}

export async function deleteReview(id) {
  const response = await api.delete(`/api/reviews/${id}`);
  return response.data;
}
