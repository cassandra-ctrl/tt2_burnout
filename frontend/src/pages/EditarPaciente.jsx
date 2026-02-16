// EditarPaciente - Formulario para editar paciente
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import usuariosService from '../services/usuariosService';
import './AgregarUsuario.css';

const EditarPaciente = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Obtener el ID de la URL
  
  const [formData, setFormData] = useState({
    nombre: '',
    paterno: '',
    materno: '',
    correo: '',
    matricula: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Cargar datos del paciente al montar el componente
  useEffect(() => {
    cargarPaciente();
  }, [id]);

  const cargarPaciente = async () => {
    try {
      setLoadingData(true);
      const data = await usuariosService.getUsuario(id);
      
      // Verificar que sea paciente
      if (data.usuario.rol !== 'paciente') {
        setError('Este usuario no es un paciente');
        return;
      }

      // Llenar el formulario con los datos existentes
      setFormData({
        nombre: data.usuario.nombre,
        paterno: data.usuario.paterno,
        materno: data.usuario.materno || '',
        correo: data.usuario.correo,
        matricula: data.usuario.identificador || '',
      });
    } catch (err) {
      setError('Error cargando datos del paciente');
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Preparar datos para actualizar
      const userData = {
        nombre: formData.nombre,
        paterno: formData.paterno,
        materno: formData.materno || null,
        correo: formData.correo,
        matricula: formData.matricula,
      };

      await usuariosService.actualizarUsuario(id, userData);
      
      // Redirigir a la lista de pacientes
      navigate('/admin/pacientes');
      
    } catch (err) {
      // Extraer mensaje de error
      let errorMessage = 'Error al actualizar paciente';
      
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].msg;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    navigate('/admin/pacientes');
  };

  if (loadingData) {
    return (
      <>
        <Navbar />
        <div className="agregar-usuario-container">
          <div className="loading">Cargando datos...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="agregar-usuario-container">
        <div className="agregar-usuario-content">
          
          {/* Ícono/Emoji decorativo */}
          <div className="usuario-icon">
            👤
          </div>

          <h1 className="agregar-usuario-title">Editar Paciente</h1>

          <form onSubmit={handleSubmit} className="agregar-usuario-form">
            
            {/* Nombre */}
            <div className="form-group-agregar">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Juan"
              />
            </div>

            {/* Apellidos en una fila */}
            <div className="form-row">
              <div className="form-group-agregar">
                <label htmlFor="paterno">Apellido Paterno *</label>
                <input
                  type="text"
                  id="paterno"
                  name="paterno"
                  value={formData.paterno}
                  onChange={handleChange}
                  required
                  placeholder="Pérez"
                />
              </div>

              <div className="form-group-agregar">
                <label htmlFor="materno">Apellido Materno</label>
                <input
                  type="text"
                  id="materno"
                  name="materno"
                  value={formData.materno}
                  onChange={handleChange}
                  placeholder="García (opcional)"
                />
              </div>
            </div>

            {/* Correo y Matrícula en una fila */}
            <div className="form-row">
              <div className="form-group-agregar">
                <label htmlFor="correo">Correo Electrónico *</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  placeholder="paciente@correo.com"
                />
              </div>

              <div className="form-group-agregar">
                <label htmlFor="matricula">Matrícula *</label>
                <input
                  type="text"
                  id="matricula"
                  name="matricula"
                  value={formData.matricula}
                  onChange={handleChange}
                  required
                  placeholder="2021123456"
                />
              </div>
            </div>

            {/* Nota sobre contraseña */}
            <div className="info-message">
              💡 La contraseña no se puede editar desde aquí por seguridad.
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="error-message-agregar">
                {error}
              </div>
            )}

            {/* Botones */}
            <div className="form-buttons">
              <button
                type="button"
                onClick={handleCancelar}
                className="btn-cancelar"
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="btn-guardar"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditarPaciente;
