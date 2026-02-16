// AgregarPsicologo - Formulario para crear nuevo psicólogo
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import usuariosService from '../services/usuariosService';
import './AgregarUsuario.css';

const AgregarPsicologo = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nombre: '',
    paterno: '',
    materno: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    cedula_profesional: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Validaciones
    if (formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    if (formData.cedula_profesional.length > 20) {
      setError('La cédula profesional debe tener máximo 20 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Preparar datos para enviar
      const userData = {
        nombre: formData.nombre,
        paterno: formData.paterno,
        materno: formData.materno || null,
        correo: formData.correo,
        contrasena: formData.contrasena,
        rol: 'psicologo',
        cedula_profesional: formData.cedula_profesional,
      };

      await usuariosService.crearUsuario(userData);
      
      // Redirigir a la lista de psicólogos
      navigate('/admin/psicologos');
      
    } catch (err) {
      // Extraer mensaje de error
      let errorMessage = 'Error al crear psicólogo';
      
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

  return (
    <>
      <Navbar />
      <div className="agregar-usuario-container">
        <div className="agregar-usuario-content">
          
          {/* Ícono/Emoji decorativo */}
          <div className="usuario-icon">
            👨‍⚕️
          </div>

          <h1 className="agregar-usuario-title">Agregar Psicólogo</h1>

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

            {/* Contraseñas en una fila */}
            <div className="form-row">
              <div className="form-group-agregar">
                <label htmlFor="contrasena">Contraseña *</label>
                <input
                  type="password"
                  id="contrasena"
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleChange}
                  required
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className="form-group-agregar">
                <label htmlFor="confirmarContrasena">Confirmar Contraseña *</label>
                <input
                  type="password"
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  value={formData.confirmarContrasena}
                  onChange={handleChange}
                  required
                  placeholder="Repite la contraseña"
                />
              </div>
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
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AgregarPsicologo;