// DETALLE DE MÓDULO - Lista de actividades
// src/screens/DetalleModuloScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { progresoAPI } from "../services/api";
import { Loading } from "../components";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";
import { guardarCache, leerCache } from "../utils/offline";
import OfflineBanner from "../components/OfflineBanner";

const AZUL = "#1E3A5F";

const TIPO_CONFIG = {
  1: { icono: "leaf",           color: "#4c956c", label: "Meditación"      },
  2: { icono: "create",         color: "#0992C2", label: "Ejercicio"        },
  3: { icono: "body",           color: "#f4a259", label: "Físico"           },
  4: { icono: "book",            color: "#957025", label: "Lectura"          },
  5: { icono: "play-circle",    color: "#c1121f", label: "Video"            },
  6: { icono: "headset",        color: "#576A8F", label: "Audio"            },
  7: { icono: "game-controller",color: "#757bc8", label: "Juego"            },
};

const ESTADO_ACTIVIDAD = {
  completada:  { icono: "checkmark-circle", color: colors.success },
  en_progreso: { icono: "time",             color: colors.warning  },
  pendiente:   { icono: "ellipse-outline",  color: colors.gray     },
};

export default function DetalleModuloScreen({ navigation, route }) {
  const { modulo, pacienteId } = route.params;

  const [actividades, setActividades] = useState([]);
  const [progresoModulo, setProgresoModulo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarActividades = useCallback(async () => {
    const cacheKey = `detalle_modulo_${modulo.id_modulo}_${pacienteId}`;
    try {
      const data = await progresoAPI.getModuloProgreso(modulo.id_modulo, pacienteId);
      guardarCache(cacheKey, data);
      setActividades(data.actividades || []);
      setProgresoModulo(data.progreso || null);
    } catch (error) {
      if (error.status === 0) {
        const cached = await leerCache(cacheKey);
        if (cached) {
          setActividades(cached.actividades || []);
          setProgresoModulo(cached.progreso || null);
        }
      } else {
        console.error("Error cargando actividades:", error);
      }
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [modulo.id_modulo, pacienteId]);

  useEffect(() => {
    cargarActividades();
  }, [cargarActividades]);

  // Recargar al volver de una actividad
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", cargarActividades);
    return unsubscribe;
  }, [navigation, cargarActividades]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarActividades();
  };

  const porcentaje = progresoModulo?.porcentaje_completado || 0;

  if (cargando) return <Loading message="Cargando actividades..." />;

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{modulo.titulo}</Text>
        <Text style={styles.headerDescripcion} numberOfLines={2}>
          {modulo.descripcion}
        </Text>

        {/* Barra de progreso del módulo */}
        <View style={styles.progresoContainer}>
          <View style={styles.progresoRow}>
            <Text style={styles.progresoLabel}>Progreso</Text>
            <Text style={styles.progresoLabel}>{porcentaje}%</Text>
          </View>
          <View style={styles.barraFondo}>
            <View style={[styles.barraRelleno, { width: `${porcentaje}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={AZUL} />
        }
      >
        <View style={styles.contenido}>
          <Text style={styles.seccionTitulo}>
            Actividades ({progresoModulo?.completadas || 0}/{progresoModulo?.total_actividades || actividades.length})
          </Text>

          {actividades.map((actividad, index) => {
            const tipo = TIPO_CONFIG[actividad.id_tipo] || TIPO_CONFIG[2];
            const estadoConfig = ESTADO_ACTIVIDAD[actividad.estado] || ESTADO_ACTIVIDAD.pendiente;
            const completada = actividad.estado === "completada";

            return (
              <TouchableOpacity
                key={actividad.id_actividad}
                style={[styles.actividadCard, completada && styles.cardCompletada]}
                onPress={() => navigation.navigate("Actividad", { actividad, modulo, pacienteId })}
                activeOpacity={0.7}
              >
                {/* Ícono de tipo */}
                <View style={[styles.tipoIcono, { backgroundColor: tipo.color + "20" }]}>
                  <Ionicons name={tipo.icono} size={22} color={tipo.color} />
                </View>

                {/* Info */}
                <View style={styles.actividadInfo}>
                  <Text style={[styles.actividadTitulo, completada && styles.textoTachado]}>
                    {actividad.titulo}
                  </Text>
                  <View style={styles.actividadMeta}>
                    <Text style={styles.metaTexto}>{tipo.label}</Text>
                    <Text style={styles.metaSeparador}>·</Text>
                    <Text style={styles.metaTexto}>{actividad.duracion_minutos} min</Text>
                  </View>
                </View>

                {/* Estado */}
                <Ionicons name={estadoConfig.icono} size={22} color={estadoConfig.color} />
              </TouchableOpacity>
            );
          })}

          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: AZUL,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: { marginBottom: spacing.sm },
  headerTitulo: {
    fontSize: fonts.sizes.xl,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerDescripcion: {
    fontSize: fonts.sizes.sm,
    color: colors.primaryLight,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  progresoContainer: { marginTop: spacing.xs },
  progresoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  progresoLabel: { fontSize: fonts.sizes.xs, color: colors.primaryLight },
  barraFondo: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  barraRelleno: {
    height: "100%",
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
  },
  scroll: { flex: 1 },
  contenido: { padding: spacing.lg },
  seccionTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.md,
  },
  actividadCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompletada: { opacity: 0.75 },
  tipoIcono: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  actividadInfo: { flex: 1 },
  actividadTitulo: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  textoTachado: { textDecorationLine: "line-through", color: colors.textSecondary },
  actividadMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaTexto: { fontSize: fonts.sizes.xs, color: colors.textSecondary },
  metaSeparador: { fontSize: fonts.sizes.xs, color: colors.gray },
});
