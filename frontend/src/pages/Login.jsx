// Login - Versión con imagen (más fácil de personalizar)
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
      await login(formData.correo, formData.contrasena);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-simple-container">
      <div className="wave-top-simple"></div>
      
      <div className="login-simple-content">
        <div className="login-simple-header">
          <h1>Bienvenido!</h1>
          <p>Más calma. Menos agotamiento</p>
        </div>

        {/* Aquí irá tu imagen del panda */}
        <div className="panda-image-container">
          {/* Opción 1: Emoji de panda (temporal) */}
          <div className="panda-emoji">🐼</div>
          
          {/* Opción 2: Cuando tengas la imagen, descomenta esto:
          <img 
            src="/panda-meditation.png" 
            alt="Panda meditando" 
            className="panda-image"
          />
          */}
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
            <a href="/recuperar-contrasena">Recuperar contraseña</a>
          </div>



          <button 
            type="submit" 
            className="btn-entrar-simple"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <div className="wave-bottom-simple"></div>
    </div>
  );
};

export default Login;
