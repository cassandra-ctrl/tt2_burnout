// EditarPsicologo - Formulario para editar psicólogo
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SuccessModal from '../components/SuccessModal';
import usuariosService from '../services/usuariosService';
import './AgregarUsuario.css';

const EditarPsicologo = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Obtener el ID de la URL
  
  const [formData, setFormData] = useState({
    nombre: '',
    paterno: '',
    materno: '',
    correo: '',
    cedula_profesional: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cargar datos del psicólogo al montar el componente
  useEffect(() => {
    cargarPsicologo();
  }, [id]);

  const cargarPsicologo = async () => {
    try {
      setLoadingData(true);
      const data = await usuariosService.getUsuario(id);
      
      // Verificar que sea psicólogo
      if (data.usuario.rol !== 'psicologo') {
        setError('Este usuario no es un psicólogo');
        return;
      }

      // Llenar el formulario con los datos existentes
      setFormData({
        nombre: data.usuario.nombre,
        paterno: data.usuario.paterno,
        materno: data.usuario.materno || '',
        correo: data.usuario.correo,
        cedula_profesional: data.usuario.identificador || '',
      });
    } catch (err) {
      setError('Error cargando datos del psicólogo');
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

    // Validación de longitud de cédula
    if (formData.cedula_profesional.length > 20) {
      setError('La cédula profesional debe tener máximo 20 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Preparar datos para actualizar
      const userData = {
        nombre: formData.nombre,
        paterno: formData.paterno,
        materno: formData.materno || null,
        correo: formData.correo,
        cedula_profesional: formData.cedula_profesional,
      };

      await usuariosService.actualizarUsuario(id, userData);
      
      // Mostrar modal de éxito
      setShowSuccessModal(true);
      
      // Esperar 3 segundos y redirigir
      setTimeout(() => {
        navigate('/admin/psicologos');
      }, 3000);
      
    } catch (err) {
      // Extraer mensaje de error
      let errorMessage = 'Error al actualizar psicólogo';
      
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
    navigate('/admin/psicologos');
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
            👨‍⚕️
          </div>

          <h1 className="agregar-usuario-title">Editar Psicólogo</h1>

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

            {/* Correo y Cédula en una fila */}
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
                  placeholder="psicologo@correo.com"
                />
              </div>

              <div className="form-group-agregar">
                <label htmlFor="cedula_profesional">Cédula Profesional *</label>
                <input
                  type="text"
                  id="cedula_profesional"
                  name="cedula_profesional"
                  value={formData.cedula_profesional}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  placeholder="12345678"
                />
                <span className="field-hint">Máximo 20 caracteres</span>
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

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/admin/psicologos');
        }}
        title="¡Psicólogo Actualizado!"
        message={`Los datos del psicólogo ${formData.nombre} ${formData.paterno} han sido actualizados exitosamente.`}
        type="success"
      />
    </>
  );
};

export default EditarPsicologo;