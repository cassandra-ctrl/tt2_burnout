// UTILIDAD DE NOTIFICACIONES LOCALES
// src/utils/notificaciones.js

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "recordatorio_diario_config";
const NOTIF_ID_KEY = "recordatorio_diario_id";

// Cómo mostrar notificaciones cuando la app está en primer plano
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

// Programar recordatorio diario a la hora elegida
export async function programarRecordatorioDiario(hora, minuto) {
  // Cancelar por ID guardado (más fiable que cancelAll)
  try {
    const idGuardado = await AsyncStorage.getItem(NOTIF_ID_KEY);
    if (idGuardado) {
      await Notifications.cancelScheduledNotificationAsync(idGuardado);
    }
  } catch (_) {}

  // Por si acaso, cancelar todas las pendientes también
  await Notifications.cancelAllScheduledNotificationsAsync();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "📔 Diario de gratitud",
      body: "¿Ya escribiste lo que agradeces hoy?",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hora,
      minute: minuto,
    },
  });

  // Guardar el ID de la notificación agendada
  await AsyncStorage.setItem(NOTIF_ID_KEY, id);
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ hora, minuto, activo: true })
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

// Leer la configuración guardada
export async function getConfigRecordatorio() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { activo: false };
  } catch {
    return { activo: false };
  }
}
