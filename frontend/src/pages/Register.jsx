// Componente de Registro
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    nombre: '',
    paterno: '',
    materno: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    matricula: '',
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

    // Validar que las contraseñas coincidan
    if (formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validar longitud de contraseña
    if (formData.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Preparar datos para enviar (sin confirmarContrasena)
      const { confirmarContrasena, ...dataToSend } = formData;
      
      await register(dataToSend);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Burnout App</h1>
        <h2>Crear Cuenta</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
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

            <div className="form-group">
              <label htmlFor="paterno">Apellido Paterno</label>
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
          </div>

          <div className="form-group">
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

          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              required
              placeholder="tu@correo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="matricula">Matrícula</label>
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contrasena">Contraseña</label>
              <input
                type="password"
                id="contrasena"
                name="contrasena"
                value={formData.contrasena}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmarContrasena">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmarContrasena"
                name="confirmarContrasena"
                value={formData.confirmarContrasena}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            ¿Ya tienes cuenta?{' '}
            <a href="/login">Inicia sesión aquí</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
