import axios from 'axios';

// pre-configured Axios instance — base URL read from .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// runs before every request — attaches the JWT if one exists in storage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;