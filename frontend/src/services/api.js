import axios from 'axios';
import { AUTH_STORAGE_KEY } from '../context/authStorage';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || '';
const baseURL = rawBaseURL.replace(/\/+$/, '');

const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const username = localStorage.getItem(AUTH_STORAGE_KEY);
  if (username) {
    config.headers['X-Username'] = username;
  }
  return config;
});

export default api;
