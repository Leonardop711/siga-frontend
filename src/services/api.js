import { getToken, clearAuth, setToken, setUserData } from '../utils/auth';

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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (response.status === 429) {
    const err = new Error(data.message || 'Demasiados intentos fallidos. Sistema bloqueado temporalmente por seguridad.');
    err.status = 429;
    throw err;
  }

  if (response.status === 401 && endpoint !== '/login') {
    clearAuth();
    const err = new Error(data.message || 'Sesión expirada o no autorizada.');
    err.status = 401;
    throw err;
  }

  if (!response.ok) {
    const err = new Error(data.message || 'Error en la petición al servidor.');
    err.status = response.status;
    throw err;
  }

  return data;
};

/**
 * Servicios de Autenticación
 */
export const loginUser = async (credentials) => {
  return apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

/**
 * Servicios Académicos (Lectura e Inserción)
 */
export const getAlumnos = async () => {
  const res = await apiFetch('/alumnos');
  return Array.isArray(res) ? res : (res?.data || []);
};

export const createAlumno = async (alumnoData) => {
  return apiFetch('/alumnos', {
    method: 'POST',
    body: JSON.stringify(alumnoData),
  });
};

export const getCalificaciones = async () => {
  const res = await apiFetch('/calificaciones');
  return Array.isArray(res) ? res : (res?.data || []);
};

export const createCalificacion = async (calificacionData) => {
  return apiFetch('/calificaciones', {
    method: 'POST',
    body: JSON.stringify(calificacionData),
  });
};

/**
 * Servicios de Auditoría y Seguridad (Lectura e Inserción)
 */
export const getLogs = async () => {
  const res = await apiFetch('/logs');
  return Array.isArray(res) ? res : (res?.data || []);
};

export const getIntentos = async () => {
  const res = await apiFetch('/intentos');
  return Array.isArray(res) ? res : (res?.data || []);
};

export const getUsuarios = async () => {
  const res = await apiFetch('/usuarios');
  return Array.isArray(res) ? res : (res?.data || []);
};

export const createUsuario = async (usuarioData) => {
  return apiFetch('/usuarios', {
    method: 'POST',
    body: JSON.stringify(usuarioData),
  });
};

export const updateAlumno = async (matricula, data) => {
  return apiFetch(`/alumnos/${matricula}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteAlumno = async (matricula) => {
  return apiFetch(`/alumnos/${matricula}`, {
    method: 'DELETE',
  });
};

export const updateUsuario = async (id, data) => {
  return apiFetch(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteUsuario = async (id) => {
  return apiFetch(`/usuarios/${id}`, {
    method: 'DELETE',
  });
};
