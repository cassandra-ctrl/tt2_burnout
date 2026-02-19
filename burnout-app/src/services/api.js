// SERVICIO DE API -conectar al backend
// src/services/api.js

// AsyncStorage: Guarda datos de forma local (celular), como el token
import AsyncStorage from "@react-native-async-storage/async-storage";

//Cambiar la url por la IP de la pc cuando se pruebe en el cel
const API_URL = "http://10.0.2.2:3000/api";

//..........................................
//FUNCION BASE PARA PETICIONES
async function request(endpoint, options = {}) {
  //busca si hay un token guardado en el celular
  const token = await AsyncStorage.getItem("token");
  //prepara los encabezados para decirle al servidor que le enviemos datos en formato JSON
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  //Agregar el token existente
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    //va al endpoint que solicita el usuario
    const response = await fetch(`${API_URL}${endpoint}`, config);

    //responde con un formato JSON
    const data = await response.json();
    if (!response.ok) {
      //Lanza informacion del error al ingresar al endpoint
      throw {
        status: response.status,
        message: data.message || data.error || "Error en la petición",
        data,
      };
    }

    //Imprime la informacion del backend
    return data;
  } catch (error) {
    //Hay un error en la conexion (internet)
    if (error.status) {
      throw error;
    }
    throw {
      status: 0,
      message: "Error de conexión",
      error,
    };
  }
}

//..........................................
// AUTENTICACIÓN
export const authAPI = {
  //INICIAR SESION
  login: async (correo, contrasena) => {
    //encia los datos al servidor
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ correo, contrasena }),
    });

    //si el servidor responde con un token (login exitoso)
    if (data.token) {
      //se guarda el token y los datos del usuario en el celular
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("usuario", JSON.stringify(data.usuario));
    }
    return data;
  },

  //REGISTRARSE
  //envia los datos al servidor
  register: async (datos) => {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(datos),
    });

    //guarda el token en la memoria del celular
    if (data.token) {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("usuario", JSON.stringify(data.usuario));
    }
    return data;
  },

  //Obtiene el perfil
  getProfile: async () => {
    return await request("/auth/me");
  },

  //Cerrar sesion
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

//..........................................
// RECUPERACIÓN DE CONTRASEÑA
export const recuperacionAPI = {
  //solicitar codigo
  solicitarCodigo: async (correo) => {
    //enviamos el correo al servidor en formato JSON
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

  //cambiamos la contrasena
  cambiarContrasena: async (correo, codigo, nueva_contrasena) => {
    return await request("/recuperacion/cambiar", {
      method: "POST",
      body: JSON.stringify({ correo, codigo, nueva_contrasena }),
    });
  },
};

//................................
// DOCUMENTOS LEGALES
export const documentosAPI = {
  //obtener estado de documentos
  getEstado: async () => {
    return await request("/documentos/estado");
  },

  //Obtenemos documento por tipo
  getDocumento: async (tipo) => {
    return await request(`/documentos/${tipo}`);
  },

  //aceptar documento
  aceptar: async (tipo) => {
    return await request(`/documentos/${tipo}/aceptar`, {
      method: "POST",
    });
  },
};

//..................................
// TEST OLBI

export const testAPI = {
  //obtenemos el estado del test
  getEstado: async () => {
    return await request("/test-olbi/estado");
  },

  //obtener preguntas
  getPreguntas: async () => {
    return await request("/test-olbi/preguntas");
  },

  //enviar respuestas
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

//...............................................
// MÓDULOS Y ACTIVIDADES

export const modulosAPI = {
  //obtener todos los modulos
  getAll: async () => {
    return await request("/modulos");
  },

  //obtener modulo por id
  getById: async (id) => {
    return await request(`/modulos/${id}`);
  },

  //obtener actividades de un modulo
  getActividades: async (id) => {
    return await request(`/modulos/${id}/actividades`);
  },
};

/// esta no tendria que estar dentro de modulo?(checarlo)
export const actividadesAPI = {
  //obtener actividad por id
  getById: async (id) => {
    return await request(`/actividades/${id}`);
  },
};

// ..........................................
//PROGRESO
export const progresoAPI = {
  //obtener progreso general
  getGeneral: async () => {
    return await request("/progreso");
  },

  //iniciar actividad
  iniciarActividad: async () => {
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

// ..........................................
//GRAFICAS
export const graficasAPI = {
  //obtenemos el desempeno del modulo actual
  getDesempeno: async (idPaciente) => {
    return await request(`/graficas/paciente/${idPaciente}/desempeno`);
  },

  //obtener comparacion burnout
  getComparacionBurnout: async (idPaciente) => {
    return await request(
      `/graficas/paciente/${idPaciente}/comparacion-burnout`,
    );
  },
};

//.................................................
// LOGROS
export const logrosAPI = {
  //obtener todos lod logros
  getAll: async () => {
    return await request("/logros");
  },

  //obtener mis logros
  getMisLogros: async () => {
    return await request("/logros/mis-logros");
  },

  //obtener estadisticas
  getEstadisticas: async () => {
    return await request("/logros/estadisticas");
  },

  //verificar mis logros
  verificar: async () => {
    return await request("/logros/verificar");
  },
};

//....................................
// CITAS
export const citasAPI = {
  //obtener citas
  getMisCitas: async () => {
    return await request("/citas/mis-citas");
  },

  //obtener detalle cita
  getById: async (id) => {
    return await request(`/citas/${id}`);
  },
};

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
