import axios from 'axios';

const isProd = import.meta.env.PROD;
const baseURL = isProd 
  ? '/api' 
  : import.meta.env.VITE_API_BASE_URL || '/api';

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
console.log('Axios instance created with base URL:', import.meta.env.VITE_API_BASE_URL);
