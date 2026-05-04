// AgregarPaciente - Formulario para crear nuevo paciente
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SuccessModal from '../components/SuccessModal';
import usuariosService from '../services/usuariosService';
import './AgregarUsuario.css';

const AgregarPaciente = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nombre: '',
    paterno: '',
    materno: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    matricula: '',
  });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si es el campo de matrícula, solo permitir números
    if (name === 'matricula') {
      const soloNumeros = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        [name]: soloNumeros,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
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

    if (formData.matricula.length > 10) {
      setError('La matrícula debe tener máximo 10 caracteres');
      setLoading(false);
      return;
    }

    if (!/^\d+$/.test(formData.matricula)) {
      setError('La matrícula debe contener solo números');
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
        rol: 'paciente',
        matricula: formData.matricula,
      };

      await usuariosService.crearUsuario(userData);
      
      // Mostrar modal de éxito
      setShowSuccessModal(true);
      
      // Esperar 3 segundos y redirigir
      setTimeout(() => {
        navigate('/admin/pacientes');
      }, 3000);
      
    } catch (err) {
      // Extraer mensaje de error
      let errorMessage = 'Error al crear paciente';
      
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

  return (
    <>
      <Navbar />
      <div className="agregar-usuario-container">
        <div className="agregar-usuario-content">
          
          {/* Ícono/Emoji decorativo */}
          <div className="usuario-icon">
            👤
          </div>

          <h1 className="agregar-usuario-title">Agregar Paciente</h1>

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
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="matricula"
                  name="matricula"
                  value={formData.matricula}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  placeholder="2021123456"
                />
                <span className="field-hint">Solo números, máximo 10 dígitos</span>
              </div>
            </div>

            {/* Contraseñas en una fila */}
            <div className="form-row">
              <div className="form-group-agregar">
                <label htmlFor="contrasena">Contraseña *</label>
                <div className="password-wrapper">
                  <input
                    type={mostrarContrasena ? "text" : "password"}
                    id="contrasena"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    required
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    className="toggle-password-agregar"
                    onClick={() => setMostrarContrasena(!mostrarContrasena)}
                    tabIndex={-1}
                    aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarContrasena ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" fill="#9E9E9E"><path d="M432 448a15.92 15.92 0 0 1-11.31-4.69l-352-352a16 16 0 0 1 22.62-22.62l352 352A16 16 0 0 1 432 448zM255.66 384c-41.49 0-81.5-12.28-118.92-36.5-34.07-22-64.74-53.51-88.7-91v-.08c19.94-28.57 41.78-52.73 65.24-72.21a2 2 0 0 0 .14-2.94L93.5 161.38a2 2 0 0 0-2.71-.12c-24.92 21-48.05 46.76-69.08 76.92a31.92 31.92 0 0 0-.64 35.54c26.41 41.33 60.4 76.14 98.28 100.65C162 402 207.9 416 255.66 416a239.13 239.13 0 0 0 75.8-12.58 2 2 0 0 0 .77-3.31l-21.58-21.58a4 4 0 0 0-3.83-1 204.8 204.8 0 0 1-51.16 6.47zM490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96a227.34 227.34 0 0 0-74.89 12.83 2 2 0 0 0-.75 3.31l21.55 21.55a4 4 0 0 0 3.88 1 192.82 192.82 0 0 1 50.21-6.69c40.69 0 80.58 12.43 118.55 36.94 34.71 22.4 65.74 53.88 89.76 91a.13.13 0 0 1 0 .16 310.72 310.72 0 0 1-64.12 72.73 2 2 0 0 0-.15 2.95l19.9 19.89a2 2 0 0 0 2.7.13 343.49 343.49 0 0 0 68.64-78.48 32.2 32.2 0 0 0-.1-34.72z"/><path d="M256 160a95.88 95.88 0 0 0-21.37 2.4 2 2 0 0 0-1 3.38l112.59 112.56a2 2 0 0 0 3.38-1A96 96 0 0 0 256 160zM165.78 233.66a2 2 0 0 0-3.38 1 96 96 0 0 0 115 115 2 2 0 0 0 1-3.38z"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" fill="#9E9E9E"><path d="M255.66 112c-77.94 0-157.89 45.11-220.83 135.33a16 16 0 0 0-.27 17.77C82.92 340.8 161.8 400 255.66 400c92.84 0 173.34-59.38 221.79-135.25a16.14 16.14 0 0 0 0-17.47C428.89 172.28 347.8 112 255.66 112z" stroke="#9E9E9E" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="256" cy="256" r="80" stroke="#9E9E9E" stroke-width="32" fill="none" stroke-miterlimit="10"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group-agregar">
                <label htmlFor="confirmarContrasena">Confirmar Contraseña *</label>
                <div className="password-wrapper">
                  <input
                    type={mostrarConfirmar ? "text" : "password"}
                    id="confirmarContrasena"
                    name="confirmarContrasena"
                    value={formData.confirmarContrasena}
                    onChange={handleChange}
                    required
                    placeholder="Repite la contraseña"
                  />
                  <button
                    type="button"
                    className="toggle-password-agregar"
                    onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                    tabIndex={-1}
                    aria-label={mostrarConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarConfirmar ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" fill="#9E9E9E"><path d="M432 448a15.92 15.92 0 0 1-11.31-4.69l-352-352a16 16 0 0 1 22.62-22.62l352 352A16 16 0 0 1 432 448zM255.66 384c-41.49 0-81.5-12.28-118.92-36.5-34.07-22-64.74-53.51-88.7-91v-.08c19.94-28.57 41.78-52.73 65.24-72.21a2 2 0 0 0 .14-2.94L93.5 161.38a2 2 0 0 0-2.71-.12c-24.92 21-48.05 46.76-69.08 76.92a31.92 31.92 0 0 0-.64 35.54c26.41 41.33 60.4 76.14 98.28 100.65C162 402 207.9 416 255.66 416a239.13 239.13 0 0 0 75.8-12.58 2 2 0 0 0 .77-3.31l-21.58-21.58a4 4 0 0 0-3.83-1 204.8 204.8 0 0 1-51.16 6.47zM490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96a227.34 227.34 0 0 0-74.89 12.83 2 2 0 0 0-.75 3.31l21.55 21.55a4 4 0 0 0 3.88 1 192.82 192.82 0 0 1 50.21-6.69c40.69 0 80.58 12.43 118.55 36.94 34.71 22.4 65.74 53.88 89.76 91a.13.13 0 0 1 0 .16 310.72 310.72 0 0 1-64.12 72.73 2 2 0 0 0-.15 2.95l19.9 19.89a2 2 0 0 0 2.7.13 343.49 343.49 0 0 0 68.64-78.48 32.2 32.2 0 0 0-.1-34.72z"/><path d="M256 160a95.88 95.88 0 0 0-21.37 2.4 2 2 0 0 0-1 3.38l112.59 112.56a2 2 0 0 0 3.38-1A96 96 0 0 0 256 160zM165.78 233.66a2 2 0 0 0-3.38 1 96 96 0 0 0 115 115 2 2 0 0 0 1-3.38z"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" fill="#9E9E9E"><path d="M255.66 112c-77.94 0-157.89 45.11-220.83 135.33a16 16 0 0 0-.27 17.77C82.92 340.8 161.8 400 255.66 400c92.84 0 173.34-59.38 221.79-135.25a16.14 16.14 0 0 0 0-17.47C428.89 172.28 347.8 112 255.66 112z" stroke="#9E9E9E" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="256" cy="256" r="80" stroke="#9E9E9E" stroke-width="32" fill="none" stroke-miterlimit="10"/></svg>
                    )}
                  </button>
                </div>
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

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/admin/pacientes');
        }}
        title="¡Paciente Creado!"
        message={`El paciente ${formData.nombre} ${formData.paterno} ha sido creado exitosamente.`}
        type="success"
      />
    </>
  );
};

export default AgregarPaciente;