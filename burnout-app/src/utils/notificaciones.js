// UTILIDAD DE NOTIFICACIONES LOCALES
// src/utils/notificaciones.js
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMensajeAleatorio } from "./mensajes-mascota";

const STORAGE_KEY = "recordatorio_diario_config";
const NOTIF_ID_KEY = "recordatorio_diario_id";

// Como mostrar notificaciones cuando la app esta en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Solicitar permisos al usuario
export async function solicitarPermisos() {
  const { status: existente } = await Notifications.getPermissionsAsync();
  if (existente === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Selecciona un tipo de mensaje segun la hora programada.
 * El tipo determina el "tono" emocional del mensaje.
 */
function getTipoMensajePorHora(hora) {
  if (hora >= 5 && hora < 12) {
    return "saludando"; // Mañana
  } else if (hora >= 12 && hora < 18) {
    return "motivador"; // Tarde
  } else if (hora >= 18 && hora < 22) {
    return "pensando"; // Noche temprana - perfecto para diario/reflexión
  } else {
    return "durmiendo"; // Noche tardía
  }
}

/**
 * Selecciona un titulo amigable segun el tipo de mensaje.
 */
function getTituloPorTipo(tipo) {
  switch (tipo) {
    case "saludando":
      return "🐼 ¡Buenos días!";
    case "motivador":
      return "🐼 Un momento para ti";
    case "pensando":
      return "🐼 Hora de reflexionar";
    case "durmiendo":
      return "🐼 Antes de descansar";
    case "celebrando":
      return "🐼 ¡Felicidades!";
    case "empatico":
      return "🐼 Aquí estoy";
    default:
      return "🐼 Tu mascota dice";
  }
}

// Programar recordatorio diario a la hora elegida
export async function programarRecordatorioDiario(hora, minuto) {
  // Cancelar por ID guardado (mas fiable que cancelAll)
  try {
    const idGuardado = await AsyncStorage.getItem(NOTIF_ID_KEY);
    if (idGuardado) {
      await Notifications.cancelScheduledNotificationAsync(idGuardado);
    }
  } catch (_) {}

  // Por si acaso, cancelar todas las pendientes tambien
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Elegir tipo de mensaje y obtener uno aleatorio del banco
  const tipo = getTipoMensajePorHora(hora);
  const titulo = getTituloPorTipo(tipo);
  const mensaje = getMensajeAleatorio(tipo);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: mensaje,
      sound: true,
      data: { tipo, screen: "Diario" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hora,
      minute: minuto,
    },
  });

  // Guardar el ID de la notificacion agendada
  await AsyncStorage.setItem(NOTIF_ID_KEY, id);
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ hora, minuto, activo: true, tipo })
  );
}

// Cancelar el recordatorio
export async function cancelarRecordatorioDiario() {
  try {
    const idGuardado = await AsyncStorage.getItem(NOTIF_ID_KEY);
    if (idGuardado) {
      await Notifications.cancelScheduledNotificationAsync(idGuardado);
    }
  } catch (_) {}

  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(NOTIF_ID_KEY);
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ activo: false })
  );
}

// Leer la configuracion guardada
export async function getConfigRecordatorio() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { activo: false };
  } catch {
    return { activo: false };
  }
}

/**
 * Funcion utilitaria: enviar una notificacion inmediata de prueba.
 * Util para verificar que el sistema funciona sin esperar a la hora programada.
 */
export async function enviarNotificacionPrueba() {
  const hora = new Date().getHours();
  const tipo = getTipoMensajePorHora(hora);
  const titulo = getTituloPorTipo(tipo);
  const mensaje = getMensajeAleatorio(tipo);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: mensaje,
      sound: true,
    },
    trigger: { seconds: 2 }, // Aparece en 2 segundos
  });
}