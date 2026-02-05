// Servicio para documentos legales
import api from './api';

const documentosService = {
  // Obtener carta de consentimiento
  getConsentimiento: async () => {
    try {
      const response = await api.get('/documentos/consentimiento');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo consentimiento' };
    }
  },

  // Obtener aviso de privacidad
  getAvisoPrivacidad: async () => {
    try {
      const response = await api.get('/documentos/aviso-privacidad');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo aviso de privacidad' };
    }
  },

  // Obtener todos los documentos
  getTodosDocumentos: async () => {
    try {
      const response = await api.get('/documentos/todos');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo documentos' };
    }
  },

  // Verificar estado de documentos aceptados
  getEstadoDocumentos: async () => {
    try {
      const response = await api.get('/documentos/estado');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error obteniendo estado' };
    }
  },

  // Aceptar un documento
  aceptarDocumento: async (idDocumento) => {
    try {
      const response = await api.post('/documentos/aceptar', {
        id_documento: idDocumento,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error aceptando documento' };
    }
  },

  // Aceptar todos los documentos
  aceptarTodos: async () => {
    try {
      const response = await api.post('/documentos/aceptar-todos');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error aceptando documentos' };
    }
  },
};

export default documentosService;
