// Login - Versión que bloquea acceso a pacientes
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
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

    try {
      const data = await login(formData.correo, formData.contrasena);
      
      // Bloquear acceso a pacientes
      if (data.user.rol === 'paciente') {
        // Primero mostrar el error
        setError('Los pacientes deben usar la aplicación móvil. Este portal es solo para psicólogos y administradores.');
        
        // Hacer logout limpiando todo
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Terminar aquí sin redirigir
        setLoading(false);
        return;
      }
      
      // Redirigir según el rol
      if (data.user.rol === 'administrador') {
        navigate('/admin');
      } else if (data.user.rol === 'psicologo') {
        navigate('/psicologo');
      }
      
    } catch (err) {
      setError(err.error || err.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="login-simple-container">
      <div className="wave-top-simple"></div>
      
      <div className="login-simple-content">
        <div className="login-simple-header">
          <h1>Bienvenido!</h1>
          <p>Portal Web - Psicólogos y Administradores</p>
        </div>

        <div className="panda-image-container">
          <div className="panda-emoji">🐼</div>
        </div>

          {error && (
            <div className="error-message-simple">
              {error}
            </div>
          )}


        <form onSubmit={handleSubmit} className="login-simple-form">
          <div className="input-group-simple">
            <span className="input-icon-simple">@</span>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              required
              placeholder="Correo"
            />
          </div>

          <div className="input-group-simple">
            <span className="input-icon-simple">🔒</span>
            <input
              type="password"
              name="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              required
              placeholder="••••••"
            />
          </div>

          <div className="recuperar-link-simple">
            <a href="/recuperar-contrasena">¿Olvidaste tu contraseña?</a>
          </div>



          <button 
            type="submit" 
            className="btn-entrar-simple"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer-simple">
          <p className="info-pacientes">
            ¿Eres paciente? Descarga la aplicación móvil
          </p>
        </div>
      </div>

      <div className="wave-bottom-simple"></div>
    </div>
  );
};

export default Login;