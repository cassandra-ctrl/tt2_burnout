// Servicio para gestión de citas
import api from './api';

const citasService = {
  // Obtener todas las citas del psicólogo con filtros
  getCitas: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fecha) params.append('fecha', filtros.fecha);
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      
      const queryString = params.toString();
      const url = queryString ? `/citas?${queryString}` : '/citas';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo citas' };
    }
  },

  // Obtener agenda del día
  getAgenda: async (fecha) => {
    try {
      const url = fecha ? `/citas/agenda?fecha=${fecha}` : '/citas/agenda';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo agenda' };
    }
  },

  // Obtener una cita específica
  getCita: async (id) => {
    try {
      const response = await api.get(`/citas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo cita' };
    }
  },

  // Crear nueva cita
  crearCita: async (citaData) => {
    try {
      const response = await api.post('/citas', citaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error creando cita' };
    }
  },

  // Actualizar cita existente
  actualizarCita: async (id, citaData) => {
    try {
      const response = await api.put(`/citas/${id}`, citaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error actualizando cita' };
    }
  },

  // Cancelar cita
  cancelarCita: async (id) => {
    try {
      const response = await api.patch(`/citas/${id}/cancelar`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error cancelando cita' };
    }
  },

  // Obtener categorías de citas
  getCategorias: async () => {
    try {
      const response = await api.get('/citas/categorias');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo categorías' };
    }
  },
};

export default citasService;
