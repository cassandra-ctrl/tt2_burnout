// src/utils/mensajes-mascota.js
// BANCO DE MENSAJES MOTIVACIONALES PARA LA MASCOTA (PANDA)

export const MENSAJES = {
  // Para Panda Saludando - login, bienvenida diaria
  saludando: [
    "¡Hola! Me alegra verte de nuevo. ¿Listo para cuidar tu bienestar hoy?",
    "¡Buen día! Hoy es un buen momento para dedicarte un minuto a ti.",
    "Bienvenido de vuelta. Recuerda que cada pequeño paso cuenta.",
    "Qué bueno verte. Estoy aquí para acompañarte en tu proceso.",
    "¡Hola! Tu bienestar es importante. Empecemos.",
  ],

  // Para Panda Celebrando - logros, actividades completadas, rachas
  celebrando: [
    "¡Excelente trabajo! Cada actividad completada te acerca a sentirte mejor.",
    "¡Felicidades por completar este módulo! Sigue así.",
    "¡Lo lograste! Esa constancia es lo que marca la diferencia.",
    "¡Increíble racha! Tu compromiso es admirable.",
    "¡Nuevo logro desbloqueado! Mereces celebrar este avance.",
  ],

  // Para Panda Motivador - recordatorios, retomar actividades
  motivador: [
    "¿Te animas a hacer una actividad rápida? Solo te tomará unos minutos.",
    "Tu yo del futuro te agradecerá por dedicarte este tiempo hoy.",
    "Recuerda: el progreso no es lineal, pero siempre vale la pena.",
    "Un pequeño paso hoy es un gran logro mañana.",
    "Hoy es un buen día para regresar. Te espero.",
  ],

  // Para Panda Empático - nivel alto de burnout, apoyo emocional
  empatico: [
    "Está bien sentirse así. Estamos en esto juntos, paso a paso.",
    "Lo que sientes es válido. Tomemos esto con calma.",
    "No tienes que tener todo resuelto hoy. Vamos despacio.",
    "Recuerda: pedir ayuda profesional también es un acto de fortaleza.",
    "Cuidarte no es egoísmo, es necesario. Empecemos por algo pequeño.",
  ],

  // Para Panda Durmiendo - notificaciones nocturnas, descanso
  durmiendo: [
    "Hora de descansar. Mañana será un nuevo comienzo.",
    "Tu descanso también es parte del proceso. Buenas noches.",
    "Que tengas un sueño reparador. Mañana nos vemos.",
    "Recuerda: dormir bien es cuidar de ti mismo.",
    "Es momento de soltar el día. Descansa.",
  ],

  // Para Panda Pensando - test OLBI, diario, reflexión
  pensando: [
    "Tómate tu tiempo. No hay respuestas correctas o incorrectas, solo las tuyas.",
    "Reflexionar sobre cómo te sientes es el primer paso para sentirte mejor.",
    "Sé honesto contigo mismo. Nadie más leerá esto sin tu permiso.",
    "Date permiso de pensar profundo, sin prisa.",
    "Hoy es un buen día para escucharte.",
  ],

  // Para Panda Meditando - respiración guiada, mindfulness
  meditando: [
    "Respira profundo. Estás justo donde necesitas estar.",
    "Concédete este momento. Solo respira.",
    "Tu mente merece este descanso. Toma tu tiempo.",
    "La calma se encuentra adentro. Vamos juntos.",
    "Inhala paz, exhala tensión.",
  ],

  // Para Panda Estudiando - modulos, contenido educativo
  estudiando: [
    "Aprender sobre ti mismo es el mejor regalo que puedes darte.",
    "Cada módulo es una herramienta nueva para tu bienestar.",
    "Curioso es el primer paso para sanar.",
    "El conocimiento es poder. Sigue explorando.",
    "Estás invirtiendo en ti. Esto siempre vale la pena.",
  ],
};

/**
 * Obtiene un mensaje aleatorio del tipo solicitado.
 * @param {string} tipo - El tipo de mensaje (saludando, celebrando, etc.)
 * @returns {string} Un mensaje aleatorio
 */
export function getMensajeAleatorio(tipo) {
  const mensajes = MENSAJES[tipo];
  if (!mensajes || mensajes.length === 0) {
    return MENSAJES.saludando[0];
  }
  const indice = Math.floor(Math.random() * mensajes.length);
  return mensajes[indice];
}

/**
 * Obtiene un mensaje contextual según el nivel de burnout.
 * @param {string} nivel - "bajo" | "medio" | "alto"
 * @returns {object} { tipo, mensaje }
 */
export function getMensajePorBurnout(nivel) {
  let tipo;
  switch (nivel) {
    case "alto":
      tipo = "empatico";
      break;
    case "medio":
      tipo = "motivador";
      break;
    case "bajo":
      tipo = "celebrando";
      break;
    default:
      tipo = "saludando";
  }
  return {
    tipo,
    mensaje: getMensajeAleatorio(tipo),
  };
}

/**
 * Obtiene un mensaje contextual según la hora del día.
 * Útil para saludos o notificaciones.
 * @returns {object} { tipo, mensaje }
 */
export function getMensajePorHora() {
  const hora = new Date().getHours();
  let tipo;

  if (hora >= 5 && hora < 12) {
    tipo = "saludando"; // Mañana
  } else if (hora >= 12 && hora < 18) {
    tipo = "motivador"; // Tarde
  } else if (hora >= 18 && hora < 22) {
    tipo = "pensando"; // Noche temprana
  } else {
    tipo = "durmiendo"; // Noche tardía
  }

  return {
    tipo,
    mensaje: getMensajeAleatorio(tipo),
  };
}