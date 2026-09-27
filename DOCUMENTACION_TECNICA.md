# DOCUMENTACIÓN TÉCNICA DE IMPLEMENTACIÓN
## SIGA • Sistema Integral de Gestión Académica & Ciberseguridad

Este documento detalla la arquitectura de software, los algoritmos de seguridad implementados en el cliente, la estructura de componentes y la justificación técnica de cada solución desarrollada en el frontend.

---

### 1. Modelo de Amenazas y Vulnerabilidades Mitigadas

| Vulnerabilidad | Clasificación | Impacto Mitigado | Solución Técnica en el Frontend |
| :--- | :---: | :--- | :--- |
| **Inyección de Fórmulas CSV** | CWE-1236 | Ejecución remota de comandos en hojas de cálculo al exportar registros. | Función `sanitizeForCSV()` en `src/utils/security.js`. Neutraliza caracteres `=`, `+`, `-`, `@`, `\t` y `\r` prefijando con `'`. |
| **Ataques de Fuerza Bruta** | CWE-307 | Compromiso de credenciales por peticiones repetidas al endpoint de login. | Detección de código HTTP `429` en `api.js` + interfaz de bloqueo interactivo de 15 minutos en `Login.jsx`. |
| **Cross-Site Scripting (XSS)** | CWE-79 | Inyección de scripts en campos de búsqueda o renderizado de datos. | Sanitización con `cleanText()` y `sanitizeInput()` en inputs + escape nativo de JSX. |
| **Secuestro de Sesión / Sesión Desatendida** | CWE-613 | Acceso indebido cuando el usuario abandona su equipo sin cerrar sesión. | Monitor de inactividad de 15 minutos en `Dashboard.jsx` con modal de advertencia a los 14 minutos. |
| **Expiración de Tokens JWT** | CWE-672 | Peticiones continuas con tokens vencidos provocando inconsistencias. | Decodificación del claim `exp` en cliente con `isTokenExpired()` y revocación preventiva. |
| **MIME Sniffing & Script Injection** | OWASP A05 | Interpretación insegura de recursos y cargas externas no autorizadas. | Directivas CSP, `X-Content-Type-Options: nosniff` y `Referrer-Policy` en `index.html`. |
| **Escalamiento de Privilegios en UI** | CWE-285 | Visualización de módulos de auditoría por usuarios no autorizados. | Guardas de navegación RBAC (`admin`, `docente`, `alumno`) en `Dashboard.jsx`. |

---

### 2. Capa de Utilidades de Seguridad (`src/utils/security.js`)

#### A. Sanitización contra Inyección de Fórmulas CSV (`sanitizeForCSV`)
```javascript
export const sanitizeForCSV = (value) => {
  if (value === null || value === undefined) return '""';
  let stringValue = String(value).trim();
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some(char => stringValue.startsWith(char))) {
    stringValue = `'${stringValue}`;
  }
  stringValue = stringValue.replace(/"/g, '""');
  return `"${stringValue}"`;
};
```
- **Justificación**: Los lectores de hojas de cálculo ejecutan fórmulas que inicien con esos caracteres. Al anteponer `'`, la celda es forzada a interpretarse como texto plano literal, previniendo la invocación de macros `DDE` o llamadas externas.

#### B. Decodificador Seguro de JWT (`decodeJWT`)
```javascript
export const decodeJWT = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
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
    return null;
  }
};
```
- **Justificación**: Decodifica el payload en base64 estándar sin requerir dependencias externas pesadas como `jsonwebtoken` en el cliente, optimizando el tamaño del bundle.

---

### 3. Capa de Autenticación y RBAC (`src/utils/auth.js`)

Administra el ciclo de vida de la sesión con las siguientes funciones exportadas:
- `setToken(token)` / `getToken()` / `removeToken()`: Persistencia segura en `localStorage`.
- `setUserData(username, rol)` / `getUsername()` / `getRole()`: Control de identidad del usuario activo.
- `isAuthenticated()`: Valida tanto la existencia del token como su vigencia con `isTokenExpired()`. Si el token expiró, purga la sesión automáticamente.
- `isAdmin()`, `isDocente()`, `isAlumno()`, `hasRole(roles)`: Predicados booleanos para el renderizado condicional de vistas.
- `clearAuth()`: Purga integral de credenciales y despacho del evento personalizado `siga:auth-changed`.

