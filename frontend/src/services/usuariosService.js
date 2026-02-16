// Servicio para gestión de usuarios (administrador)
import api from './api';

const usuariosService = {
  // Obtener todos los usuarios con filtros opcionales
  getUsuarios: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filtros.rol) params.append('rol', filtros.rol);
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.activo !== undefined) params.append('activo', filtros.activo);
      
      const queryString = params.toString();
      const url = queryString ? `/usuarios?${queryString}` : '/usuarios';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo usuarios' };
    }
  },

  // Obtener un usuario específico
  getUsuario: async (id) => {
    try {
      const response = await api.get(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo usuario' };
    }
  },

  // Crear nuevo usuario
  crearUsuario: async (userData) => {
    try {
      const response = await api.post('/usuarios', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error creando usuario' };
    }
  },

  // Actualizar usuario
  actualizarUsuario: async (id, userData) => {
    try {
      const response = await api.put(`/usuarios/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error actualizando usuario' };
    }
  },

  // Eliminar usuario
  eliminarUsuario: async (id) => {
    try {
      const response = await api.delete(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error eliminando usuario' };
    }
  },
};

export default usuariosService;
