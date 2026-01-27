import axios from 'axios';

// Ensure this matches your running backend port
const API_URL = 'http://localhost:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the Token
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token'); // Web Storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;