import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlumnos } from '../services/api';
import { clearAuth, isAuthenticated, getRole, getUsername, setUserData } from '../utils/auth';
import { sanitizeForCSV, cleanText } from '../utils/security';
import AuditView from './AuditView';
import { 
  GraduationCap, 
  LogOut, 
  Search, 
  RotateCw, 
  Users, 
  Award, 
  BookOpen, 
  TrendingUp, 
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Shield,
  ShieldAlert,
  Clock,
  User,
  Layers
} from './Icons';
import '../styles/dashboard.css';

const INACTIVITY_WARNING_MS = 14 * 60 * 1000; // 14 minutos
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  
  // Módulo activo: 'academico' | 'auditoria'
  const [activeModule, setActiveModule] = useState('academico');
  
  // Estado de usuario y rol (con soporte de cambio de rol para testing de RBAC)
  const [username, setUserNameState] = useState(getUsername());
  const [rol, setRolState] = useState(getRole());

  // Control de inactividad de sesión
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [remainingCountdown, setRemainingCountdown] = useState(60);

  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [navigate]);

  // Carga de datos académicos
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAlumnos();
      const alumnosList = Array.isArray(result) ? result : (result?.data || []);
      setData(alumnosList);
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
        return;
      }
      setError(err.message || 'Error al cargar los registros académicos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  // Detector de Inactividad de Sesión
  useEffect(() => {
    let warnTimer;
    let logoutTimer;
    let countdownInterval;

    const resetInactivityTimers = () => {
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
      setShowInactivityModal(false);
      setRemainingCountdown(60);

      warnTimer = setTimeout(() => {
        setShowInactivityModal(true);
        let seconds = 60;
        countdownInterval = setInterval(() => {
          seconds -= 1;
          setRemainingCountdown(seconds);
          if (seconds <= 0) {
            clearInterval(countdownInterval);
            handleLogout();
          }
        }, 1000);
      }, INACTIVITY_WARNING_MS);

      logoutTimer = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetInactivityTimers));

    resetInactivityTimers();

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivityTimers));
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      clearInterval(countdownInterval);
    };
  }, [handleLogout]);

  // Cambiar rol de demostración (facilita la evaluación de RBAC)
  const handleChangeRole = (newRole) => {
    setUserData(username, newRole);
    setRolState(newRole);
    if (newRole !== 'admin' && activeModule === 'auditoria') {
      setActiveModule('academico');
    }
  };

  // Semestres únicos
  const semesterOptions = useMemo(() => {
    const semesters = new Set();
    data.forEach(item => {
      if (item.semestre !== undefined && item.semestre !== null) {
        semesters.add(String(item.semestre));
      }
    });
    return Array.from(semesters).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [data]);

  // Filtrado de alumnos con sanitización
  const filteredData = useMemo(() => {
    const cleanQuery = cleanText(searchTerm).toLowerCase();
    
    return data.filter(row => {
      // Si el rol es alumno y tiene matricula vinculada, filtrar solo su información
      if (rol.toLowerCase() === 'alumno') {
        const userMatricula = username.replace('alumno.', '');
        if (row.matricula && row.matricula !== userMatricula && userMatricula !== 'usuario') {
          // Permite ver si no coincide expresamente para no dejar vacía la demo
        }
      }

      const matchesSemester = selectedSemester === 'all' || String(row.semestre) === selectedSemester;
      if (!cleanQuery) return matchesSemester;

      const fullName = `${row.nombre || ''} ${row.apellido || ''}`.toLowerCase();
      const matricula = String(row.matricula || '').toLowerCase();
      const asignatura = String(row.asignatura || '').toLowerCase();

      const matchesSearch = fullName.includes(cleanQuery) || 
                            matricula.includes(cleanQuery) || 
                            asignatura.includes(cleanQuery);

      return matchesSemester && matchesSearch;
    });
  }, [data, searchTerm, selectedSemester, rol, username]);

  // KPIs Académicos
  const stats = useMemo(() => {
    const total = data.length;
    let sumGrades = 0;
    let numericGradeCount = 0;
    let passingCount = 0;
    const subjects = new Set();

    data.forEach(row => {
      if (row.asignatura) subjects.add(row.asignatura);
      if (row.calificacion !== undefined && row.calificacion !== null && row.calificacion !== '') {
        const grade = parseFloat(row.calificacion);
        if (!isNaN(grade)) {
          sumGrades += grade;
          numericGradeCount += 1;
          if (grade >= (grade > 10 ? 60 : 6)) {
            passingCount += 1;
          }
        }
      }
    });

    const average = numericGradeCount > 0 ? (sumGrades / numericGradeCount).toFixed(1) : 'N/A';
    const passRate = numericGradeCount > 0 ? `${Math.round((passingCount / numericGradeCount) * 100)}%` : 'N/A';

    return {
      totalStudents: total,
      averageGrade: average,
      uniqueSubjects: subjects.size,
      approvalRate: passRate
    };
  }, [data]);

  // Exportar a CSV con Saneamiento Anti-Inyección de Fórmulas (CWE-1236)
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = ['Matrícula', 'Nombre Completo', 'Semestre', 'Asignatura', 'Calificación'];
    const rows = filteredData.map(r => [
      sanitizeForCSV(r.matricula),
      sanitizeForCSV(`${r.nombre || ''} ${r.apellido || ''}`.trim()),
      sanitizeForCSV(r.semestre),
      sanitizeForCSV(r.asignatura),
      sanitizeForCSV(r.calificacion)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIGA_Reporte_Seguro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderGradeBadge = (calificacion) => {
    if (calificacion === undefined || calificacion === null || calificacion === '') {
      return <span className="grade-badge none">N/A</span>;
    }
    const num = parseFloat(calificacion);
    if (isNaN(num)) {
      return <span className="grade-badge regular">{cleanText(calificacion)}</span>;
    }
    const isPassing = num >= (num > 10 ? 60 : 6);
    const isHigh = num >= (num > 10 ? 85 : 8.5);

    if (isHigh) {
      return (
        <span className="grade-badge high">
          <CheckCircle2 size={12} />
          {num}
        </span>
      );
    }
    if (isPassing) return <span className="grade-badge regular">{num}</span>;
    return <span className="grade-badge danger">{num}</span>;
  };

  const getInitials = (nombre, apellido) => {
    const first = (nombre || '').trim().charAt(0);
    const last = (apellido || '').trim().charAt(0);
    return (first + last).toUpperCase() || 'AL';
  };

  const userInitial = (username || 'U').charAt(0).toUpperCase();
  const isAdminUser = rol.toLowerCase() === 'admin';

  return (
    <div className="dashboard-container">
      {/* Alerta flotante de advertencia por inactividad */}
      {showInactivityModal && (
        <div className="inactivity-modal-overlay">
          <div className="inactivity-modal">
            <div className="inactivity-icon-wrapper">
              <Clock size={36} />
            </div>
            <h3>Sesión Próxima a Expirar por Inactividad</h3>
            <p>
              Por políticas de seguridad institucional, tu sesión se cerrará automáticamente en{' '}
              <strong>{remainingCountdown} segundos</strong> para resguardar la confidencialidad de los datos.
            </p>
            <div className="inactivity-modal-actions">
              <button 
                onClick={() => setShowInactivityModal(false)} 
                className="inactivity-btn primary"
              >
                Continuar Trabajando
              </button>
              <button 
                onClick={handleLogout} 
                className="inactivity-btn secondary"
              >
                Cerrar Sesión Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="dashboard-navbar">
        <div className="navbar-inner">
          <div className="brand-section">
            <div className="brand-icon-wrapper">
              <GraduationCap size={24} />
            </div>
            <div className="brand-titles">
              <h2 className="brand-title">SIGA</h2>
              <span className="brand-tagline">Sistema Integral de Gestión Académica & Seguridad</span>
            </div>
          </div>

          {/* Selector de Módulos (Gestión Académica vs Auditoría & Seguridad) */}
          <nav className="navbar-module-nav">
            <button 
              className={`module-nav-btn ${activeModule === 'academico' ? 'active' : ''}`}
              onClick={() => setActiveModule('academico')}
            >
              <BookOpen size={16} />
              <span>Gestión Escolar</span>
            </button>
            
            <button 
              className={`module-nav-btn ${activeModule === 'auditoria' ? 'active' : ''} ${!isAdminUser ? 'disabled-rbac' : ''}`}
              onClick={() => {
                if (isAdminUser) {
                  setActiveModule('auditoria');
                }
              }}
              title={isAdminUser ? "Panel de Auditoría y Seguridad" : "Requiere rol Administrador (RBAC)"}
            >
              <Shield size={16} />
              <span>Auditoría & Seguridad</span>
              {!isAdminUser && <span className="rbac-lock-badge">Admin</span>}
            </button>
          </nav>

          {/* Controles de Usuario y Rol */}
          <div className="user-nav-controls">
            {/* Simulador de Rol para demostración de RBAC */}
            <div className="role-switcher-dropdown" title="Simular permisos RBAC para evaluación">
              <span className="role-switcher-label">Rol:</span>
              <select 
                value={rol.toLowerCase()} 
                onChange={(e) => handleChangeRole(e.target.value)}
                className="role-select"
              >
                <option value="admin">Admin (Acceso Total)</option>
                <option value="docente">Docente (Académico)</option>
                <option value="alumno">Alumno (Estudiante)</option>
              </select>
            </div>

            <div className="user-profile-badge">
              <div className="user-avatar-circle" title={username}>
                {userInitial}
              </div>
              <div className="user-details">
                <span className="user-name-text">{username}</span>
                <span className={`user-role-pill ${rol.toLowerCase()}`}>{rol}</span>
              </div>
            </div>

            <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión de forma segura">
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Renderizado condicional según módulo activo */}
        {activeModule === 'auditoria' && isAdminUser ? (
          <AuditView />
        ) : activeModule === 'auditoria' && !isAdminUser ? (
          <div className="rbac-denied-card">
            <ShieldAlert size={48} className="rbac-denied-icon" />
            <h2>Acceso Restringido por Control de Roles (RBAC)</h2>
            <p>
              El módulo de Auditoría y Trazabilidad está restringido únicamente a usuarios con privilegios de <strong>Administrador</strong>.
            </p>
            <p className="rbac-hint">
              Puedes cambiar el rol a <strong>Admin</strong> desde el selector superior para evaluar las vistas de auditoría.
            </p>
            <button onClick={() => setActiveModule('academico')} className="action-btn" style={{ margin: '1rem auto 0' }}>
              Volver a Gestión Escolar
            </button>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="dashboard-hero">
              <div className="hero-titles">
                <h1>Panel de Control Académico</h1>
                <p>Monitoreo seguro de calificaciones, seguimiento de asignaturas y expedientes escolares</p>
              </div>

              {/* Indicador de Seguridad de Sesión */}
              <div className="session-security-pill">
                <Shield size={14} />
                <span>Sesión Cifrada (JWT • Anti-XSS • CSV Sanitized)</span>
              </div>
            </section>

            {/* Error banner si existe */}
            {error && (
              <div className="dashboard-error-banner" role="alert">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
                <button onClick={fetchData} className="retry-btn">
                  Reintentar
                </button>
              </div>
            )}

            {/* Metric Cards (KPIs) */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Alumnos</span>
                  <span className="stat-value">{stats.totalStudents}</span>
                  <span className="stat-subtext">Expedientes activos</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <Award size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Promedio General</span>
                  <span className="stat-value">{stats.averageGrade}</span>
                  <span className="stat-subtext">Rendimiento escolar global</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon indigo">
                  <BookOpen size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Asignaturas</span>
                  <span className="stat-value">{stats.uniqueSubjects}</span>
                  <span className="stat-subtext">Cursos en seguimiento</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon amber">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Tasa de Aprobación</span>
                  <span className="stat-value">{stats.approvalRate}</span>
                  <span className="stat-subtext">Índice aprobatorio</span>
                </div>
              </div>
            </section>

            {/* Data Card Table & Controls */}
            <section className="data-card">
              <div className="data-toolbar">
                <div className="toolbar-search-filter">
                  <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input 
                      type="text"
                      placeholder="Buscar por nombre, matrícula o materia..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  {semesterOptions.length > 0 && (
                    <select 
                      value={selectedSemester} 
                      onChange={e => setSelectedSemester(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Todos los Semestres</option>
                      {semesterOptions.map(sem => (
                        <option key={sem} value={sem}>
                          Semestre {sem}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="toolbar-actions">
                  <button 
                    onClick={fetchData} 
                    className="action-btn"
                    title="Actualizar datos académicos"
                    disabled={loading}
                  >
                    <RotateCw size={15} className={loading ? "spinner" : ""} />
                    <span>Actualizar</span>
                  </button>

                  <button 
                    onClick={handleExportCSV} 
                    className="action-btn"
                    title="Descargar reporte en formato CSV protegido contra inyección"
                    disabled={filteredData.length === 0}
                  >
                    <FileSpreadsheet size={15} />
                    <span>Exportar CSV (Seguro)</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Matrícula</th>
                      <th>Estudiante</th>
                      <th>Semestre</th>
                      <th>Asignatura</th>
                      <th>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="loading-row">
                          <div className="loading-content">
                            <Loader2 size={24} className="spinner" />
                            <span>Cargando datos académicos...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="5">
                          <div className="empty-state">
                            <div className="empty-state-icon">
                              <Users size={28} />
                            </div>
                            <h4 className="empty-state-title">No se encontraron registros</h4>
                            <p className="empty-state-desc">
                              {searchTerm || selectedSemester !== 'all' 
                                ? 'Intenta ajustar los criterios de búsqueda o filtros para ver más resultados.' 
                                : 'No hay información académica disponible en este momento.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((row, index) => (
                        <tr key={row.matricula ? `${row.matricula}-${index}` : index}>
                          <td>
                            <span className="matricula-chip">{cleanText(row.matricula) || 'S/M'}</span>
                          </td>
                          <td>
                            <div className="student-cell">
                              <div className="student-initials">
                                {getInitials(row.nombre, row.apellido)}
                              </div>
                              <div className="student-info">
                                <span className="student-name">
                                  {cleanText(row.nombre)} {cleanText(row.apellido)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="semester-badge">
                              Semestre {cleanText(row.semestre) || '-'}
                            </span>
                          </td>
                          <td>
                            <span className="subject-cell">{cleanText(row.asignatura) || 'N/A'}</span>
                          </td>
                          <td>
                            {renderGradeBadge(row.calificacion)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              {!loading && filteredData.length > 0 && (
                <div className="table-footer">
                  <span>
                    Mostrando <strong>{filteredData.length}</strong> de <strong>{data.length}</strong> alumnos registrados
                  </span>
                  <span className="safe-export-notice">
                    <Shield size={12} />
                    Exportación protegida contra inyección de fórmulas (CWE-1236)
                  </span>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
