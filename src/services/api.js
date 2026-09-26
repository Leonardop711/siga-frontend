import { getToken, clearAuth } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiFetch = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (response.status === 401) {
            clearAuth();
            window.location.href = '/login';
            throw new Error(data.message || 'Sesión expirada');
        }

        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const loginUser = async (credentials) => {
    return apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
};

export const getAlumnos = async () => {
    return apiFetch('/alumnos');
};
