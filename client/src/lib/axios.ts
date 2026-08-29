import axios from 'axios';

const isProd = import.meta.env.PROD;
const baseURL = isProd 
  ? 'https://syndesk-server-latest.onrender.com/api' 
  : import.meta.env.VITE_API_BASE_URL || '/api';

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});
console.log('Axios instance created with base URL:', import.meta.env.VITE_API_BASE_URL);
