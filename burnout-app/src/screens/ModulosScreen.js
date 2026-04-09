// PANTALLA DE MÓDULOS
// src/screens/ModulosScreen.js

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
import { useAuth } from "../context/AuthContext";
import { modulosAPI, progresoAPI } from "../services/api";
import { Loading } from "../components";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";

const AZUL = "#1E3A5F";

const ESTADO_CONFIG = {
  completado:  { color: colors.success, icono: "checkmark-circle",  label: "Completado" },
  en_progreso: { color: colors.warning, icono: "time",               label: "En progreso" },
  bloqueado:   { color: colors.gray,    icono: "lock-closed",        label: "Bloqueado" },
};

export default function ModulosScreen({ navigation }) {
  const { usuario } = useAuth();
  const pacienteId = usuario?.roleId || usuario?.role_id;

  const [modulos, setModulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarModulos = useCallback(async () => {
    try {
      const data = await modulosAPI.getAll();
      setModulos(data.modulos || []);
    } catch (error) {
      console.error("Error cargando módulos:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarModulos();
  }, [cargarModulos]);

  // Recargar al volver de una actividad
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", cargarModulos);
    return unsubscribe;
  }, [navigation, cargarModulos]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarModulos();
  };

  const handleModulo = (modulo) => {
    if (modulo.bloqueado) return;
    navigation.navigate("DetalleModulo", { modulo, pacienteId });
  };

  if (cargando) return <Loading message="Cargando módulos..." />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Módulos</Text>
        <Text style={styles.headerSubtitulo}>Tu camino de aprendizaje</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={AZUL} />
        }
      >
        <View style={styles.contenido}>
          {modulos.map((modulo, index) => {
            const config = ESTADO_CONFIG[modulo.estado] || ESTADO_CONFIG.bloqueado;
            const porcentaje = modulo.porcentaje_completado || 0;

            return (
              <TouchableOpacity
                key={modulo.id_modulo}
                style={[styles.card, modulo.bloqueado && styles.cardBloqueado]}
                onPress={() => handleModulo(modulo)}
                activeOpacity={modulo.bloqueado ? 1 : 0.7}
              >
                {/* Número y estado */}
                <View style={styles.cardHeader}>
                  <View style={[styles.numeroBadge, { backgroundColor: modulo.bloqueado ? colors.gray : AZUL }]}>
                    <Text style={styles.numeroTexto}>{index + 1}</Text>
                  </View>
                  <View style={[styles.estadoBadge, { backgroundColor: config.color + "20" }]}>
                    <Ionicons name={config.icono} size={14} color={config.color} />
                    <Text style={[styles.estadoTexto, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </View>
                </View>

                {/* Título y descripción */}
                <Text style={[styles.moduloTitulo, modulo.bloqueado && styles.textoGris]}>
                  {modulo.titulo}
                </Text>
                <Text style={styles.moduloDescripcion} numberOfLines={2}>
                  {modulo.descripcion}
                </Text>

                {/* Pie: actividades + barra de progreso */}
                <View style={styles.cardFooter}>
                  <Text style={styles.actividadesTexto}>
                    {modulo.total_actividades} actividades
                  </Text>
                  {!modulo.bloqueado && (
                    <Text style={styles.porcentajeTexto}>{porcentaje}%</Text>
                  )}
                </View>

                {!modulo.bloqueado && (
                  <View style={styles.barraFondo}>
                    <View style={[styles.barraRelleno, { width: `${porcentaje}%`, backgroundColor: config.color }]} />
                  </View>
                )}

                {/* Flecha o candado */}
                <View style={styles.accionIcono}>
                  <Ionicons
                    name={modulo.bloqueado ? "lock-closed" : "chevron-forward"}
                    size={20}
                    color={modulo.bloqueado ? colors.gray : AZUL}
                  />
                </View>
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
  scroll: { flex: 1 },
  contenido: { padding: spacing.lg },
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
    position: "relative",
  },
  cardBloqueado: { opacity: 0.6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  numeroBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  numeroTexto: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: fonts.sizes.sm,
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  estadoTexto: { fontSize: fonts.sizes.xs, fontWeight: "600" },
  moduloTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textoGris: { color: colors.gray },
  moduloDescripcion: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  actividadesTexto: { fontSize: fonts.sizes.xs, color: colors.textSecondary },
  porcentajeTexto: { fontSize: fonts.sizes.xs, color: colors.textSecondary },
  barraFondo: {
    height: 6,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  barraRelleno: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  accionIcono: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
  },
});
