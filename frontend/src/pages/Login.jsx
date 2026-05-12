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
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
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
          <h1>¡Bienvenido a CalmOut!</h1>
          <p>Portal Web - Psicólogos y Administradores</p>
        </div>

        <div className="panda-image-container">
          <img src="/images/panda-meditando.png" alt="BurnOut" className="panda-image" />
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
              type={mostrarContrasena ? "text" : "password"}
              name="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              required
              placeholder="••••••"
            />
            <button
              type="button"
              className="toggle-password-simple"
              onClick={() => setMostrarContrasena(!mostrarContrasena)}
              tabIndex={-1}
              aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarContrasena ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" fill="#9E9E9E">
                  <path d="M432 448a15.92 15.92 0 0 1-11.31-4.69l-352-352a16 16 0 0 1 22.62-22.62l352 352A16 16 0 0 1 432 448zM255.66 384c-41.49 0-81.5-12.28-118.92-36.5-34.07-22-64.74-53.51-88.7-91v-.08c19.94-28.57 41.78-52.73 65.24-72.21a2 2 0 0 0 .14-2.94L93.5 161.38a2 2 0 0 0-2.71-.12c-24.92 21-48.05 46.76-69.08 76.92a31.92 31.92 0 0 0-.64 35.54c26.41 41.33 60.4 76.14 98.28 100.65C162 402 207.9 416 255.66 416a239.13 239.13 0 0 0 75.8-12.58 2 2 0 0 0 .77-3.31l-21.58-21.58a4 4 0 0 0-3.83-1 204.8 204.8 0 0 1-51.16 6.47zM490.84 238.6c-26.46-40.92-60.79-75.68-99.27-100.53C349 110.55 302 96 255.66 96a227.34 227.34 0 0 0-74.89 12.83 2 2 0 0 0-.75 3.31l21.55 21.55a4 4 0 0 0 3.88 1 192.82 192.82 0 0 1 50.21-6.69c40.69 0 80.58 12.43 118.55 36.94 34.71 22.4 65.74 53.88 89.76 91a.13.13 0 0 1 0 .16 310.72 310.72 0 0 1-64.12 72.73 2 2 0 0 0-.15 2.95l19.9 19.89a2 2 0 0 0 2.7.13 343.49 343.49 0 0 0 68.64-78.48 32.2 32.2 0 0 0-.1-34.72z"/>
                  <path d="M256 160a95.88 95.88 0 0 0-21.37 2.4 2 2 0 0 0-1 3.38l112.59 112.56a2 2 0 0 0 3.38-1A96 96 0 0 0 256 160zM165.78 233.66a2 2 0 0 0-3.38 1 96 96 0 0 0 115 115 2 2 0 0 0 1-3.38z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" fill="#9E9E9E">
                  <path d="M255.66 112c-77.94 0-157.89 45.11-220.83 135.33a16 16 0 0 0-.27 17.77C82.92 340.8 161.8 400 255.66 400c92.84 0 173.34-59.38 221.79-135.25a16.14 16.14 0 0 0 0-17.47C428.89 172.28 347.8 112 255.66 112z" stroke="#9E9E9E" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="256" cy="256" r="80" stroke="#9E9E9E" stroke-width="32" fill="none" stroke-miterlimit="10"/>
                </svg>
              )}
            </button>
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
            ¿Eres paciente?{' '}
            <a
              href="https://drive.google.com/uc?export=download&id=1UjSOcURs4seOs3dVHP721W0_2heXT-V1"
              target="_blank"
              rel="noopener noreferrer"
              className="link-descarga-app"
            >
              Descarga la aplicación móvil
            </a>
          </p>
        </div>
      </div>

      <div className="wave-bottom-simple"></div>
    </div>
  );
};

export default Login;
