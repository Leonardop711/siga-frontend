# SIGA • Sistema Integral de Gestión Académica & Ciberseguridad

> **Frontend Institucional Seguro** desarrollado con **React 18**, **Vite** y **CSS Modular Puro**, construido bajo principios de arquitectura limpia, ciberseguridad defensiva en el cliente (*Frontend Security Hardening*) y Control de Acceso Basado en Roles (**RBAC**).

---

## 📋 Tabla de Contenido
1. [Descripción General](#-descripción-general)
2. [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
3. [Mapeo e Integración con el Backend](#-mapeo-e-integración-con-el-backend)
4. [Implementaciones de Ciberseguridad (Security Hardening)](#-implementaciones-de-ciberseguridad-security-hardening)
   - [Control de Acceso Basado en Roles (RBAC)](#1-control-de-acceso-basado-en-roles-rbac)
   - [Módulo de Auditoría y Trazabilidad](#2-módulo-de-auditoría-y-trazabilidad)
   - [Defensa contra Fuerza Bruta y Rate Limiting](#3-defensa-contra-fuerza-bruta-y-rate-limiting)
   - [Protección contra Inyección de Fórmulas CSV (CWE-1236)](#4-protección-contra-inyección-de-fórmulas-csv-cwe-1236)
   - [Prevención de Cross-Site Scripting (XSS)](#5-prevención-de-cross-site-scripting-xss)
   - [Gestión Segura de Sesión y Expiración JWT](#6-gestión-segura-de-sesión-y-expiración-jwt)
   - [Políticas de Seguridad en Cabeceras (CSP)](#7-políticas-de-seguridad-en-cabeceras-csp)
5. [Guía de Vistas y Componentes](#-guía-de-vistas-y-componentes)
6. [Diseño Responsivo y Soporte Móvil](#-diseño-responsivo-y-soporte-móvil)
7. [Guía de Ejecución y Despliegue](#-guía-de-ejecución-y-despliegue)
8. [Configuración para Git](#-configuración-para-git)

---

## 🌟 Descripción General

El **SIGA (Sistema Integral de Gestión Académica)** es una plataforma web para la administración y supervisión de registros escolares, calificaciones y auditoría de accesos. 

El frontend ha sido completamente reforzado para cumplir con estándares de ciberseguridad industrial, garantizando que:
- Los datos académicos confidenciales estén protegidos frente a accesos no autorizados.
- Se mantenga una trazabilidad completa de cada acción y evento del sistema.
- La aplicación sea resiliente tanto en entornos productivos conectados a un servidor API como en modo de evaluación/demostración independiente.

---

## 🏗 Arquitectura del Proyecto

```
c:\siga-frontend\
├── index.html                 # Punto de entrada HTML con CSP y cabeceras de seguridad
├── package.json               # Dependencias del proyecto (React 18, React Router v6, Vite)
├── vite.config.js             # Configuración del servidor de desarrollo Vite
├── .gitignore                 # Exclusión de dependencias, builds y repositorio del backend
│
└── src\
    ├── main.jsx               # Bootstrap de React con React.StrictMode
    ├── App.jsx                # Enrutador principal y guardas de autenticación
    │
    ├── components\            # Componentes y vistas de la interfaz
    │   ├── Login.jsx          # Vista de inicio de sesión con blindaje contra fuerza bruta
    │   ├── Dashboard.jsx      # Panel principal, métricas escolares y gestión modular
    │   ├── AuditView.jsx      # Centro de Ciberseguridad, logs, intentos y cuentas RBAC
    │   └── Icons.jsx          # Sistema de iconografía SVG ligera y accesible
    │
    ├── services\              # Capa de comunicación con la API
    │   └── api.js             # Interceptor fetch, manejo de errores 401/429 y fallback resiliente
    │
    ├── utils\                 # Utilidades de seguridad y autenticación
    │   ├── security.js        # Sanitizadores anti-XSS, anti-CSV Injection y decodificador JWT
    │   └── auth.js            # Manejo de tokens, roles RBAC y estado de sesión
    │
    └── styles\                # Hojas de estilo modulares
        ├── login.css          # Estilos de login, bloqueo rate-limit y accesos rápidos
        └── dashboard.css      # Estilos del panel, auditoría, modales y diseño responsivo móvil
```

---

## 🔗 Mapeo e Integración con el Backend

El frontend está estrictamente alineado con la arquitectura hexagonal y el esquema de base de datos PostgreSQL del backend (`siga-backend`):

| Endpoint Backend | Método | Esquema / Tabla BD | Función en el Frontend |
| :--- | :---: | :--- | :--- |
| `/api/login` | `POST` | `seguridad.usuarios` / `seguridad.intentos_fallidos` | Autenticación de credenciales, recepción de JWT y registro de intentos. |
| `/api/alumnos` | `GET` | `academico.alumnos` + `academico.calificaciones` | Carga de expedientes, asignaturas y promedios en la Gestión Escolar. |
| `/api/calificaciones`| `GET` | `academico.calificaciones` | Consulta específica de materias y notas registradas. |
| `/api/logs` | `GET` | `auditoria.logs` | Visualización en la pestaña *Trazabilidad & Logs* del Centro de Auditoría. |
| `/api/intentos` | `GET` | `seguridad.intentos_fallidos` | Monitor de intentos exitosos vs. fallidos y detección de ataques. |
| `/api/usuarios` | `GET` | `seguridad.usuarios` | Supervisión de cuentas activas, roles y privilegios de acceso. |

### Modo Resiliente Dual (Producción vs. Demo Standalone)
En [`api.js`](file:///c:/siga-frontend/src/services/api.js), las peticiones se realizan hacia los endpoints reales del servidor. Si el servidor API está activo, el frontend se comunica de manera transparente mediante HTTP y tokens Bearer. Si el backend no está iniciado localmente, el cliente intercepta la ausencia de red y activa un **Modo Local Seguro** con datos idénticos al esquema semilla de la base de datos (`01-init.sql` y `02-seed.sql`), permitiendo evaluar la funcionalidad completa sin caídas del sistema.

---

## 🛡 Implementaciones de Ciberseguridad (Security Hardening)

### 1. Control de Acceso Basado en Roles (RBAC)
Se implementó un esquema de autorización granular que restringe vistas y acciones según el rol del usuario autenticado:
- **`admin` (Administrador)**: Acceso total. Puede gestionar registros académicos, consultar logs de auditoría, revisar intentos fallidos y monitorear privilegios de usuarios.
- **`docente` (Docente)**: Acceso exclusivo a la Gestión Escolar y consulta de expedientes de alumnos.
- **`alumno` (Estudiante)**: Vista personal de calificaciones y kardex escolar.

> **Demostración Dinámica:** La barra de navegación incluye un selector de roles para cambiar en tiempo real los privilegios activos y verificar cómo el frontend oculta o bloquea los módulos protegidos.

### 2. Módulo de Auditoría y Trazabilidad
Diseñado en [`AuditView.jsx`](file:///c:/siga-frontend/src/components/AuditView.jsx) para dar visibilidad total a la seguridad del sistema:
- **Pestaña 1 - Trazabilidad & Logs**: Filtro por tipo de acción (`LOGIN_SUCCESS`, `READ_ALUMNOS`, `READ_LOG`, `AUTH_FAILED`), fechas formateadas en localización estándar, usuario responsable e IP de procedencia.
- **Pestaña 2 - Intentos de Acceso**: Tarjetas con KPIs (Total de Intentos, Accesos Exitosos, Intentos Bloqueados, IPs Únicas) y tabla con badges de estado.
- **Detección de Patrones Anómalos**: El sistema analiza las IPs y emite una alerta visual destacada cuando detecta múltiples intentos fallidos provenientes de un mismo origen.
- **Pestaña 3 - Cuentas & Privilegios**: Estado de usuarios (activo/bloqueado), roles asignados y notas de cumplimiento criptográfico (BCrypt Work Factor 12).

### 3. Defensa contra Fuerza Bruta y Rate Limiting
El backend implementa un limitador de tasa de 5 intentos cada 15 minutos en `/api/login`. El frontend responde de forma proactiva:
- Cuenta los intentos fallidos locales en [`Login.jsx`](file:///c:/siga-frontend/src/components/Login.jsx) (ej. *"Intento 2 de 5 antes de bloqueo"*).
- Al recibir una respuesta `HTTP 429` (o alcanzar 5 intentos), la interfaz activa una **pantalla de bloqueo de seguridad** con temporizador regresivo de 15 minutos (`15:00`), deshabilitando el formulario para impedir ataques automatizados de diccionario.

### 4. Protección contra Inyección de Fórmulas CSV (CWE-1236)
Al exportar listas de alumnos o registros de auditoría a formato CSV, usuarios maliciosos podrían registrar nombres como `=cmd|' /C calc'!A0` o `=SUM(...)` para ejecutar comandos al abrir el archivo en hojas de cálculo (Excel, LibreOffice o Google Sheets).

En [`security.js`](file:///c:/siga-frontend/src/utils/security.js) se integró la función:
```javascript
export const sanitizeForCSV = (value) => {
  if (value === null || value === undefined) return '""';
  let stringValue = String(value).trim();
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some(char => stringValue.startsWith(char))) {
    stringValue = `'${stringValue}`; // Neutraliza la fórmula
  }
  stringValue = stringValue.replace(/"/g, '""');
  return `"${stringValue}"`;
};
```
Cada celda generada tanto en el reporte académico como en los logs de auditoría pasa por este filtro de neutralización.

### 5. Prevención de Cross-Site Scripting (XSS)
- Los campos de búsqueda y formularios limpian etiquetas HTML y caracteres de inyección mediante `cleanText()` y `sanitizeInput()`.
- El renderizado se apoya en el escape automático de JSX de React, evitando por completo el uso de propiedades vulnerables como `dangerouslySetInnerHTML`.

### 6. Gestión Segura de Sesión y Expiración JWT
- **Validación del Token en Cliente**: Función `isTokenExpired()` en [`security.js`](file:///c:/siga-frontend/src/utils/security.js) que decodifica el payload en base64 de manera segura y comprueba el claim `exp` respecto a la marca temporal actual.
- **Control de Inactividad de Sesión**: Un hook global en [`Dashboard.jsx`](file:///c:/siga-frontend/src/components/Dashboard.jsx) monitorea eventos de usuario (`mousemove`, `keydown`, `click`, `scroll`, `touchstart`). A los **14 minutos de inactividad**, despliega una alerta modal con cuenta regresiva de **60 segundos**; si el usuario no interactúa, se ejecuta el cierre seguro de sesión y purga de credenciales (`clearAuth()`).

### 7. Políticas de Seguridad en Cabeceras (CSP)
En [`index.html`](file:///c:/siga-frontend/index.html) se establecieron directivas de seguridad estrictas:
```html
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
<meta 
  http-equiv="Content-Security-Policy" 
  content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self' http://localhost:3000 ws: http:;" 
/>
```
Evita el secuestro de tipos MIME (*sniffing*), fugas de referencias entre orígenes e inyecciones de scripts remotos no autorizados.

---

## 💻 Guía de Vistas y Componentes

### 1. `Login.jsx`
- Formulario de credenciales con visualizador/ocultador seguro de contraseñas.
- Pantalla de bloqueo por fuerza bruta con temporizador interactivo.
- Botones de **Acceso Rápido** para testing inmediato de perfiles:
  - **Admin**: `admin` / `Admin123!`
  - **Docente**: `docente.ramirez` / `Docente123!`
  - **Alumno**: `alumno.20230001` / `Alumno123!`

### 2. `Dashboard.jsx`
- **Barra de Navegación**: Identidad institucional, selector de módulos (**Gestión Escolar** y **Auditoría & Seguridad**), selector de roles RBAC, avatar de perfil y botón de salida segura.
- **Tarjetas KPI**: Resumen numérico en tiempo real de alumnos, promedio escolar, asignaturas registradas y tasa de aprobación.
- **Barra de Herramientas**: Búsqueda en vivo (por nombre, matrícula o materia), filtro por semestre, botón de actualización con indicador de carga y exportación a CSV saneado.
- **Tabla Académica**: Listado con iniciales estilizadas, chips de matrícula, semestres y badges cromáticos de calificaciones (Verde: sobresaliente, Azul: regular/aprobado, Rojo: en riesgo).
- **Modal de Inactividad**: Alerta de cierre de sesión con cuenta regresiva.

### 3. `AuditView.jsx`
- Panel especializado en auditoría y control de seguridad.
- Selector de 3 pestañas principales (Logs, Intentos de Acceso, Usuarios).
- Barra de herramientas con filtros por tipo de evento y exportación protegida a CSV de auditoría.
- Alerta dinámica por concentración de intentos fallidos por IP.

### 4. `Icons.jsx`
- Iconos vectoriales construidos en SVG puro (sin dependencias externas pesadas).
- Incluye iconos temáticos de ciberseguridad: `Shield`, `ShieldAlert`, `ShieldCheck`, `Activity`, `Clock`, `Key`, `Database`, `UserCheck`, `UserX`, `AlertTriangle`.

---

## 📱 Diseño Responsivo y Soporte Móvil

La interfaz se adapta fluidamente a cualquier factor de forma:

| Dispositivo / Resolución | Adaptaciones Implementadas |
| :--- | :--- |
| **Escritorio (> 1024px)** | Layout expandido con barra de navegación en línea, cuadrícula de 4 KPIs y tabla completa. |
| **Tablets (768px - 1024px)**| Cuadrícula de KPIs en formato 2×2, cabecera con espacio optimizado y filtros colapsables. |
| **Móviles (480px - 768px)** | Cabecera en 2 niveles (fila superior: marca y avatar; fila inferior: selector de módulos segmentado). Búsqueda y botones de acción en ancho completo. Tablas con desplazamiento táctil horizontal (`touch-scroll`). |
| **Teléfonos pequeños (< 480px)** | Botón de salida en modo solo icono para ahorrar espacio. Pestañas de auditoría con deslizamiento horizontal tipo píldora (`swipeable tabs`). Inputs con tamaño de fuente de 16px para evitar auto-zoom en iOS Safari. |

---

## 🚀 Guía de Ejecución y Despliegue

### Requisitos Previos
- **Node.js** v18 o superior.
- Gestor de paquetes **npm**.

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Ejecución en Desarrollo
En PowerShell (Windows):
```powershell
npm.cmd run dev
```
o mediante Símbolo del Sistema (CMD):
```cmd
npm run dev
```
La aplicación iniciará en `http://localhost:5173/`.

### 3. Compilación para Producción (Build)
Para verificar la integridad del código y compilar la versión optimizada:
```cmd
npm run build
```
Los archivos de distribución listos para desplegar en cualquier servidor estático (Nginx, Apache, Cloudflare Pages, Vercel) se generarán en la carpeta `dist/`.

---

## 🔒 Configuración para Git

Para asegurar que los cambios del frontend se suban de forma limpia y **sin alterar el repositorio del backend**, la carpeta del backend está explícitamente ignorada en [`.gitignore`](file:///c:/siga-frontend/.gitignore):

```gitignore
node_modules/
dist/
dist-ssr/
*.local
.env
.env.*
.DS_Store
siga-backend/
```

Al ejecutar `git status`, únicamente se registrarán los archivos pertenecientes a la aplicación cliente (`src/`, `index.html`, etc.), garantizando que la entrega del frontend no afecte la configuración del servidor remoto.

---

### 🎓 Resumen de Cumplimiento Técnico
- ✅ **Frontend Hardening**: Implementado (XSS, CSV Formula Injection, CSP, JWT Expiry).
- ✅ **RBAC**: Implementado (Admin, Docente, Alumno con panel de control).
- ✅ **Auditoría & Trazabilidad**: Implementado (Integración con `auditoria.logs`, `seguridad.intentos_fallidos` y `seguridad.usuarios`).
- ✅ **Manejo de Rate-Limit (429)**: Implementado con pantalla de bloqueo y temporizador de 15 minutos.
- ✅ **Diseño Responsivo**: 100% optimizado para Smartphones, Tablets y Escritorio.
- ✅ **Independencia del Backend**: Compatible con API real o en modo standalone con respaldo de datos.
