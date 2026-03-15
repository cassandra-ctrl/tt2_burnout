// ============================================================================
// SERVICIO API - Conexión con el backend
// src/services/api.js
// ============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
// Cambia esta URL por la IP de tu computadora cuando pruebes en tu celular
// Para emulador Android: 10.0.2.2
// Para tu celular: usa la IP de tu computadora (ej: 192.168.1.100)
// Para navegador web: localhost
const API_URL =
  Platform.OS === "web"
    ? "http://localhost:3000/api"
    : "http://192.168.1.2:3000/api";

// ============================================================================
// FUNCIÓN BASE PARA PETICIONES
// ============================================================================

async function request(endpoint, options = {}) {
  const token = await AsyncStorage.getItem("token");

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // Agregar token si existe
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        // Agregamos data.mensaje por si tu backend responde en español
        message:
          data.mensaje || data.message || data.error || "Error en la petición",
        data,
      };
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 0,
      message: "Error de conexión. Verifica tu internet.",
      error,
    };
  }
}

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

export const authAPI = {
  // Iniciar sesión
  login: async (correo, contrasena) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ correo, contrasena }),
    });

    // Guardar token (el backend devuelve 'user', no 'usuario')
    if (data.token) {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("usuario", JSON.stringify(data.user));
    }

    return { ...data, usuario: data.user };
  },

  // Registrarse
  register: async (datos) => {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(datos),
    });

    // Guardar token (el backend devuelve 'user', no 'usuario')
    if (data.token) {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("usuario", JSON.stringify(data.user));
    }

    return { ...data, usuario: data.user };
  },

  // Obtener perfil
  getProfile: async () => {
    const data = await request("/auth/me");
    // Normalizar la respuesta
    return { ...data, usuario: data.user || data.usuario };
  },

  // Cerrar sesión
  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("usuario");
  },

  // Verificar si hay sesión activa
  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem("token");
    return !!token;
  },
};

// ============================================================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================================================

export const recuperacionAPI = {
  // Solicitar código
  solicitarCodigo: async (correo) => {
    return await request("/recuperacion/solicitar", {
      method: "POST",
      body: JSON.stringify({ correo }),
    });
  },

  // Verificar código
  verificarCodigo: async (correo, codigo) => {
    return await request("/recuperacion/verificar", {
      method: "POST",
      body: JSON.stringify({ correo, codigo }),
    });
  },

  // Cambiar contraseña
  cambiarContrasena: async (
    correo,
    codigo,
    nueva_contrasena,
    confirmar_contrasena,
  ) => {
    return await request("/recuperacion/cambiar", {
      method: "POST",
      body: JSON.stringify({
        correo,
        codigo,
        nueva_contrasena,
        confirmar_contrasena,
      }),
    });
  },
};

// ============================================================================
// DOCUMENTOS LEGALES
// ============================================================================

export const documentosAPI = {
  // Obtener estado de documentos
  getEstado: async () => {
    return await request("/documentos/estado");
  },

  // Obtener consentimiento informado
  getConsentimiento: async () => {
    return await request("/documentos/consentimiento");
  },

  // Obtener aviso de privacidad
  getAvisoPrivacidad: async () => {
    return await request("/documentos/aviso-privacidad");
  },

  // Aceptar documento (envía id_documento)
  aceptar: async (id_documento) => {
    return await request("/documentos/aceptar", {
      method: "POST",
      body: JSON.stringify({ id_documento }),
    });
  },

  // Aceptar todos los documentos
  aceptarTodos: async () => {
    return await request("/documentos/aceptar-todos", {
      method: "POST",
    });
  },
};

// ============================================================================
// TEST OLBI
// ============================================================================

export const testAPI = {
  // Obtener estado del test
  getEstado: async () => {
    return await request("/test-olbi/estado");
  },

  // Obtener preguntas
  getPreguntas: async () => {
    return await request("/test-olbi/preguntas");
  },

  // Enviar respuestas
  responder: async (tipo_prueba, respuestas) => {
    return await request("/test-olbi/responder", {
      method: "POST",
      body: JSON.stringify({ tipo_prueba, respuestas }),
    });
  },

  // Obtener resultados
  getResultados: async () => {
    return await request("/test-olbi/resultados");
  },
};

// ============================================================================
// MÓDULOS Y ACTIVIDADES
// ============================================================================

export const modulosAPI = {
  // Obtener todos los módulos
  getAll: async () => {
    return await request("/modulos");
  },

  // Obtener módulo por ID
  getById: async (id) => {
    return await request(`/modulos/${id}`);
  },

  // Obtener actividades de un módulo
  getActividades: async (id) => {
    return await request(`/modulos/${id}/actividades`);
  },
};

export const actividadesAPI = {
  // Obtener actividad por ID
  getById: async (id) => {
    return await request(`/actividades/${id}`);
  },
};

// ============================================================================
// PROGRESO
// ============================================================================

export const progresoAPI = {
  // Obtener progreso general
  getGeneral: async () => {
    return await request("/progreso");
  },

  // Iniciar actividad
  iniciarActividad: async (id_actividad) => {
    return await request("/progreso/actividad/iniciar", {
      method: "POST",
      body: JSON.stringify({ id_actividad }),
    });
  },

  // Completar actividad
  completarActividad: async (id_actividad) => {
    return await request("/progreso/actividad/completar", {
      method: "POST",
      body: JSON.stringify({ id_actividad }),
    });
  },
};

// ============================================================================
// GRÁFICAS
// ============================================================================

export const graficasAPI = {
  // Obtener desempeño (módulo actual)
  getDesempeno: async (idPaciente) => {
    return await request(`/graficas/paciente/${idPaciente}/desempeno`);
  },

  // Obtener comparación burnout
  getComparacionBurnout: async (idPaciente) => {
    return await request(
      `/graficas/paciente/${idPaciente}/comparacion-burnout`,
    );
  },
};

// ============================================================================
// LOGROS
// ============================================================================

export const logrosAPI = {
  // Obtener todos los logros
  getAll: async () => {
    return await request("/logros");
  },

  // Obtener mis logros
  getMisLogros: async () => {
    return await request("/logros/mis-logros");
  },

  // Obtener estadísticas
  getEstadisticas: async () => {
    return await request("/logros/estadisticas");
  },

  // Verificar nuevos logros
  verificar: async () => {
    return await request("/logros/verificar");
  },
};

// ============================================================================
// CITAS
// ============================================================================

export const citasAPI = {
  // Obtener mis citas
  getMisCitas: async () => {
    return await request("/citas/mis-citas");
  },

  // Obtener detalle de cita
  getById: async (id) => {
    return await request(`/citas/${id}`);
  },
};

// ============================================================================
// EXPORTAR TODO
// ============================================================================

export default {
  auth: authAPI,
  recuperacion: recuperacionAPI,
  documentos: documentosAPI,
  test: testAPI,
  modulos: modulosAPI,
  actividades: actividadesAPI,
  progreso: progresoAPI,
  graficas: graficasAPI,
  logros: logrosAPI,
  citas: citasAPI,
};
