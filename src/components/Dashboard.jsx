import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlumnos } from '../services/api';
import { clearAuth, isAuthenticated } from '../utils/auth';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const username = localStorage.getItem('username');
  const rol = localStorage.getItem('rol');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const result = await getAlumnos();
        setData(result.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2 className="dashboard-title">Panel de Control - SIGA</h2>
        <div className="user-controls">
          <span className="badge">{rol}: {username}</span>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </header>

      <main>
        <h3>Datos Académicos</h3>
        {error && <div className="dashboard-error">{error}</div>}
        
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nombre</th>
                <th>Semestre</th>
                <th>Asignatura</th>
                <th>Calificación</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No hay datos</td></tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index}>
                    <td>{row.matricula}</td>
                    <td>{row.nombre} {row.apellido}</td>
                    <td>{row.semestre}</td>
                    <td>{row.asignatura || 'N/A'}</td>
                    <td>{row.calificacion || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
