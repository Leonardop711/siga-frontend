import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const rol = localStorage.getItem('rol');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/alumnos`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (response.status === 401) {
          // Token inválido o expirado
          handleLogout();
          return;
        }

        if (!response.ok) {
          throw new Error(result.message || 'Error al obtener datos');
        }

        setData(result.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('rol');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>Panel de Control - SIGA</h2>
        <div>
          <span style={styles.userBadge}>{rol}: {username}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </header>

      <main style={styles.main}>
        <h3>Datos Académicos</h3>
        {error && <div style={styles.error}>{error}</div>}
        
        <table style={styles.table}>
          <thead>
            <tr style={styles.tr}>
              <th style={styles.th}>Matrícula</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Semestre</th>
              <th style={styles.th}>Asignatura</th>
              <th style={styles.th}>Calificación</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '10px'}}>No hay datos</td></tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} style={styles.tr}>
                  <td style={styles.td}>{row.matricula}</td>
                  <td style={styles.td}>{row.nombre} {row.apellido}</td>
                  <td style={styles.td}>{row.semestre}</td>
                  <td style={styles.td}>{row.asignatura || 'N/A'}</td>
                  <td style={styles.td}>{row.calificacion || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
};

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' },
  userBadge: { marginRight: '15px', background: '#dbeafe', color: '#1e40af', padding: '5px 10px', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold' },
  logoutBtn: { padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  main: { marginTop: '20px' },
  error: { color: '#dc2626', background: '#fee2e2', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  th: { background: '#f9fafb', padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' },
  td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' },
  tr: { transition: 'background 0.2s' }
};

export default Dashboard;
