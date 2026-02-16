// AdminPsicologos - Gestión de psicólogos
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import usuariosService from '../services/usuariosService';
import './AdminGestion.css';

const AdminPsicologos = () => {
  const navigate = useNavigate();
  const [psicologos, setPsicologos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarPsicologos();
  }, []);

  const cargarPsicologos = async (search = '') => {
    try {
      setLoading(true);
      const data = await usuariosService.getUsuarios({
        rol: 'psicologo',
        search: search || undefined,
      });
      setPsicologos(data.usuarios);
    } catch (err) {
      setError('Error cargando psicólogos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    cargarPsicologos(searchTerm);
  };

  const handleEdit = (id) => {
    navigate(`/admin/psicologos/editar/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este psicólogo?')) {
      try {
        await usuariosService.eliminarUsuario(id);
        cargarPsicologos(searchTerm); // Recargar lista
      } catch (err) {
        alert('Error eliminando psicólogo: ' + err.message);
      }
    }
  };

  const handleVolver = () => {
    navigate('/admin');
  };

  return (
    <>
      <Navbar />
      <div className="admin-gestion-container">
        {/* Botones de navegación */}
        <div className="admin-tabs">
          <button className="admin-tab active">
            Administrar psicólogos
          </button>
          <button 
            className="admin-tab"
            onClick={() => navigate('/admin/pacientes')}
          >
            Administrar pacientes
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="search-section">
          <button 
            className="btn-agregar" 
            onClick={() => navigate('/admin/psicologos/agregar')}
          >
            Agregar
          </button>
          
          <form onSubmit={handleSearch} className="search-form">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar psicólogo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </form>
        </div>

        {/* Tabla de psicólogos */}
        {loading ? (
          <div className="loading-message">Cargando psicólogos...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Paterno</th>
                  <th>Materno</th>
                  <th>Cédula</th>
                  <th>Correo</th>
                  <th>Contraseña</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {psicologos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      No se encontraron psicólogos
                    </td>
                  </tr>
                ) : (
                  psicologos.map((psicologo) => (
                    <tr key={psicologo.id_usuario}>
                      <td>#{psicologo.id_usuario}</td>
                      <td>{psicologo.nombre}</td>
                      <td>{psicologo.paterno}</td>
                      <td>{psicologo.materno || '-'}</td>
                      <td>{psicologo.identificador || '-'}</td>
                      <td>{psicologo.correo}</td>
                      <td>
                        <span className="password-placeholder">••••••••</span>
                      </td>
                      <td className="acciones-cell">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(psicologo.id_usuario)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(psicologo.id_usuario)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPsicologos;