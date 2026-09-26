import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlumnos } from '../services/api';
import { clearAuth, isAuthenticated } from '../utils/auth';
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
  CheckCircle2
} from './Icons';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const navigate = useNavigate();
  
  const username = localStorage.getItem('username') || 'Usuario';
  const rol = localStorage.getItem('rol') || 'Estudiante';

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAlumnos();
      // Ensure data is an array
      const alumnosList = Array.isArray(result) ? result : (result?.data || []);
      setData(alumnosList);
    } catch (err) {
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

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  // Extract unique semesters for dropdown filter
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

  // Filter data based on search and semester filter
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchesSemester = selectedSemester === 'all' || String(row.semestre) === selectedSemester;
      
      const query = searchTerm.toLowerCase().trim();
      if (!query) return matchesSemester;

      const fullName = `${row.nombre || ''} ${row.apellido || ''}`.toLowerCase();
      const matricula = String(row.matricula || '').toLowerCase();
      const asignatura = String(row.asignatura || '').toLowerCase();

      const matchesSearch = fullName.includes(query) || 
                            matricula.includes(query) || 
                            asignatura.includes(query);

      return matchesSemester && matchesSearch;
    });
  }, [data, searchTerm, selectedSemester]);

  // Compute Academic KPIs
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
          // Typical passing threshold: >= 6 (on 10 scale) or >= 60/70 (on 100 scale)
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

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = ['Matrícula', 'Nombre Completo', 'Semestre', 'Asignatura', 'Calificación'];
    const rows = filteredData.map(r => [
      `"${r.matricula || ''}"`,
      `"${r.nombre || ''} ${r.apellido || ''}"`,
      `"${r.semestre || ''}"`,
      `"${r.asignatura || ''}"`,
      `"${r.calificacion || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIGA_Reporte_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for grade pill styling
  const renderGradeBadge = (calificacion) => {
    if (calificacion === undefined || calificacion === null || calificacion === '') {
      return <span className="grade-badge none">N/A</span>;
    }

    const num = parseFloat(calificacion);
    if (isNaN(num)) {
      return <span className="grade-badge regular">{calificacion}</span>;
    }

    // Normalizing scale (1-10 or 1-100)
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

    if (isPassing) {
      return <span className="grade-badge regular">{num}</span>;
    }

    return <span className="grade-badge danger">{num}</span>;
  };

  const getInitials = (nombre, apellido) => {
    const first = (nombre || '').trim().charAt(0);
    const last = (apellido || '').trim().charAt(0);
    return (first + last).toUpperCase() || 'AL';
  };

  const userInitial = (username || 'U').charAt(0).toUpperCase();

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <header className="dashboard-navbar">
        <div className="navbar-inner">
          <div className="brand-section">
            <div className="brand-icon-wrapper">
              <GraduationCap size={24} />
            </div>
            <div className="brand-titles">
              <h2 className="brand-title">SIGA</h2>
              <span className="brand-tagline">Sistema Integral de Gestión Académica</span>
            </div>
          </div>

          <div className="user-nav-controls">
            <div className="user-profile-badge">
              <div className="user-avatar-circle" title={username}>
                {userInitial}
              </div>
              <div className="user-details">
                <span className="user-name-text">{username}</span>
                <span className="user-role-pill">{rol}</span>
              </div>
            </div>

            <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Hero Section */}
        <section className="dashboard-hero">
          <div className="hero-titles">
            <h1>Panel de Control Académico</h1>
            <p>Monitoreo, calificaciones y seguimiento integral del ciclo lectivo</p>
          </div>
        </section>

        {/* Error banner if present */}
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
              <span className="stat-subtext">Estudiantes registrados</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <Award size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Promedio General</span>
              <span className="stat-value">{stats.averageGrade}</span>
              <span className="stat-subtext">Rendimiento global</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon indigo">
              <BookOpen size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Asignaturas</span>
              <span className="stat-value">{stats.uniqueSubjects}</span>
              <span className="stat-subtext">Cursos activos</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon amber">
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Tasa de Aprobación</span>
              <span className="stat-value">{stats.approvalRate}</span>
              <span className="stat-subtext">Calificaciones satisfactorias</span>
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
                title="Actualizar datos"
                disabled={loading}
              >
                <RotateCw size={15} className={loading ? "spinner" : ""} />
                <span>Actualizar</span>
              </button>

              <button 
                onClick={handleExportCSV} 
                className="action-btn"
                title="Descargar reporte en formato CSV"
                disabled={filteredData.length === 0}
              >
                <FileSpreadsheet size={15} />
                <span>Exportar CSV</span>
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
                        <span className="matricula-chip">{row.matricula || 'S/M'}</span>
                      </td>
                      <td>
                        <div className="student-cell">
                          <div className="student-initials">
                            {getInitials(row.nombre, row.apellido)}
                          </div>
                          <div className="student-info">
                            <span className="student-name">
                              {row.nombre} {row.apellido}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="semester-badge">
                          Semestre {row.semestre || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="subject-cell">{row.asignatura || 'N/A'}</span>
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
              <span>
                SIGA • Módulo de Gestión Escolar
              </span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
