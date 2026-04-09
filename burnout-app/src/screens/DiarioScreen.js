// PANTALLA DIARIO DE GRATITUD
// src/screens/DiarioScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { diarioAPI } from "../services/api";
import { Button } from "../components";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";
import { useNetwork } from "../context/NetworkContext";
import { guardarCache, leerCache, agregarCola, estaConectado, getFechaLocal } from "../utils/offline";
import OfflineBanner from "../components/OfflineBanner";

const AZUL = "#1E3A5F";

// Normaliza cualquier formato de fecha a YYYY-MM-DD
function normalizarFecha(fechaStr) {
  if (!fechaStr) return "";
  return String(fechaStr).split("T")[0];
}

function formatearFecha(fechaStr) {
  const solo = normalizarFecha(fechaStr);
  const fecha = new Date(solo + "T12:00:00");
  return fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}


function esFechaHoy(fechaStr) {
  return normalizarFecha(fechaStr) === getFechaLocal();
}

export default function DiarioScreen() {
  const { isConnected, lastSyncAt, refrescarPendientes } = useNetwork();
  const [entradaHoy, setEntradaHoy] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Modo edición del día de hoy
  const [modoEdicion, setModoEdicion] = useState(false);
  const [textoHoy, setTextoHoy] = useState("");

  const cargarDatos = useCallback(async () => {
    try {
      const [hoyData, historialData] = await Promise.all([
        diarioAPI.getHoy(),
        diarioAPI.getHistorial(),
      ]);
      guardarCache("diario_hoy", hoyData);
      guardarCache("diario_historial", historialData);

      setEntradaHoy(hoyData.entrada);
      setTextoHoy(hoyData.entrada?.contenido || "");
      const entradasPasadas = (historialData.entradas || []).filter(
        (e) => !esFechaHoy(e.fecha)
      );
      setHistorial(entradasPasadas);
    } catch (error) {
      if (error.status === 0) {
        const hoyData = await leerCache("diario_hoy");
        const historialData = await leerCache("diario_historial");
        if (hoyData) {
          setEntradaHoy(hoyData.entrada);
          setTextoHoy(hoyData.entrada?.contenido || "");
        }
        if (historialData) {
          setHistorial((historialData.entradas || []).filter((e) => !esFechaHoy(e.fecha)));
        }
      } else {
        console.error("Error cargando diario:", error);
      }
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Recargar cuando el sync termina (lastSyncAt cambia)
  useEffect(() => {
    if (lastSyncAt) cargarDatos();
  }, [lastSyncAt]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarDatos();
  };

  const handleGuardar = async () => {
    if (!textoHoy.trim()) {
      Alert.alert("Aviso", "Escribe algo antes de guardar.");
      return;
    }

    const conectado = await estaConectado();
    if (!conectado) {
      const fecha = getFechaLocal();
      await agregarCola({
        type: "guardar_diario",
        payload: { contenido: textoHoy.trim(), fecha },
      });
      await refrescarPendientes();
      setEntradaHoy({ contenido: textoHoy.trim(), fecha });
      setModoEdicion(false);
      Alert.alert("Sin conexión", "Tu entrada se guardará cuando vuelvas a conectarte.");
      return;
    }

    try {
      setGuardando(true);
      const data = await diarioAPI.guardar(textoHoy.trim());
      setEntradaHoy(data.entrada);
      setModoEdicion(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la entrada.");
    } finally {
      setGuardando(false);
    }
  };

  const fechaHoyFormateada = formatearFecha(getFechaLocal());

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Diario de gratitud</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary }}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Diario de gratitud</Text>
          <Text style={styles.headerSubtitulo}>Escribe lo que agradeces hoy</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={AZUL} />
          }
        >
          <View style={styles.contenido}>

            {/* ENTRADA DE HOY */}
            <View style={styles.seccionHeader}>
              <Ionicons name="sunny" size={18} color={colors.warning} />
              <Text style={styles.seccionTitulo}>Hoy</Text>
            </View>
            <Text style={styles.fechaTexto}>{fechaHoyFormateada}</Text>

            {/* Sin entrada o en modo edición */}
            {(!entradaHoy || modoEdicion) ? (
              <View style={styles.card}>
                <TextInput
                  style={styles.inputHoy}
                  value={textoHoy}
                  onChangeText={setTextoHoy}
                  placeholder="¿Qué agradeces hoy? Puedes escribir varias cosas..."
                  placeholderTextColor={colors.gray}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={1000}
                  autoFocus={modoEdicion}
                />
                <View style={styles.inputFooter}>
                  <Text style={styles.contadorTexto}>{textoHoy.length}/1000</Text>
                  <View style={styles.botonesRow}>
                    {modoEdicion && (
                      <TouchableOpacity
                        style={styles.botonCancelar}
                        onPress={() => {
                          setTextoHoy(entradaHoy?.contenido || "");
                          setModoEdicion(false);
                        }}
                      >
                        <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                    <Button
                      title="Guardar"
                      onPress={handleGuardar}
                      loading={guardando}
                      style={styles.botonGuardar}
                    />
                  </View>
                </View>
              </View>
            ) : (
              /* Entrada guardada */
              <View style={styles.card}>
                <View style={styles.entradaHeader}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.entradaGuardada}>Entrada guardada</Text>
                  <TouchableOpacity
                    style={styles.botonEditar}
                    onPress={() => setModoEdicion(true)}
                  >
                    <Ionicons name="create-outline" size={18} color={AZUL} />
                    <Text style={styles.botonEditarTexto}>Editar</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.contenidoTexto}>{entradaHoy.contenido}</Text>
              </View>
            )}

            {/* HISTORIAL */}
            {historial.length > 0 && (
              <>
                <View style={[styles.seccionHeader, { marginTop: spacing.md }]}>
                  <Ionicons name="time" size={18} color={colors.textSecondary} />
                  <Text style={styles.seccionTitulo}>Entradas anteriores</Text>
                </View>

                {historial.map((entrada) => (
                  <View key={entrada.id_entrada} style={styles.cardHistorial}>
                    <Text style={styles.historialFecha}>
                      {formatearFecha(entrada.fecha)}
                    </Text>
                    <Text style={styles.historialContenido}>
                      {entrada.contenido}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {historial.length === 0 && entradaHoy && (
              <View style={styles.vacioBanner}>
                <Ionicons name="journal-outline" size={32} color={colors.gray} />
                <Text style={styles.vacioTexto}>
                  Esta es tu primera entrada. ¡Sigue escribiendo cada día!
                </Text>
              </View>
            )}

            <View style={{ height: spacing.xl }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerSubtitulo: {
    fontSize: fonts.sizes.sm,
    color: colors.primaryLight,
    marginTop: spacing.xs,
  },
  contenido: { padding: spacing.lg },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  seccionTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
  },
  fechaTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "capitalize",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  inputHoy: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: "top",
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    paddingTop: spacing.sm,
  },
  contadorTexto: {
    fontSize: fonts.sizes.xs,
    color: colors.gray,
  },
  botonesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  botonCancelar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  botonCancelarTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  botonGuardar: {
    flex: 0,
    paddingHorizontal: spacing.lg,
    backgroundColor: AZUL,
    borderRadius: borderRadius.lg,
  },
  entradaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  entradaGuardada: {
    fontSize: fonts.sizes.sm,
    color: colors.success,
    fontWeight: "600",
    flex: 1,
  },
  botonEditar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  botonEditarTexto: {
    fontSize: fonts.sizes.sm,
    color: AZUL,
    fontWeight: "600",
  },
  contenidoTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 22,
  },
  cardHistorial: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  historialFecha: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: spacing.xs,
  },
  historialContenido: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  vacioBanner: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  vacioTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
});
