// Componente RecuperarContrasena - Flujo completo de recuperación
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import recuperacionService from '../services/recuperacionService';
import './RecuperarContrasena.css';

const RecuperarContrasena = () => {
  const navigate = useNavigate();
  
  // Estados del flujo
  const [paso, setPaso] = useState(1); // 1: solicitar, 2: verificar, 3: cambiar
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Paso 1: Solicitar código
  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMensaje('');

    try {
      const data = await recuperacionService.solicitarCodigo(correo);
      setMensaje(data.message);
      setPaso(2);
    } catch (err) {
      setError(err.message || 'Error al solicitar código');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código
  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await recuperacionService.verificarCodigo(correo, codigo);
      setMensaje('Código verificado correctamente');
      setPaso(3);
    } catch (err) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Cambiar contraseña
  const handleCambiarContrasena = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones
    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (nuevaContrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      await recuperacionService.cambiarContrasena(
        correo,
        codigo,
        nuevaContrasena,
        confirmarContrasena
      );
      
      setMensaje('¡Contraseña cambiada exitosamente!');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
        let errorMessage = 'Error al cambiar contraseña';
  
        if (err.errors && err.errors.length > 0) {
          // Toma el mensaje del array de errores de validación
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

  return (
    <div className="recuperar-container">
      <div className="recuperar-card">
        <h1>Recuperar Contraseña</h1>
        
        {/* Indicador de pasos */}
        <div className="pasos-indicador">
          <div className={`paso ${paso >= 1 ? 'activo' : ''}`}>1</div>
          <div className={`linea ${paso >= 2 ? 'activo' : ''}`}></div>
          <div className={`paso ${paso >= 2 ? 'activo' : ''}`}>2</div>
          <div className={`linea ${paso >= 3 ? 'activo' : ''}`}></div>
          <div className={`paso ${paso >= 3 ? 'activo' : ''}`}>3</div>
        </div>

        {/* Paso 1: Solicitar código */}
        {paso === 1 && (
          <form onSubmit={handleSolicitarCodigo}>
            <p className="instrucciones">
              Ingresa tu correo electrónico y te enviaremos un código de recuperación.
            </p>
            
            <div className="form-group">
              <label htmlFor="correo">Correo Electrónico</label>
              <input
                type="email"
                id="correo"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                placeholder="tu@correo.com"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {mensaje && <div className="success-message">{mensaje}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>

            <div className="form-footer">
              <a href="/login">Volver al inicio de sesión</a>
            </div>
          </form>
        )}

        {/* Paso 2: Verificar código */}
        {paso === 2 && (
          <form onSubmit={handleVerificarCodigo}>
            <p className="instrucciones">
              Ingresa el código de 6 dígitos que enviamos a <strong>{correo}</strong>
            </p>
            
            <div className="form-group">
              <label htmlFor="codigo">Código de Verificación</label>
              <input
                type="text"
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
                placeholder="123456"
                maxLength="6"
                className="codigo-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {mensaje && <div className="success-message">{mensaje}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>

            <div className="form-footer">
              <button 
                type="button" 
                onClick={() => setPaso(1)}
                className="btn-link"
              >
                Solicitar nuevo código
              </button>
            </div>
          </form>
        )}

        {/* Paso 3: Cambiar contraseña */}
        {paso === 3 && (
          <form onSubmit={handleCambiarContrasena}>
            <p className="instrucciones">
              Ingresa tu nueva contraseña
            </p>
            
            <div className="form-group">
              <label htmlFor="nuevaContrasena">Nueva Contraseña</label>
              <input
                type="password"
                id="nuevaContrasena"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmarContrasena">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmarContrasena"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                required
                placeholder="Repite la contraseña"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {mensaje && <div className="success-message">{mensaje}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecuperarContrasena;
