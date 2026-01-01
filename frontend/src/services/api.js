import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://7f7b7d44fd61.ngrok-free.app/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ADD THIS INTERCEPTOR SECTION
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      // This attaches the "identity badge" the backend is looking for
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error fetching token from storage:", error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;