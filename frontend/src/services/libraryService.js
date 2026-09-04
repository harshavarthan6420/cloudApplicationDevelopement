import api from './api';

export async function getLibraryItems() {
  const response = await api.get('/api/library');
  return response.data;
}

export async function addLibraryItem(payload) {
  const response = await api.post('/api/library', payload);
  return response.data;
}

export async function updateLibraryItem(id, payload) {
  const response = await api.put(`/api/library/${id}`, payload);
  return response.data;
}

export async function deleteLibraryItem(id) {
  const response = await api.delete(`/api/library/${id}`);
  return response.data;
}
