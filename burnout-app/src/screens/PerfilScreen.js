// PANTALLA DE PERFIL
// src/screens/PerfilScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { progresoAPI, authAPI } from "../services/api";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";
import {
  solicitarPermisos,
  programarRecordatorioDiario,
  cancelarRecordatorioDiario,
  getConfigRecordatorio,
} from "../utils/notificaciones";

const AZUL = "#1E3A5F";

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const pacienteId = usuario?.roleId || usuario?.role_id;

  const [stats, setStats] = useState(null);
  const [mostrarCambioContrasena, setMostrarCambioContrasena] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);

  // Recordatorio diario
  const [recordatorioActivo, setRecordatorioActivo] = useState(false);
  const [recordatorioHora, setRecordatorioHora] = useState(20);
  const [recordatorioMinuto, setRecordatorioMinuto] = useState(0);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);
  const [horaTemp, setHoraTemp] = useState(20);
  const [minutoTemp, setMinutoTemp] = useState(0);

  const cargarStats = useCallback(async () => {
    try {
      const data = await progresoAPI.getByPaciente(pacienteId);
      setStats(data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }, [pacienteId]);

  useEffect(() => {
    cargarStats();
    cargarConfigNotificacion();
  }, [cargarStats]);

  const cargarConfigNotificacion = async () => {
    const config = await getConfigRecordatorio();
    if (config.activo) {
      setRecordatorioActivo(true);
      setRecordatorioHora(config.hora ?? 20);
      setRecordatorioMinuto(config.minuto ?? 0);
    }
  };

  const handleToggleRecordatorio = async (valor) => {
    if (valor) {
      const permiso = await solicitarPermisos();
      if (!permiso) {
        Alert.alert(
          "Permiso requerido",
          "Para activar el recordatorio necesitas permitir notificaciones en los ajustes de tu dispositivo."
        );
        return;
      }
      setRecordatorioActivo(true);
      setHoraTemp(recordatorioHora);
      setMinutoTemp(recordatorioMinuto);
      setMostrarPickerHora(true);
    } else {
      await cancelarRecordatorioDiario();
      setRecordatorioActivo(false);
      Alert.alert("Recordatorio desactivado", "Ya no recibirás recordatorios del diario.");
    }
  };

  const handleGuardarHora = async () => {
    try {
      await programarRecordatorioDiario(horaTemp, minutoTemp);
      setRecordatorioHora(horaTemp);
      setRecordatorioMinuto(minutoTemp);
      setMostrarPickerHora(false);
      const h = String(horaTemp).padStart(2, "0");
      const m = String(minutoTemp).padStart(2, "0");
      Alert.alert("Recordatorio activado", `Te avisaremos todos los días a las ${h}:${m}.`);
    } catch (error) {
      console.error("Error programando notificación:", error);
      Alert.alert("Error", "No se pudo programar el recordatorio. Verifica que la app tenga permiso de notificaciones.");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: logout },
      ]
    );
  };

  const handleCambiarContrasena = async () => {
    if (!contrasenaActual.trim() || !contrasenaNueva.trim()) {
      Alert.alert("Aviso", "Completa ambos campos.");
      return;
    }
    if (contrasenaNueva.length < 6) {
      Alert.alert("Aviso", "La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    try {
      setGuardando(true);
      await authAPI.changePassword(contrasenaActual, contrasenaNueva);
      Alert.alert("Listo", "Contraseña actualizada correctamente.");
      setContrasenaActual("");
      setContrasenaNueva("");
      setMostrarCambioContrasena(false);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo actualizar la contraseña.");
    } finally {
      setGuardando(false);
    }
  };

  // Iniciales del avatar
  const iniciales = [usuario?.nombre, usuario?.paterno]
    .filter(Boolean)
    .map((s) => s[0].toUpperCase())
    .join("");

  const nombreCompleto = [usuario?.nombre, usuario?.paterno, usuario?.materno]
    .filter(Boolean)
    .join(" ");

  const rachaActual = stats?.paciente?.racha_actual || 0;
  const rachaMaxima = stats?.paciente?.racha_maxima || 0;
  const porcentaje = stats?.progreso_general?.porcentaje_completado || 0;
  const completadas = stats?.progreso_general?.actividades_completadas || 0;
  const total = stats?.progreso_general?.total_actividades || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Mi perfil</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.contenido}>

          {/* Avatar e info principal */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciales}</Text>
            </View>
            <Text style={styles.nombre}>{nombreCompleto}</Text>
            <Text style={styles.correo}>{usuario?.correo}</Text>
            {stats?.paciente?.matricula && (
              <View style={styles.matriculaBadge}>
                <Text style={styles.matriculaTexto}>
                  Matrícula: {stats.paciente.matricula}
                </Text>
              </View>
            )}
          </View>

          {/* Estadísticas */}
          <Text style={styles.seccionTitulo}>Mis estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcono}>🔥</Text>
              <Text style={styles.statValor}>{rachaActual}</Text>
              <Text style={styles.statLabel}>Racha actual</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcono}>🏆</Text>
              <Text style={styles.statValor}>{rachaMaxima}</Text>
              <Text style={styles.statLabel}>Racha máxima</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcono}>✅</Text>
              <Text style={styles.statValor}>{completadas}/{total}</Text>
              <Text style={styles.statLabel}>Actividades</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcono}>📊</Text>
              <Text style={styles.statValor}>{porcentaje}%</Text>
              <Text style={styles.statLabel}>Completado</Text>
            </View>
          </View>

          {/* Opciones */}
          <Text style={styles.seccionTitulo}>Cuenta</Text>
          <View style={styles.opcionesCard}>

            {/* Cambiar contraseña */}
            <TouchableOpacity
              style={styles.opcionRow}
              onPress={() => setMostrarCambioContrasena(!mostrarCambioContrasena)}
            >
              <View style={styles.opcionIcono}>
                <Ionicons name="lock-closed-outline" size={20} color={AZUL} />
              </View>
              <Text style={styles.opcionTexto}>Cambiar contraseña</Text>
              <Ionicons
                name={mostrarCambioContrasena ? "chevron-up" : "chevron-forward"}
                size={18}
                color={colors.gray}
              />
            </TouchableOpacity>

            {/* Formulario cambio de contraseña */}
            {mostrarCambioContrasena && (
              <View style={styles.cambioContrasenaForm}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Contraseña actual"
                    placeholderTextColor={colors.gray}
                    secureTextEntry={!verActual}
                    value={contrasenaActual}
                    onChangeText={setContrasenaActual}
                  />
                  <TouchableOpacity onPress={() => setVerActual(!verActual)} style={styles.eyeBtn}>
                    <Ionicons name={verActual ? "eye-off-outline" : "eye-outline"} size={20} color={colors.gray} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva contraseña"
                    placeholderTextColor={colors.gray}
                    secureTextEntry={!verNueva}
                    value={contrasenaNueva}
                    onChangeText={setContrasenaNueva}
                  />
                  <TouchableOpacity onPress={() => setVerNueva(!verNueva)} style={styles.eyeBtn}>
                    <Ionicons name={verNueva ? "eye-off-outline" : "eye-outline"} size={20} color={colors.gray} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.botonGuardar, guardando && { opacity: 0.6 }]}
                  onPress={handleCambiarContrasena}
                  disabled={guardando}
                >
                  <Text style={styles.botonGuardarTexto}>
                    {guardando ? "Guardando..." : "Guardar contraseña"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.separador} />

            {/* Recordatorio diario */}
            <View style={styles.opcionRow}>
              <View style={styles.opcionIcono}>
                <Ionicons name="notifications-outline" size={20} color={AZUL} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opcionTexto}>Recordatorio del diario</Text>
                {recordatorioActivo && (
                  <Text style={styles.recordatorioHoraTexto}>
                    {String(recordatorioHora).padStart(2, "0")}:{String(recordatorioMinuto).padStart(2, "0")} h
                  </Text>
                )}
              </View>
              <Switch
                value={recordatorioActivo}
                onValueChange={handleToggleRecordatorio}
                trackColor={{ false: colors.grayLight, true: AZUL + "80" }}
                thumbColor={recordatorioActivo ? AZUL : colors.gray}
              />
            </View>

            {recordatorioActivo && (
              <TouchableOpacity
                style={styles.cambiarHoraBtn}
                onPress={() => {
                  setHoraTemp(recordatorioHora);
                  setMinutoTemp(recordatorioMinuto);
                  setMostrarPickerHora(true);
                }}
              >
                <Ionicons name="time-outline" size={15} color={AZUL} />
                <Text style={styles.cambiarHoraTexto}>Cambiar hora</Text>
              </TouchableOpacity>
            )}

            <View style={styles.separador} />

            {/* Cerrar sesión */}
            <TouchableOpacity style={styles.opcionRow} onPress={handleLogout}>
              <View style={[styles.opcionIcono, { backgroundColor: colors.error + "15" }]}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
              </View>
              <Text style={[styles.opcionTexto, { color: colors.error }]}>
                Cerrar sesión
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>

          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      {/* Modal selector de hora */}
      <Modal
        visible={mostrarPickerHora}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarPickerHora(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Hora del recordatorio</Text>
            <Text style={styles.modalSubtitulo}>
              Recibirás una notificación diaria a esta hora
            </Text>

            <View style={styles.pickerRow}>
              {/* Horas */}
              <View style={styles.pickerCol}>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setHoraTemp((h) => (h + 1) % 24)}
                >
                  <Ionicons name="chevron-up" size={22} color={AZUL} />
                </TouchableOpacity>
                <Text style={styles.pickerValor}>{String(horaTemp).padStart(2, "0")}</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setHoraTemp((h) => (h - 1 + 24) % 24)}
                >
                  <Ionicons name="chevron-down" size={22} color={AZUL} />
                </TouchableOpacity>
              </View>

              <Text style={styles.pickerSep}>:</Text>

              {/* Minutos (en pasos de 5) */}
              <View style={styles.pickerCol}>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setMinutoTemp((m) => (m + 5) % 60)}
                >
                  <Ionicons name="chevron-up" size={22} color={AZUL} />
                </TouchableOpacity>
                <Text style={styles.pickerValor}>{String(minutoTemp).padStart(2, "0")}</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setMinutoTemp((m) => (m - 5 + 60) % 60)}
                >
                  <Ionicons name="chevron-down" size={22} color={AZUL} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => {
                  setMostrarPickerHora(false);
                  if (!recordatorioActivo) setRecordatorioActivo(false);
                }}
              >
                <Text style={styles.modalBtnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnGuardar} onPress={handleGuardarHora}>
                <Text style={styles.modalBtnGuardarTexto}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: AZUL,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitulo: {
    fontSize: fonts.sizes.xxl,
    fontWeight: "bold",
    color: colors.white,
  },
  contenido: { padding: spacing.lg },
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AZUL,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarTexto: {
    fontSize: fonts.sizes.xl,
    fontWeight: "bold",
    color: colors.white,
  },
  nombre: {
    fontSize: fonts.sizes.lg,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  correo: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  matriculaBadge: {
    backgroundColor: AZUL + "15",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  matriculaTexto: {
    fontSize: fonts.sizes.xs,
    color: AZUL,
    fontWeight: "600",
  },
  seccionTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcono: { fontSize: 24, marginBottom: spacing.xs },
  statValor: {
    fontSize: fonts.sizes.xl,
    fontWeight: "bold",
    color: AZUL,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    textAlign: "center",
  },
  opcionesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  opcionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  opcionIcono: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: AZUL + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  opcionTexto: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    fontWeight: "500",
    color: colors.text,
  },
  separador: {
    height: 1,
    backgroundColor: colors.grayLight,
    marginHorizontal: spacing.md,
  },
  cambioContrasenaForm: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  eyeBtn: {
    paddingLeft: spacing.sm,
  },
  botonGuardar: {
    backgroundColor: AZUL,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  botonGuardarTexto: {
    color: colors.white,
    fontWeight: "600",
    fontSize: fonts.sizes.sm,
  },
  recordatorioHoraTexto: {
    fontSize: fonts.sizes.xs,
    color: AZUL,
    fontWeight: "600",
    marginTop: 2,
  },
  cambiarHoraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  cambiarHoraTexto: {
    fontSize: fonts.sizes.xs,
    color: AZUL,
    fontWeight: "600",
  },

  // Modal selector de hora
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "100%",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitulo: {
    fontSize: fonts.sizes.lg,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitulo: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pickerCol: {
    alignItems: "center",
    gap: spacing.xs,
  },
  pickerBtn: {
    padding: spacing.sm,
    backgroundColor: AZUL + "12",
    borderRadius: borderRadius.md,
  },
  pickerValor: {
    fontSize: 48,
    fontWeight: "bold",
    color: AZUL,
    width: 80,
    textAlign: "center",
  },
  pickerSep: {
    fontSize: 40,
    fontWeight: "bold",
    color: AZUL,
    marginBottom: 8,
  },
  modalBotones: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  modalBtnCancelar: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    alignItems: "center",
  },
  modalBtnCancelarTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  modalBtnGuardar: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: AZUL,
    alignItems: "center",
  },
  modalBtnGuardarTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.white,
    fontWeight: "600",
  },
});
