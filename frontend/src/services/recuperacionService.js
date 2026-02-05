// Servicio para recuperación de contraseña
import api from './api';

const recuperacionService = {
  // Solicitar código de recuperación
  solicitarCodigo: async (correo) => {
    try {
      const response = await api.post('/recuperacion/solicitar', { correo });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error solicitando código' };
    }
  },

  // Verificar código
  verificarCodigo: async (correo, codigo) => {
    try {
      const response = await api.post('/recuperacion/verificar', {
        correo,
        codigo,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Código inválido' };
    }
  },

  // Cambiar contraseña con código
  cambiarContrasena: async (correo, codigo, nueva_contrasena, confirmar_contrasena) => {
    try {
      const response = await api.post('/recuperacion/cambiar', {
        correo,
        codigo,
        nueva_contrasena,
        confirmar_contrasena,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Error cambiando contraseña' };
    }
  },
};

export default recuperacionService;