---

### 4. Capa de Servicios API (`src/services/api.js`)

Implementa un interceptor centralizado para `fetch`:
- Inyección automática del encabezado `Authorization: Bearer <token>`.
- Detección de error HTTP `429`: Lanza una excepción con estado 429 para activar el bloqueo de seguridad.
- Detección de error HTTP `401`: Ejecuta `clearAuth()` para redirigir al login si el token fue invalidado en el servidor.
- **Mecanismo de Resiliencia (Fallback Offline)**: Si la llamada al backend falla por desconexión de red (`Failed to fetch`), el servicio suministra datos simulados idénticos a las tablas de PostgreSQL:
  - `getAlumnos()`: Retorna alumnos con materias y notas (`academico.alumnos`).
  - `getLogs()`: Retorna registros de auditoría (`auditoria.logs`).
  - `getIntentos()`: Retorna intentos de autenticación (`seguridad.intentos_fallidos`).
  - `getUsuarios()`: Retorna cuentas de usuario (`seguridad.usuarios`).
  - `getCalificaciones()`: Retorna listado de asignaturas (`academico.calificaciones`).

---

### 5. Componentes Principales

#### `Login.jsx`
- Formulario de credenciales con visualización controlada de contraseñas.
- Rastreo de intentos fallidos consecutivos.
- Activación de pantalla de bloqueo ante `HTTP 429` con temporizador regresivo de 15 minutos en tiempo real.
- Botones de inyección rápida de credenciales para demostración de perfiles:
  - `admin`: Credenciales de administrador.
  - `docente.ramirez`: Credenciales de docente.
  - `alumno.20230001`: Credenciales de estudiante.

#### `Dashboard.jsx`
- **Barra de Navegación**:
  - Selector de módulos: **Gestión Escolar** y **Auditoría & Seguridad**.
  - Selector de simulación de roles para evaluar RBAC dinámicamente.
- **Detector de Inactividad**:
  - Monitorea eventos `mousemove`, `keydown`, `click`, `scroll`, `touchstart`.
  - A los 14 minutos despliega modal de confirmación con cuenta regresiva de 60 segundos.
  - Cierra la sesión de forma limpia tras 15 minutos sin interacción.
- **Gestión Académica**:
  - Resumen KPI (Alumnos, Promedio, Materias, Tasa de Aprobación).
  - Búsqueda en vivo y filtrado por semestre.
  - Exportación segura a CSV saneado contra inyección de fórmulas.

#### `AuditView.jsx`
- Centro de Ciberseguridad con 3 pestañas especializadas:
  1. **Trazabilidad & Logs**: Tabla con filtrado por tipo de evento (`LOGIN_SUCCESS`, `READ_ALUMNOS`, `READ_LOG`, etc.), fechas con formato legible, usuario e IP de origen.
  2. **Intentos de Acceso & Fuerza Bruta**: Análisis de intentos exitosos vs fallidos, monitor de IPs y alerta visual en caso de ataques concentrados.
  3. **Cuentas y Privilegios RBAC**: Catálogo de cuentas, estado activo/bloqueado, roles y especificación criptográfica (BCrypt con Work Factor 12).
- Exportación segura a CSV de los registros de auditoría.

---

### 6. Optimización Responsiva para Dispositivos Móviles

Implementada en `src/styles/dashboard.css` y `src/styles/login.css`:
- **Navegación segmentada en 2 filas**: La barra superior reordena los controles en pantallas menores a 768px; la marca y perfil quedan arriba, y el selector de módulos abajo con botones táctiles de 50% de ancho.
- **Cuadrícula 2×2 para KPIs**: Evita el desplazamiento vertical excesivo en teléfonos.
- **Tablas con Desplazamiento Táctil**: Contenedores `.table-wrapper` con `-webkit-overflow-scrolling: touch`.
- **Pestañas de Auditoría Deslizables**: Barras de pestañas horizontales con scroll táctil suave y scrollbars ocultas.
- **Prevención de Zoom en iOS Safari**: Todos los campos de entrada de texto mantienen `font-size: 16px` para evitar zoom automático al enfocar el teclado.
