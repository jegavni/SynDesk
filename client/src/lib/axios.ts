import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: '/api', // Using Vite proxy
  withCredentials: true,
});
