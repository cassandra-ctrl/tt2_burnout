// Componente Dashboard - Vista principal de módulos (ACTUALIZADO con Navbar)
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import modulosService from '../services/modulosService';
import ModuloCard from '../components/ModuloCard';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarModulos();
  }, []);

  const cargarModulos = async () => {
    try {
      setLoading(true);
      const data = await modulosService.getModulos();
      setModulos(data.modulos);
    } catch (err) {
      setError('Error cargando los módulos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-container">
          <div className="loading">Cargando módulos...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="dashboard-container">
          <div className="error-message">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Bienvenido, {user?.nombre}</h1>
          <p>Aquí están tus módulos de tratamiento</p>
        </header>

        <div className="modulos-grid">
          {modulos.map((modulo) => (
            <ModuloCard 
              key={modulo.id_modulo} 
              modulo={modulo}
            />
          ))}
        </div>

        {modulos.length === 0 && (
          <div className="empty-state">
            <p>No hay módulos disponibles en este momento</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
