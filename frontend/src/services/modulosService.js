// Servicio para módulos y actividades
import api from './api';

const modulosService = {
  // Obtener todos los módulos
  getModulos: async () => {
    try {
      const response = await api.get('/modulos');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo módulos' };
    }
  },

  // Obtener un módulo específico
  getModulo: async (id) => {
    try {
      const response = await api.get(`/modulos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo módulo' };
    }
  },

  // Obtener actividades de un módulo
  getActividadesModulo: async (moduloId) => {
    try {
      const response = await api.get(`/modulos/${moduloId}/actividades`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo actividades' };
    }
  },

  // Obtener detalle de una actividad
  getActividad: async (moduloId, actividadId) => {
    try {
      const response = await api.get(`/modulos/${moduloId}/actividades/${actividadId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo actividad' };
    }
  },

  // Obtener categorías de actividades
  getCategorias: async () => {
    try {
      const response = await api.get('/modulos/categorias/lista');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo categorías' };
    }
  },
};

export default modulosService;
