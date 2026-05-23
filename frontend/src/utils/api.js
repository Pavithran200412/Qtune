import axios from 'axios';

// In development, Vite proxy handles /api → localhost:5000
// In production, we need the absolute backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Configure axios defaults for the entire app
axios.defaults.baseURL = API_BASE_URL;

// Socket.io URL (same as backend in production, localhost in dev)
export const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default axios;
