import { isTokenExpired, decodeJWT } from './security';

/**
 * Gestión de autenticación, almacenamiento seguro de tokens y control RBAC
 */

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

export const getToken = () => localStorage.getItem('token');

export const removeToken = () => localStorage.removeItem('token');

export const setUserData = (username, rol) => {
  if (username) localStorage.setItem('username', username);
  if (rol) localStorage.setItem('rol', rol);
};

export const getUsername = () => localStorage.getItem('username') || 'Usuario';

export const getRole = () => localStorage.getItem('rol') || 'alumno';

export const clearAuth = () => {
  removeToken();
  localStorage.removeItem('username');
  localStorage.removeItem('rol');
  localStorage.removeItem('siga_session_active');
  window.dispatchEvent(new Event('siga:auth-changed'));
};

/**
 * Verifica si el usuario actual tiene una sesión activa y no expirada.
 * Valida tanto la existencia del token como su expiración JWT si contiene el claim 'exp'.
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  // Si el token es un JWT válido, verificar si ya expiró
  const decoded = decodeJWT(token);
  if (decoded && decoded.exp) {
    if (isTokenExpired(token)) {
      clearAuth();
      return false;
    }
  }
  
  return true;
};

/**
 * Verificadores de roles RBAC (Role-Based Access Control)
 */
export const isAdmin = () => getRole().toLowerCase() === 'admin';
export const isDocente = () => getRole().toLowerCase() === 'docente';
export const isAlumno = () => getRole().toLowerCase() === 'alumno';

export const hasRole = (allowedRoles = []) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true;
  const currentRole = getRole().toLowerCase();
  return allowedRoles.map(r => r.toLowerCase()).includes(currentRole);
};
