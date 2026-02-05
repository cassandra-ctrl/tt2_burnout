// Servicio para autenticación
import api from './api';

const authService = {
  // Iniciar sesión
  login: async (correo, contrasena) => {
    try {
      const response = await api.post('/auth/login', {
        correo,
        contrasena,
      });
      
      // Guardar token y usuario en localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error en el servidor' };
    }
  },

  // Registrar nuevo paciente
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Guardar token y usuario automáticamente después del registro
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error en el servidor' };
    }
  },

  // Obtener información del usuario actual
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      throw error.response?.data || { error: 'Error en el servidor' };
    }
  },

  // Cambiar contraseña
  changePassword: async (contrasenaActual, contrasenaNueva) => {
    try {
      const response = await api.post('/auth/change-password', {
        contrasenaActual,
        contrasenaNueva,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error en el servidor' };
    }
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obtener usuario guardado
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default authService;
