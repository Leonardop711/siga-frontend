import { useState, useEffect, useMemo } from 'react';
import { getLogs, getIntentos, getUsuarios } from '../services/api';
import { sanitizeForCSV } from '../utils/security';
import { 
  Shield, 
  ShieldCheck,
  ShieldAlert, 
  Activity, 
  Clock, 
  RotateCw, 
  Search, 
  FileSpreadsheet, 
  User, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Database,
  Filter
} from './Icons';

const AuditView = () => {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'intentos' | 'usuarios'
  const [logs, setLogs] = useState([]);
  const [intentos, setIntentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchAuditData = async () => {
    setLoading(true);
    setError('');
    try {
      const [logsData, intentosData, usuariosData] = await Promise.all([
        getLogs(),
        getIntentos(),
        getUsuarios()
      ]);
      
      setLogs(Array.isArray(logsData) ? logsData : []);
      setIntentos(Array.isArray(intentosData) ? intentosData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
    } catch (err) {
      setError(err.message || 'Error al obtener los registros de auditoría y seguridad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  // Formateador de fecha amigable y seguro
  const formatDate = (isoString) => {
    if (!isoString) return 'Fecha no disponible';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      }).format(date);
    } catch {
      return String(isoString);
    }
  };

  // KPIs de Intentos de Acceso
  const intentoStats = useMemo(() => {
    const total = intentos.length;
    const exitosos = intentos.filter(i => i.exitoso).length;
    const fallidos = total - exitosos;
    const ips = new Set(intentos.map(i => i.ip).filter(Boolean));
    
    // Detección de posibles patrones de fuerza bruta (más de 2 fallos de la misma IP)
    const ipFailures = {};
    intentos.forEach(i => {
      if (!i.exitoso && i.ip) {
        ipFailures[i.ip] = (ipFailures[i.ip] || 0) + 1;
      }
    });
    const suspiciousIps = Object.entries(ipFailures).filter(([, count]) => count >= 2);

    return {
      total,
      exitosos,
      fallidos,
      uniqueIps: ips.size,
      suspiciousIps
    };
  }, [intentos]);

  // KPIs de Usuarios
  const userStats = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter(u => u.rol?.toLowerCase() === 'admin').length;
    const docentes = usuarios.filter(u => u.rol?.toLowerCase() === 'docente').length;
    const alumnos = usuarios.filter(u => u.rol?.toLowerCase() === 'alumno').length;
    const activos = usuarios.filter(u => u.activo).length;

    return { total, admins, docentes, alumnos, activos };
  }, [usuarios]);

  // Lista filtrada de Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesAction = selectedAction === 'all' || log.accion === selectedAction;
      const query = searchTerm.toLowerCase().trim();
      if (!query) return matchesAction;

      const user = String(log.usuario || '').toLowerCase();
      const action = String(log.accion || '').toLowerCase();
      const details = String(log.detalles || '').toLowerCase();
      const ip = String(log.ip || '').toLowerCase();

      return matchesAction && (user.includes(query) || action.includes(query) || details.includes(query) || ip.includes(query));
    });
  }, [logs, searchTerm, selectedAction]);

  // Lista filtrada de Intentos
  const filteredIntentos = useMemo(() => {
    return intentos.filter(intento => {
      const matchesStatus = 
        selectedStatus === 'all' ? true :
        selectedStatus === 'success' ? intento.exitoso :
        !intento.exitoso;

      const query = searchTerm.toLowerCase().trim();
      if (!query) return matchesStatus;

      const user = String(intento.usuario || '').toLowerCase();
      const ip = String(intento.ip || '').toLowerCase();

      return matchesStatus && (user.includes(query) || ip.includes(query));
    });
  }, [intentos, searchTerm, selectedStatus]);

  // Exportar logs a CSV con protección contra Inyección de Fórmulas (CWE-1236)
  const handleExportAuditCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Fecha', 'Acción', 'Usuario', 'Detalles', 'Dirección IP'];
    const rows = filteredLogs.map(l => [
      sanitizeForCSV(l.id),
      sanitizeForCSV(l.fecha),
      sanitizeForCSV(l.accion),
      sanitizeForCSV(l.usuario),
      sanitizeForCSV(l.detalles),
      sanitizeForCSV(l.ip)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIGA_Auditoria_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderizador de Badge según tipo de acción
  const renderActionBadge = (accion) => {
    const act = (accion || '').toUpperCase();
    if (act.includes('LOGIN_SUCCESS')) {
      return <span className="audit-pill success"><CheckCircle2 size={12} /> {act}</span>;
    }
    if (act.includes('FAIL') || act.includes('UNAUTHORIZED') || act.includes('BLOCK')) {
      return <span className="audit-pill danger"><ShieldAlert size={12} /> {act}</span>;
    }
    if (act.includes('LOG') || act.includes('INTENTO') || act.includes('USUARIO')) {
      return <span className="audit-pill purple"><Shield size={12} /> {act}</span>;
    }
    return <span className="audit-pill blue"><Activity size={12} /> {act}</span>;
  };

  // Renderizador de Badge de Rol
  const renderRoleBadge = (rol) => {
    const r = (rol || '').toLowerCase();
    if (r === 'admin') return <span className="role-chip admin">Administrador</span>;
    if (r === 'docente') return <span className="role-chip docente">Docente</span>;
    return <span className="role-chip alumno">Estudiante</span>;
  };

  return (
    <div className="audit-view-container">
      {/* Encabezado del Módulo */}
      <div className="audit-header">
        <div className="audit-title-block">
          <div className="audit-icon-badge">
            <Shield size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="audit-title">Centro de Ciberseguridad & Auditoría</h2>
            <p className="audit-subtitle">
              Trazabilidad integral de accesos, prevención de fuerza bruta y control de privilegios del sistema
            </p>
          </div>
        </div>

        <div className="audit-header-actions">
          <button 
            onClick={fetchAuditData} 
            className="action-btn"
            disabled={loading}
            title="Refrescar registros"
          >
            <RotateCw size={15} className={loading ? "spinner" : ""} />
            <span>Sincronizar</span>
          </button>
          {activeTab === 'logs' && (
            <button 
              onClick={handleExportAuditCSV} 
              className="action-btn"
              disabled={filteredLogs.length === 0}
              title="Descargar registro de auditoría protegido"
            >
              <FileSpreadsheet size={15} />
              <span>Exportar Logs (Seguro)</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta si hay IPs con múltiples fallos (Detección de Fuerza Bruta) */}
      {intentoStats.suspiciousIps.length > 0 && (
        <div className="security-alert-box">
          <div className="security-alert-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="security-alert-text">
            <strong>Alerta de Seguridad Activa:</strong> Se detectaron {intentoStats.suspiciousIps.length} dirección(es) IP con múltiples intentos fallidos de autenticación ({intentoStats.suspiciousIps.map(([ip, cnt]) => `${ip} [${cnt} fallos]`).join(', ')}). El limitador de tasa (Rate Limiting de 5 intentos / 15 min) protege el acceso.
          </div>
        </div>
      )}

      {/* Selector de Pestañas */}
      <div className="audit-tabs">
        <button 
          className={`audit-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => { setActiveTab('logs'); setSearchTerm(''); }}
        >
          <Activity size={16} />
          <span>Trazabilidad & Logs ({logs.length})</span>
        </button>
        <button 
          className={`audit-tab-btn ${activeTab === 'intentos' ? 'active' : ''}`}
          onClick={() => { setActiveTab('intentos'); setSearchTerm(''); }}
        >
          <ShieldAlert size={16} />
          <span>Intentos de Acceso & Fuerza Bruta ({intentos.length})</span>
        </button>
        <button 
          className={`audit-tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => { setActiveTab('usuarios'); setSearchTerm(''); }}
        >
          <UserCheck size={16} />
          <span>Cuentas & Privilegios RBAC ({usuarios.length})</span>
        </button>
      </div>

      {error && (
        <div className="dashboard-error-banner" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 1: LOGS DE AUDITORÍA
          ========================================================================= */}
      {activeTab === 'logs' && (
        <section className="data-card">
          <div className="data-toolbar">
            <div className="toolbar-search-filter">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input 
                  type="text"
                  placeholder="Buscar por usuario, acción, detalle o IP..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <select 
                value={selectedAction} 
                onChange={e => setSelectedAction(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todas las acciones</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="READ_ALUMNOS">READ_ALUMNOS</option>
                <option value="READ_LOG">READ_LOG</option>
                <option value="READ_CALIFICACION">READ_CALIFICACION</option>
                <option value="AUTH_FAILED">AUTH_FAILED</option>
              </select>
            </div>

            <div className="table-count-tag">
              <span>{filteredLogs.length} eventos registrados</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Fecha y Hora</th>
                  <th>Acción Auditada</th>
                  <th>Usuario</th>
                  <th>Detalles del Evento</th>
                  <th>IP Origen</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-row">
                      <div className="loading-content">
                        <Loader2 size={24} className="spinner" />
                        <span>Cargando registro criptográfico de auditoría...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <Activity size={28} />
                        <h4 className="empty-state-title">No hay logs coincidentes</h4>
                        <p className="empty-state-desc">Ajusta los términos de búsqueda o filtros para consultar otros registros.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <span className="log-id-badge">#{log.id}</span>
                      </td>
                      <td>
                        <div className="date-time-cell">
                          <Clock size={13} />
                          <span>{formatDate(log.fecha)}</span>
                        </div>
                      </td>
                      <td>
                        {renderActionBadge(log.accion)}
                      </td>
                      <td>
                        <div className="user-table-cell">
                          <User size={14} />
                          <strong>{log.usuario || 'Anónimo'}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="log-details-text">{log.detalles || 'Sin detalles adicionales'}</span>
                      </td>
                      <td>
                        <code className="ip-chip">{log.ip || 'Local/Desconocida'}</code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =========================================================================
          PESTAÑA 2: INTENTOS DE ACCESO Y FUERZA BRUTA
          ========================================================================= */}
      {activeTab === 'intentos' && (
        <div className="intentos-container">
          {/* Métricas de Intentos */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <Activity size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Intentos</span>
                <span className="stat-value">{intentoStats.total}</span>
                <span className="stat-subtext">Histórico monitoreado</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Accesos Exitosos</span>
                <span className="stat-value">{intentoStats.exitosos}</span>
                <span className="stat-subtext">Credenciales válidas</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon amber">
                <ShieldAlert size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Intentos Bloqueados/Fallidos</span>
                <span className="stat-value">{intentoStats.fallidos}</span>
                <span className="stat-subtext">Fuerza bruta neutralizada</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon indigo">
                <Database size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">IPs Únicas</span>
                <span className="stat-value">{intentoStats.uniqueIps}</span>
                <span className="stat-subtext">Ubicaciones de origen</span>
              </div>
            </div>
          </div>

          <section className="data-card" style={{ marginTop: '1.5rem' }}>
            <div className="data-toolbar">
              <div className="toolbar-search-filter">
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text"
                    placeholder="Buscar por usuario o IP de intento..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <select 
                  value={selectedStatus} 
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos los resultados</option>
                  <option value="success">Solo Exitosos</option>
                  <option value="failed">Solo Fallidos / Bloqueados</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha del Intento</th>
                    <th>Usuario Objetivo</th>
                    <th>Estado de Autenticación</th>
                    <th>Dirección IP Origen</th>
                    <th>Medida de Seguridad</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="loading-row">
                        <div className="loading-content">
                          <Loader2 size={24} className="spinner" />
                          <span>Analizando intentos de autenticación...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredIntentos.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state">
                          <ShieldCheck size={28} />
                          <h4 className="empty-state-title">No hay intentos registrados</h4>
                          <p className="empty-state-desc">No se encontraron registros bajo los filtros actuales.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredIntentos.map(intento => (
                      <tr key={intento.id}>
                        <td>
                          <span className="log-id-badge">#{intento.id}</span>
                        </td>
                        <td>
                          <div className="date-time-cell">
                            <Clock size={13} />
                            <span>{formatDate(intento.fecha_intento)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="user-table-cell">
                            <User size={14} />
                            <strong>{intento.usuario}</strong>
                          </div>
                        </td>
                        <td>
                          {intento.exitoso ? (
                            <span className="audit-pill success">
                              <CheckCircle2 size={12} /> Acceso Correcto
                            </span>
                          ) : (
                            <span className="audit-pill danger">
                              <ShieldAlert size={12} /> Fallido / Rechazado
                            </span>
                          )}
                        </td>
                        <td>
                          <code className="ip-chip">{intento.ip || '127.0.0.1'}</code>
                        </td>
                        <td>
                          <span className="policy-badge">
                            {intento.exitoso ? 'Sesión Autorizada (JWT 1h)' : 'Rate Limiting Activo (5 max / 15m)'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 3: GESTIÓN DE CUENTAS Y PRIVILEGIOS RBAC
          ========================================================================= */}
      {activeTab === 'usuarios' && (
        <div className="usuarios-container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon indigo">
                <UserCheck size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Cuentas Totales</span>
                <span className="stat-value">{userStats.total}</span>
                <span className="stat-subtext">{userStats.activos} activas en sistema</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <Shield size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Administradores</span>
                <span className="stat-value">{userStats.admins}</span>
                <span className="stat-subtext">Privilegios totales (RBAC)</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">
                <User size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Docentes</span>
                <span className="stat-value">{userStats.docentes}</span>
                <span className="stat-subtext">Gestión académica</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <Activity size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Estudiantes</span>
                <span className="stat-value">{userStats.alumnos}</span>
                <span className="stat-subtext">Acceso a consulta propia</span>
              </div>
            </div>
          </div>

          <section className="data-card" style={{ marginTop: '1.5rem' }}>
            <div className="data-toolbar">
              <div className="table-count-tag">
                <Shield size={15} />
                <span>Políticas de Hash: Criptografía BCrypt (Work Factor 12) + Control RBAC</span>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre de Usuario</th>
                    <th>Rol en el Sistema (RBAC)</th>
                    <th>Estado de la Cuenta</th>
                    <th>Fecha de Registro</th>
                    <th>Nivel de Seguridad</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="loading-row">
                        <div className="loading-content">
                          <Loader2 size={24} className="spinner" />
                          <span>Cargando cuentas y privilegios...</span>
                        </div>
                      </td>
                    </tr>
                  ) : usuarios.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state">
                          <UserX size={28} />
                          <h4 className="empty-state-title">No hay usuarios registrados</h4>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    usuarios.map(user => (
                      <tr key={user.id}>
                        <td>
                          <span className="log-id-badge">#{user.id}</span>
                        </td>
                        <td>
                          <div className="user-table-cell">
                            <User size={14} />
                            <strong>{user.username}</strong>
                          </div>
                        </td>
                        <td>
                          {renderRoleBadge(user.rol)}
                        </td>
                        <td>
                          {user.activo ? (
                            <span className="audit-pill success">
                              <CheckCircle2 size={12} /> Activo
                            </span>
                          ) : (
                            <span className="audit-pill danger">
                              <UserX size={12} /> Inactivo / Bloqueado
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="date-time-cell">
                            <Clock size={13} />
                            <span>{formatDate(user.creado_en)}</span>
                          </div>
                        </td>
                        <td>
                          <span className="security-check-tag">
                            Hash BCrypt • JWT 60m
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AuditView;
