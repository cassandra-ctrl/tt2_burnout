// UTILIDAD DE NOTIFICACIONES LOCALES
// src/utils/notificaciones.js

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "recordatorio_diario_config";

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
  // Cancelar cualquier recordatorio previo antes de crear uno nuevo
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
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

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ hora, minuto, activo: true })
  );
}

// Cancelar el recordatorio
export async function cancelarRecordatorioDiario() {
  await Notifications.cancelAllScheduledNotificationsAsync();
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
