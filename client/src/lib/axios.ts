import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});
console.log('Axios instance created with base URL:', import.meta.env.VITE_API_BASE_URL);
