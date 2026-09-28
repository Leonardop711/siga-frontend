import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { setToken, setUserData } from '../utils/auth';
import { cleanText } from '../utils/security';
import {
  GraduationCap,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2
} from './Icons';
import '../styles/login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Manejo de intentos y bloqueo por fuerza bruta (Rate Limiting HTTP 429)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  const navigate = useNavigate();

  // Contador de bloqueo por fuerza bruta
  useEffect(() => {
    let timer;
    if (isLocked && lockCountdown > 0) {
      timer = setInterval(() => {
        setLockCountdown(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockCountdown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setError('');
    setLoading(true);

    const sanitizedUser = cleanText(username);

    try {
      const data = await loginUser({ username: sanitizedUser, password });

      setToken(data.token);
      setUserData(data.username, data.rol);
      setFailedAttempts(0);

      navigate('/dashboard');
    } catch (err) {
      // Si el servidor responde 429 (Demasiados intentos) o alcanzamos 5 intentos locales
      if (err.status === 429 || failedAttempts + 1 >= 5) {
        setIsLocked(true);
        setLockCountdown(15 * 60); // 15 minutos en segundos (política del backend)
        setError('Acceso bloqueado por políticas de ciberseguridad (Rate Limiting). Demasiados intentos fallidos.');
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        setError(
          `${err.message || 'Error al autenticar credenciales'}. Intento ${nextAttempts} de 5 antes de bloqueo temporal.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para rellenar credenciales de prueba con un clic
  const handleQuickFill = (roleName) => {
    if (roleName === 'admin') {
      setUsername('admin');
      setPassword('Admin123!');
    } else if (roleName === 'docente') {
      setUsername('docente.ramirez');
      setPassword('Docente123!');
    } else if (roleName === 'alumno') {
      setUsername('alumno.20230001');
      setPassword('Alumno123!');
    }
    setError('');
  };

  const formatLockTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-badge">
            <GraduationCap size={34} strokeWidth={2.2} />
          </div>
          <h2 className="login-title">SIGA</h2>
          <p className="login-subtitle">Sistema Integral de Gestión Académica & Seguridad</p>
        </div>

        {/* Tarjeta de Bloqueo por Fuerza Bruta (Rate Limit 429) */}
        {isLocked ? (
          <div className="rate-limit-card" role="alert">
            <div className="rate-limit-icon">
              <ShieldAlert size={36} />
            </div>
            <h3 className="rate-limit-title">Bloqueo de Seguridad Activo</h3>
            <p className="rate-limit-desc">
              Se ha detectado un número excesivo de intentos fallidos. Por protección de las cuentas institucionales, la dirección IP ha sido temporalmente restringida.
            </p>
            <div className="rate-limit-timer">
              <Clock size={16} />
              <span>Tiempo restante: <strong>{formatLockTime(lockCountdown)}</strong></span>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="login-error" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label htmlFor="login-username">Usuario o Matrícula</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <User size={18} />
                  </span>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    className="login-input"
                    placeholder="ej. admin o matricula"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="login-password">Contraseña</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="login-input has-toggle"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-btn">
                {loading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión Protegida</span>
                )}
              </button>
            </form>

            {/* Accesos Rápidos para Demostración de Roles (RBAC) */}


          </>
        )}

        <div className="login-card-footer">
          <ShieldCheck size={14} />
          <span>Protección BCrypt • Rate-Limiting Anti-Fuerza Bruta • JWT</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
