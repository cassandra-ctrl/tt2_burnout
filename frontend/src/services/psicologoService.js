// Servicio para las funcionalidades del psicólogo
import api from './api';

const psicologoService = {
  // Obtener datos del dashboard
  getDashboard: async () => {
    try {
      const response = await api.get('/psicologo/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo dashboard' };
    }
  },

  // Obtener lista de pacientes
  getPacientes: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filtros.buscar) params.append('buscar', filtros.buscar);
      if (filtros.nivel) params.append('nivel', filtros.nivel);
      if (filtros.orden) params.append('orden', filtros.orden);
      
      const queryString = params.toString();
      const url = queryString ? `/psicologo/pacientes?${queryString}` : '/psicologo/pacientes';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo pacientes' };
    }
  },

  // Obtener detalle de un paciente
  getPaciente: async (id) => {
    try {
      const response = await api.get(`/psicologo/pacientes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo paciente' };
    }
  },

  // Obtener progreso de un paciente
  getProgresoPaciente: async (id) => {
    try {
      const response = await api.get(`/psicologo/pacientes/${id}/progreso`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo progreso' };
    }
  },

  // Obtener tests de un paciente
  getTestsPaciente: async (id) => {
    try {
      const response = await api.get(`/psicologo/pacientes/${id}/tests`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo tests' };
    }
  },
    // Obtener logros de un paciente (para psicólogo)
  getLogrosPaciente: async (id) => {
    try {
      const response = await api.get(`/logros/paciente/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo logros' };
    }
  },

  getComparacionBurnout: async (id) => {
    try {
      const response = await api.get(`/graficas/paciente/${id}/comparacion-burnout`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo comparación' };
    }
  },

  // Obtener gráfica de burnout general
  getBurnoutGeneral: async () => {
    try {
      const response = await api.get('/graficas/burnout-general');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo gráfica' };
    }
  },
};



export default psicologoService;
