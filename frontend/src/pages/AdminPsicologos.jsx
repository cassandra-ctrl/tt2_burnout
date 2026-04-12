// AdminPsicologos - Gestión de psicólogos
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import SuccessModal from '../components/SuccessModal';
import usuariosService from '../services/usuariosService';
import './AdminGestion.css';

const AdminPsicologos = () => {
  const navigate = useNavigate();
  const [psicologos, setPsicologos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el modal de confirmación
  const [showModal, setShowModal] = useState(false);
  const [psicologoToDelete, setPsicologoToDelete] = useState(null);
  
  // Estado para el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleDelete = (id, nombre) => {
    setPsicologoToDelete({ id, nombre });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await usuariosService.eliminarUsuario(psicologoToDelete.id);
      setSuccessMessage(`El psicólogo ${psicologoToDelete.nombre} ha sido eliminado exitosamente.`);
      setShowSuccessModal(true);
      cargarPsicologos(searchTerm); // Recargar lista
    } catch (err) {
      alert('Error eliminando psicólogo: ' + err.message);
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
            <span className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
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
                          onClick={() => handleDelete(psicologo.id_usuario, `${psicologo.nombre} ${psicologo.paterno}`)}
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

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Psicólogo"
        message={`¿Estás seguro de eliminar al psicólogo ${psicologoToDelete?.nombre}? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Eliminado!"
        message={successMessage}
        type="success"
      />
    </>
  );
};

export default AdminPsicologos;