// PANTALLA DE CITAS
// src/screens/CitasScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { citasAPI } from "../services/api";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";

const AZUL = "#1E3A5F";

const ESTADO_CONFIG = {
  programada: { label: "Programada", color: AZUL, bg: AZUL + "15", icon: "calendar" },
  completada: { label: "Completada", color: colors.success, bg: colors.success + "15", icon: "checkmark-circle" },
  cancelada:  { label: "Cancelada",  color: colors.error,   bg: colors.error + "15",   icon: "close-circle" },
  no_asistio: { label: "No asistió", color: colors.warning, bg: colors.warning + "15", icon: "alert-circle" },
};

function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  const solo = String(fechaStr).split("T")[0];
  const fecha = new Date(solo + "T12:00:00");
  return fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatearHora(horaStr) {
  if (!horaStr) return "";
  // horaStr viene como "HH:MM:SS" o "HH:MM"
  const partes = String(horaStr).split(":");
  const h = parseInt(partes[0]);
  const m = partes[1];
  const ampm = h >= 12 ? "p.m." : "a.m.";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function CitaCard({ cita }) {
  const estado = ESTADO_CONFIG[cita.estado] || ESTADO_CONFIG.programada;

  return (
    <View style={styles.citaCard}>
      {/* Línea de color según estado */}
      <View style={[styles.citaAccent, { backgroundColor: estado.color }]} />

      <View style={styles.citaBody}>
        {/* Fecha y hora */}
        <View style={styles.citaFechaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.citaFecha}>{formatearFecha(cita.fecha_cita)}</Text>
        </View>
        <View style={styles.citaFechaRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.citaHora}>{formatearHora(cita.hora_cita)}</Text>
        </View>

        {/* Tipo de cita */}
        <Text style={styles.citaTipo}>{cita.tipo_cita}</Text>

        {/* Psicólogo */}
        <View style={styles.citaPsicRow}>
          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.citaPsicologo}>{cita.psicologo_nombre}</Text>
        </View>

        {/* Observaciones */}
        {!!cita.observaciones && (
          <Text style={styles.citaObs}>{cita.observaciones}</Text>
        )}

        {/* Badge de estado */}
        <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
          <Ionicons name={estado.icon} size={12} color={estado.color} />
          <Text style={[styles.estadoTexto, { color: estado.color }]}>{estado.label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function CitasScreen({ navigation }) {
  const [proximas, setProximas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarCitas = useCallback(async () => {
    try {
      const data = await citasAPI.getMisCitas();
      setProximas(data.proximas || []);
      setHistorial(data.historial || []);
    } catch (error) {
      console.error("Error cargando citas:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarCitas();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Mis citas</Text>
      </View>

      {cargando ? (
        <View style={styles.centrado}>
          <Text style={styles.cargandoTexto}>Cargando...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={AZUL} />
          }
        >
          <View style={styles.contenido}>

            {/* PRÓXIMAS */}
            <View style={styles.seccionHeader}>
              <Ionicons name="calendar" size={18} color={AZUL} />
              <Text style={styles.seccionTitulo}>Próximas citas</Text>
            </View>

            {proximas.length === 0 ? (
              <View style={styles.vacioBanner}>
                <Ionicons name="calendar-outline" size={36} color={colors.gray} />
                <Text style={styles.vacioTexto}>No tienes citas programadas.</Text>
                <Text style={styles.vacioSub}>
                  Tu psicólogo te asignará citas desde el portal.
                </Text>
              </View>
            ) : (
              proximas.map((c) => <CitaCard key={c.id_cita} cita={c} />)
            )}

            {/* HISTORIAL */}
            {historial.length > 0 && (
              <>
                <View style={[styles.seccionHeader, { marginTop: spacing.lg }]}>
                  <Ionicons name="time" size={18} color={colors.textSecondary} />
                  <Text style={styles.seccionTitulo}>Historial</Text>
                </View>
                {historial.map((c) => <CitaCard key={c.id_cita} cita={c} />)}
              </>
            )}

            <View style={{ height: spacing.xl }} />
          </View>
        </ScrollView>
      )}
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitulo: {
    fontSize: fonts.sizes.xxl,
    fontWeight: "bold",
    color: colors.white,
  },
  contenido: { padding: spacing.lg },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  seccionTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
  },
  citaCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  citaAccent: {
    width: 4,
  },
  citaBody: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  citaFechaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  citaFecha: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  citaHora: {
    fontSize: fonts.sizes.sm,
    fontWeight: "bold",
    color: colors.text,
  },
  citaTipo: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: AZUL,
    marginTop: 2,
  },
  citaPsicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  citaPsicologo: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  citaObs: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  estadoTexto: {
    fontSize: fonts.sizes.xs,
    fontWeight: "600",
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cargandoTexto: {
    color: colors.textSecondary,
  },
  vacioBanner: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  vacioTexto: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
  },
  vacioSub: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
