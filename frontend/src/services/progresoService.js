// Servicio para progreso del paciente
import api from './api';

const progresoService = {
  // Obtener progreso general del paciente
  getProgresoPaciente: async (pacienteId) => {
    try {
      const response = await api.get(`/progreso/paciente/${pacienteId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo progreso' };
    }
  },

  // Obtener progreso de un módulo específico
  getProgresoModulo: async (moduloId, pacienteId) => {
    try {
      const response = await api.get(`/progreso/modulo/${moduloId}/paciente/${pacienteId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo progreso del módulo' };
    }
  },

  // Marcar actividad como iniciada
  iniciarActividad: async (actividadId) => {
    try {
      const response = await api.post('/progreso/actividad/iniciar', {
        id_actividad: actividadId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error iniciando actividad' };
    }
  },

  // Marcar actividad como completada
  completarActividad: async (actividadId) => {
    try {
      const response = await api.post('/progreso/actividad/completar', {
        id_actividad: actividadId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error completando actividad' };
    }
  },
};

export default progresoService;
