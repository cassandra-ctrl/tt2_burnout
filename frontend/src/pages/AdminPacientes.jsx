// AdminPacientes - Gestión de pacientes
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import usuariosService from '../services/usuariosService';
import './AdminGestion.css';

const AdminPacientes = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el modal
  const [showModal, setShowModal] = useState(false);
  const [pacienteToDelete, setPacienteToDelete] = useState(null);

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async (search = '') => {
    try {
      setLoading(true);
      const data = await usuariosService.getUsuarios({
        rol: 'paciente',
        search: search || undefined,
      });
      setPacientes(data.usuarios);
    } catch (err) {
      setError('Error cargando pacientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    cargarPacientes(searchTerm);
  };

  const handleEdit = (id) => {
    navigate(`/admin/pacientes/editar/${id}`);
  };

  const handleDelete = (id, nombre) => {
    setPacienteToDelete({ id, nombre });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await usuariosService.eliminarUsuario(pacienteToDelete.id);
      cargarPacientes(searchTerm); // Recargar lista
    } catch (err) {
      alert('Error eliminando paciente: ' + err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="admin-gestion-container">
        {/* Botones de navegación */}
        <div className="admin-tabs">
          <button 
            className="admin-tab"
            onClick={() => navigate('/admin/psicologos')}
          >
            Administrar psicólogos
          </button>
          <button className="admin-tab active">
            Administrar pacientes
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="search-section">
          <button 
            className="btn-agregar" 
            onClick={() => navigate('/admin/pacientes/agregar')}
          >
            Agregar
          </button>
          
          <form onSubmit={handleSearch} className="search-form">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar paciente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </form>
        </div>

        {/* Tabla de pacientes */}
        {loading ? (
          <div className="loading-message">Cargando pacientes...</div>
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
                  <th>Matrícula</th>
                  <th>Correo</th>
                  <th>Contraseña</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      No se encontraron pacientes
                    </td>
                  </tr>
                ) : (
                  pacientes.map((paciente) => (
                    <tr key={paciente.id_usuario}>
                      <td>#{paciente.id_usuario}</td>
                      <td>{paciente.nombre}</td>
                      <td>{paciente.paterno}</td>
                      <td>{paciente.materno || '-'}</td>
                      <td>{paciente.identificador || '-'}</td>
                      <td>{paciente.correo}</td>
                      <td>
                        <span className="password-placeholder">••••••••</span>
                      </td>
                      <td className="acciones-cell">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(paciente.id_usuario)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(paciente.id_usuario, `${paciente.nombre} ${paciente.paterno}`)}
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
        title="Eliminar Paciente"
        message={`¿Estás seguro de eliminar al paciente ${pacienteToDelete?.nombre}? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  );
};

export default AdminPacientes;