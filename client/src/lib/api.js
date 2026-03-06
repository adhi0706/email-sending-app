import axios from 'axios';

// Since we setup the proxy in Vite, we can just hit /api
const api = axios.create({
    baseURL: '/api'
});

// Automatically inject JWT Token from LocalStorage if logged in
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
