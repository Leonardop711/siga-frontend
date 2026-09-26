import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { setToken, setUserData } from '../utils/auth';
import { GraduationCap, User, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from './Icons';
import '../styles/login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser({ username, password });
      
      setToken(data.token);
      setUserData(data.username, data.rol);

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al autenticar credenciales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-badge">
            <GraduationCap size={34} strokeWidth={2.2} />
          </div>
          <h2 className="login-title">SIGA</h2>
          <p className="login-subtitle">Sistema Integral de Gestión Académica</p>
        </div>

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
                placeholder="Ingresa tu usuario institucional"
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
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        <div className="login-card-footer">
          <ShieldCheck size={14} />
          <span>Acceso seguro protegido por SIGA</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
