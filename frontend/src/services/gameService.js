import api from './api';

export async function searchGames(query) {
  const response = await api.get('/api/games/search', {
    params: { query }
  });
  return response.data;
}

export async function getGameDetails(rawgId) {
  const response = await api.get(`/api/games/${rawgId}`);
  return response.data;
}
