import axios from 'axios';

// Replace with your backend URL
// For local development:
// - Physical device: use your computer's IP address
// - Android emulator: http://10.0.2.2:5000
// - iOS simulator: http://localhost:5000
const API_URL = 'https://b56233dfc272.ngrok-free.app/api';


const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;