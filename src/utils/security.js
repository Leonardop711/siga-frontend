/**
 * =========================================================
 * SIGA - Utilidades de Seguridad del Frontend
 * =========================================================
 * - Prevención de XSS y sanitización de entradas
 * - Prevención de Inyección de Fórmulas CSV (CWE-1236)
 * - Decodificación segura y validación de expiración de JWT
 * - Manejo de inactividad de sesión de usuario
 */

/**
 * Sanitiza texto para evitar inyecciones XSS en el DOM o campos de entrada.
 * @param {string} input - Cadena a sanitizar
 * @returns {string} - Cadena libre de caracteres peligrosos HTML
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Limpia y normaliza texto eliminando etiquetas o scripts maliciosos.
 * @param {string} str 
 * @returns {string}
 */
export const cleanText = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>?/gm, '')
    .trim();
};

/**
 * Sanitizador de valores para CSV contra Formula Injection (CWE-1236).
 * En hojas de cálculo (Excel, LibreOffice, Google Sheets), campos que
 * comienzan con '=', '+', '-', '@', '\t' o '\r' pueden ejecutar comandos DDE.
 * Prefijamos con comilla simple (') para neutralizar su ejecución.
 * 
 * @param {any} value - Valor de la celda
 * @returns {string} - Valor sanitizado y entrecomillado
 */
export const sanitizeForCSV = (value) => {
  if (value === null || value === undefined) return '""';
  
  let stringValue = String(value).trim();
  
  // Si comienza con un caracter peligroso de fórmula, se escapa con comilla simple
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some(char => stringValue.startsWith(char))) {
    stringValue = `'${stringValue}`;
  }
  
  // Escapar comillas dobles internas duplicándolas ("" -> """")
  stringValue = stringValue.replace(/"/g, '""');
  
  return `"${stringValue}"`;
};

/**
 * Decodifica de forma segura el payload de un token JWT sin dependencias externas.
 * @param {string} token - Token JWT
 * @returns {object|null} - Payload decodificado o null si es inválido
 */
export const decodeJWT = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Normalizar base64url a base64 estándar
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Error al decodificar JWT:', e);
    return null;
  }
};

/**
 * Verifica si un token JWT ha expirado.
 * @param {string} token 
 * @returns {boolean} - true si el token ya expiró o es inválido
 */
export const isTokenExpired = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  // exp viene en segundos; Date.now() en milisegundos
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Obtiene los segundos restantes de validez del token.
 * @param {string} token 
 * @returns {number} - Segundos restantes (0 si ya expiró)
 */
export const getTokenRemainingSeconds = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return 0;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const diff = payload.exp - currentTime;
  return diff > 0 ? diff : 0;
};
