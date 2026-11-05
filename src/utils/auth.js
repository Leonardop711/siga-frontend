import { isTokenExpired, decodeJWT } from './security';

/**
 * Gestión de autenticación (basada en Cookies HttpOnly) y control RBAC
 */

export const setToken = (token) => {
  // Mitigación F-09: El JWT viaja en una cookie HttpOnly gestionada por el navegador.
  // Eliminamos cualquier token antiguo en texto plano del localStorage y marcamos la sesión como activa.
  localStorage.removeItem('token');
  localStorage.setItem('siga_session_active', 'true');
  const expTimestamp = Math.floor(Date.now() / 1000) + 3600;
  localStorage.setItem('siga_session_exp', String(expTimestamp));
  window.dispatchEvent(new Event('siga:auth-changed'));
};

export const getToken = () => null;

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('siga_session_active');
  localStorage.removeItem('siga_session_exp');
};

export const setUserData = (username, rol) => {
  if (username) localStorage.setItem('username', username);
  if (rol) localStorage.setItem('rol', rol);
  localStorage.setItem('siga_session_active', 'true');
  if (!localStorage.getItem('siga_session_exp')) {
    const expTimestamp = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem('siga_session_exp', String(expTimestamp));
  }
  window.dispatchEvent(new Event('siga:auth-changed'));
};

export const getUsername = () => localStorage.getItem('username') || 'Usuario';

export const getRole = () => localStorage.getItem('rol') || 'alumno';

export const clearAuth = () => {
  removeToken();
  localStorage.removeItem('username');
  localStorage.removeItem('rol');
  window.dispatchEvent(new Event('siga:auth-changed'));
};

/**
 * Verifica si el usuario actual tiene una sesión activa y no expirada.
 */
export const isAuthenticated = () => {
  const sessionActive = localStorage.getItem('siga_session_active') === 'true';
  const legacyToken = localStorage.getItem('token');

  if (!sessionActive && !legacyToken) return false;

  const expStr = localStorage.getItem('siga_session_exp');
  if (expStr) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (Number(expStr) < currentTime) {
      clearAuth();
      return false;
    }
  }

  if (legacyToken) {
    const decoded = decodeJWT(legacyToken);
    if (decoded && decoded.exp && isTokenExpired(legacyToken)) {
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
