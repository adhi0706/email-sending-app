import axios, { InternalAxiosRequestConfig } from 'axios';

// Since we setup the proxy in Vite, we can just hit /api
export const api = axios.create({
    baseURL: '/api'
});

// Automatically inject JWT Token from LocalStorage if logged in
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
