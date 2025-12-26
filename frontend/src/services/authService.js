import api from './api';

export const loginUser = async (role, input, password) => {
  try {
    const response = await api.post('/auth/login', {
      role,
      input,
      password,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Login failed');
    } else if (error.request) {
      throw new Error('No response from server. Check your connection.');
    } else {
      throw new Error('An error occurred. Please try again.');
    }
  }
};