import { useState } from 'react';
import { createAlumno, createCalificacion, createUsuario } from '../services/api';
import { 
  X, 
  GraduationCap, 
  Award, 
  User, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  BookOpen,
  Eye,
  EyeOff
} from './Icons';

const DataInsertionModal = ({ isOpen, onClose, onSuccess, existingAlumnos = [] }) => {
  const [activeTab, setActiveTab] = useState('alumno'); // 'alumno' | 'calificacion' | 'usuario'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State: Alumno
  const [alumnoForm, setAlumnoForm] = useState({
    matricula: '',
    nombre: '',
    apellido: '',
    semestre: '1'
  });

  // Form State: Calificación
  const [calificacionForm, setCalificacionForm] = useState({
    matricula: '',
    asignatura: '',
    calificacion: ''
  });

  // Form State: Usuario
  const [usuarioForm, setUsuarioForm] = useState({
    username: '',
    password: '',
    rol: 'docente',
    activo: true
  });

  if (!isOpen) return null;

  const resetFeedback = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Preset / Demo autofills for rapid evaluation
  const handleFillDemoAlumno = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const names = ['Fernando', 'Camila', 'Santiago', 'Valentina', 'Mateo', 'Lucía'];
    const lastNames = ['Morales', 'Vásquez', 'Castillo', 'Navarro', 'Reyes', 'Paredes'];
    const name = names[Math.floor(Math.random() * names.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    setAlumnoForm({
      matricula: `2024${randomNum}`,
      nombre: name,
      apellido: lastName,
      semestre: String(Math.floor(Math.random() * 8) + 1)
    });
    resetFeedback();
  };

  const handleFillDemoCalificacion = () => {
    const subjects = [
      'Seguridad en Redes',
      'Criptografía Aplicada',
      'Desarrollo Web Seguro',
      'Forense Digital',
      'Arquitectura de Software',
      'Sistemas Distribuidos'
    ];
    const defaultMatricula = existingAlumnos.length > 0 
      ? existingAlumnos[Math.floor(Math.random() * existingAlumnos.length)].matricula 
      : '20230001';

    setCalificacionForm({
      matricula: defaultMatricula,
      asignatura: subjects[Math.floor(Math.random() * subjects.length)],
      calificacion: (Math.floor(Math.random() * 30 + 70) / 10).toFixed(1)
    });
    resetFeedback();
  };

  const handleFillDemoUsuario = () => {
    const roles = ['docente', 'alumno', 'admin'];
    const chosenRole = roles[Math.floor(Math.random() * roles.length)];
    const randomId = Math.floor(100 + Math.random() * 900);
    
    setUsuarioForm({
      username: `${chosenRole}.${randomId}`,
      password: 'Password123!',
      rol: chosenRole,
      activo: true
    });
    resetFeedback();
  };

  // Submit Alumno
  const handleSubmitAlumno = async (e) => {
    e.preventDefault();
    resetFeedback();
    
    if (!alumnoForm.matricula.trim() || !alumnoForm.nombre.trim() || !alumnoForm.apellido.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos del alumno.');
      return;
    }

    setLoading(true);
    try {
      const res = await createAlumno(alumnoForm);
      setSuccessMsg(res.message || `¡Alumno ${alumnoForm.nombre} ${alumnoForm.apellido} registrado exitosamente!`);
      setAlumnoForm({ matricula: '', nombre: '', apellido: '', semestre: '1' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Error al insertar alumno en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Calificación
  const handleSubmitCalificacion = async (e) => {
    e.preventDefault();
    resetFeedback();

    if (!calificacionForm.matricula.trim() || !calificacionForm.asignatura.trim() || !calificacionForm.calificacion) {
      setErrorMsg('Matrícula, asignatura y calificación son requeridos.');
      return;
    }

    const val = parseFloat(calificacionForm.calificacion);
    if (isNaN(val) || val < 0 || val > 10) {
      setErrorMsg('La calificación debe estar entre 0.0 y 10.0');
      return;
    }

    setLoading(true);
    try {
      const res = await createCalificacion(calificacionForm);
      setSuccessMsg(res.message || `¡Calificación asignada con éxito a matrícula ${calificacionForm.matricula}!`);
      setCalificacionForm({ matricula: '', asignatura: '', calificacion: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Error al insertar calificación.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Usuario
  const handleSubmitUsuario = async (e) => {
    e.preventDefault();
    resetFeedback();

    if (!usuarioForm.username.trim() || !usuarioForm.password) {
      setErrorMsg('Nombre de usuario y contraseña son requeridos.');
      return;
    }

    if (usuarioForm.password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await createUsuario(usuarioForm);
      setSuccessMsg(res.message || `¡Usuario '${usuarioForm.username}' creado con rol ${usuarioForm.rol}!`);
      setUsuarioForm({ username: '', password: '', rol: 'docente', activo: true });
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Error al crear usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="modal-title">Inserción de Datos en el Sistema</h2>
              <p className="modal-subtitle">Prueba y registro de nuevos registros sincronizados con la Base de Datos</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="modal-tab-nav">
          <button 
            type="button"
            className={`modal-tab-btn ${activeTab === 'alumno' ? 'active' : ''}`}
            onClick={() => { setActiveTab('alumno'); resetFeedback(); }}
          >
            <GraduationCap size={16} />
            <span>Registrar Alumno</span>
          </button>
          
          <button 
            type="button"
            className={`modal-tab-btn ${activeTab === 'calificacion' ? 'active' : ''}`}
            onClick={() => { setActiveTab('calificacion'); resetFeedback(); }}
          >
            <Award size={16} />
            <span>Registrar Calificación</span>
          </button>

          <button 
            type="button"
            className={`modal-tab-btn ${activeTab === 'usuario' ? 'active' : ''}`}
            onClick={() => { setActiveTab('usuario'); resetFeedback(); }}
          >
            <User size={16} />
            <span>Registrar Usuario</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="modal-alert error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="modal-alert success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="modal-body">
          {/* TAB 1: REGISTRAR ALUMNO */}
          {activeTab === 'alumno' && (
            <form onSubmit={handleSubmitAlumno} className="modal-form">
              <div className="demo-helper-bar">
                <span className="demo-helper-text">Tabla objetivo: <code>academico.alumnos</code></span>
                <button 
                  type="button" 
                  onClick={handleFillDemoAlumno} 
                  className="demo-fill-btn"
                  title="Llenar con datos aleatorios de prueba"
                >
                  <Sparkles size={14} />
                  <span>Autollenar Ejemplo</span>
                </button>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="alumno-matricula">Matrícula Escolar *</label>
                  <div className="input-with-icon">
                    <input 
                      id="alumno-matricula"
                      type="text" 
                      placeholder="Ej. 20240101"
                      value={alumnoForm.matricula}
                      onChange={(e) => setAlumnoForm({ ...alumnoForm, matricula: e.target.value })}
                      required
                    />
                  </div>
                  <span className="input-hint">Clave única primaria identificadora</span>
                </div>

                <div className="form-group">
                  <label htmlFor="alumno-semestre">Semestre Cursando *</label>
                  <select 
                    id="alumno-semestre"
                    value={alumnoForm.semestre}
                    onChange={(e) => setAlumnoForm({ ...alumnoForm, semestre: e.target.value })}
                    className="modal-select"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                      <option key={sem} value={sem}>Semestre {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="alumno-nombre">Nombre(s) *</label>
                  <input 
                    id="alumno-nombre"
                    type="text" 
                    placeholder="Ej. Carlos Alberto"
                    value={alumnoForm.nombre}
                    onChange={(e) => setAlumnoForm({ ...alumnoForm, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="alumno-apellido">Apellidos *</label>
                  <input 
                    id="alumno-apellido"
                    type="text" 
                    placeholder="Ej. Gómez Hernández"
                    value={alumnoForm.apellido}
                    onChange={(e) => setAlumnoForm({ ...alumnoForm, apellido: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" onClick={onClose} className="modal-btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Registrando en BD...</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap size={16} />
                      <span>Insertar Alumno</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTRAR CALIFICACIÓN */}
          {activeTab === 'calificacion' && (
            <form onSubmit={handleSubmitCalificacion} className="modal-form">
              <div className="demo-helper-bar">
                <span className="demo-helper-text">Tabla objetivo: <code>academico.calificaciones</code></span>
                <button 
                  type="button" 
                  onClick={handleFillDemoCalificacion} 
                  className="demo-fill-btn"
                  title="Llenar con datos aleatorios de prueba"
                >
                  <Sparkles size={14} />
                  <span>Autollenar Ejemplo</span>
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="calif-matricula">Matrícula del Alumno *</label>
                <div className="input-with-datalist">
                  <input 
                    id="calif-matricula"
                    type="text" 
                    list="alumnos-list"
                    placeholder="Selecciona o escribe la matrícula..."
                    value={calificacionForm.matricula}
                    onChange={(e) => setCalificacionForm({ ...calificacionForm, matricula: e.target.value })}
                    required
                  />
                  <datalist id="alumnos-list">
                    {existingAlumnos.map((a, i) => (
                      <option key={`${a.matricula}-${i}`} value={a.matricula}>
                        {a.nombre} {a.apellido} (Semestre {a.semestre})
                      </option>
                    ))}
                  </datalist>
                </div>
                <span className="input-hint">Debe pertenecer a un alumno previamente registrado</span>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="calif-asignatura">Materia / Asignatura *</label>
                  <input 
                    id="calif-asignatura"
                    type="text" 
                    placeholder="Ej. Criptografía Aplicada"
                    value={calificacionForm.asignatura}
                    onChange={(e) => setCalificacionForm({ ...calificacionForm, asignatura: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="calif-nota">Calificación (0.0 a 10.0) *</label>
                  <input 
                    id="calif-nota"
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="10" 
                    placeholder="Ej. 9.5"
                    value={calificacionForm.calificacion}
                    onChange={(e) => setCalificacionForm({ ...calificacionForm, calificacion: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" onClick={onClose} className="modal-btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Registrando Calificación...</span>
                    </>
                  ) : (
                    <>
                      <Award size={16} />
                      <span>Insertar Calificación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REGISTRAR USUARIO */}
          {activeTab === 'usuario' && (
            <form onSubmit={handleSubmitUsuario} className="modal-form">
              <div className="demo-helper-bar">
                <span className="demo-helper-text">Tabla objetivo: <code>seguridad.usuarios</code></span>
                <button 
                  type="button" 
                  onClick={handleFillDemoUsuario} 
                  className="demo-fill-btn"
                  title="Llenar con datos aleatorios de prueba"
                >
                  <Sparkles size={14} />
                  <span>Autollenar Ejemplo</span>
                </button>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="usr-username">Nombre de Usuario *</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-inner-icon" />
                    <input 
                      id="usr-username"
                      type="text" 
                      placeholder="Ej. docente.valdez"
                      value={usuarioForm.username}
                      onChange={(e) => setUsuarioForm({ ...usuarioForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <span className="input-hint">Mínimo 3 caracteres, alfanumérico</span>
                </div>

                <div className="form-group">
                  <label htmlFor="usr-rol">Rol en el Sistema *</label>
                  <select 
                    id="usr-rol"
                    value={usuarioForm.rol}
                    onChange={(e) => setUsuarioForm({ ...usuarioForm, rol: e.target.value })}
                    className="modal-select"
                  >
                    <option value="docente">Docente (Gestor Académico)</option>
                    <option value="alumno">Alumno (Estudiante)</option>
                    <option value="admin">Administrador (Control Total)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="usr-password">Contraseña (Se cifrará con BCrypt) *</label>
                <div className="input-with-icon password-group">
                  <Lock size={16} className="input-inner-icon" />
                  <input 
                    id="usr-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={usuarioForm.password}
                    onChange={(e) => setUsuarioForm({ ...usuarioForm, password: e.target.value })}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-password-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="input-hint">El backend procesará la contraseña con hash seguro BCrypt</span>
              </div>

              <div className="form-checkbox-row">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={usuarioForm.activo}
                    onChange={(e) => setUsuarioForm({ ...usuarioForm, activo: e.target.checked })}
                  />
                  <span className="checkbox-label">Cuenta activa inmediatamente en el sistema</span>
                </label>
              </div>

              <div className="modal-footer-actions">
                <button type="button" onClick={onClose} className="modal-btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Cifrando y Guardando...</span>
                    </>
                  ) : (
                    <>
                      <User size={16} />
                      <span>Crear Usuario</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataInsertionModal;
