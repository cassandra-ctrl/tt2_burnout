// PANTALLA DE LOGROS
// src/screens/LogrosScreen.js

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
import { logrosAPI } from "../services/api";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";
import { Mascota } from "../components";

const AZUL = "#1E3A5F";

const CATEGORIAS = [
  { key: "Bronce",   label: "Bronce",   emoji: "🥉", color: "#CD7F32", bg: "#CD7F3218" },
  { key: "Plata",    label: "Plata",    emoji: "🥈", color: "#A0A0A0", bg: "#A0A0A018" },
  { key: "Oro",      label: "Oro",      emoji: "🥇", color: "#D4A017", bg: "#D4A01718" },
  { key: "Diamante", label: "Diamante", emoji: "💎", color: "#4FC3F7", bg: "#4FC3F718" },
];

function LogroCard({ logro, categoriaColor }) {
  const obtenido = logro.obtenido;

  return (
    <View style={[styles.logroCard, !obtenido && styles.logroCardBloqueado]}>
      {/* Emoji / insignia */}
      <View style={[styles.logroIconoWrap, obtenido && { borderColor: categoriaColor }]}>
        <Text style={styles.logroEmoji}>{logro.imagen || "🏅"}</Text>
        {!obtenido && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={20} color={colors.white} />
          </View>
        )}
      </View>

      <Text style={[styles.logroNombre, !obtenido && styles.textoLocked]}>
        {logro.nombre}
      </Text>
      <Text style={[styles.logroDesc, !obtenido && styles.textoLocked]} numberOfLines={2}>
        {logro.descripcion}
      </Text>

      {obtenido && logro.fecha_obtencion && (
        <Text style={[styles.logroFecha, { color: categoriaColor }]}>
          ✓ Obtenido
        </Text>
      )}
    </View>
  );
}

export default function LogrosScreen({ navigation }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarLogros = useCallback(async () => {
    try {
      const data = await logrosAPI.getAll();
      setDatos(data);
    } catch (error) {
      console.error("Error cargando logros:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarLogros();
  }, [cargarLogros]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarLogros();
  };

  // Tipo de mascota segun el progreso de logros
  const porcentajeLogros = datos?.porcentaje || 0;
  const obtenidos = datos?.obtenidos || 0;

  const tipoMascota = obtenidos === 0 ? "motivador" : "celebrando";
  const mensajeMotivacional = (() => {
    if (porcentajeLogros === 100) return "¡Eres una inspiración! Has completado todos los logros.";
    if (porcentajeLogros >= 75) return "¡Estás cerca de la meta! Sigue así.";
    if (porcentajeLogros >= 50) return "¡Vas excelente! Más de la mitad recorrida.";
    if (porcentajeLogros >= 25) return "¡Buen progreso! Cada logro cuenta.";
    if (obtenidos > 0) return "¡Tu primer logro es solo el comienzo!";
    return "Tu primer logro está más cerca de lo que crees.";
  })();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Mis logros</Text>
      </View>

      {cargando ? (
        <View style={styles.centrado}>
          <Text style={{ color: colors.textSecondary }}>Cargando...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={AZUL} />
          }
        >
          <View style={styles.contenido}>

            {/* Banner de progreso con mascota */}
            {datos && (
              <View style={styles.progresoBanner}>
                <View style={styles.progresoFila}>
                  <Mascota tipo={tipoMascota} tamano="sm" />
                  <View style={styles.progresoInfo}>
                    <Text style={styles.progresoNumero}>
                      {datos.obtenidos}
                      <Text style={styles.progresoTotal}>/{datos.total}</Text>
                    </Text>
                    <Text style={styles.progresoLabel}>logros desbloqueados</Text>
                  </View>
                </View>

                {/* Mensaje motivacional */}
                <Text style={styles.mensajeMotivacional}>{mensajeMotivacional}</Text>

                {/* Barra de progreso */}
                <View style={styles.barraFondo}>
                  <View style={[styles.barraRelleno, { width: `${datos.porcentaje}%` }]} />
                </View>
                <Text style={styles.porcentajeTexto}>{datos.porcentaje}% completado</Text>
              </View>
            )}

            {/* Alerta de logros nuevos */}
            {datos?.nuevos_logros?.length > 0 && (
              <View style={styles.nuevoBanner}>
                <Text style={styles.nuevoTexto}>
                  🎉 ¡Desbloqueaste {datos.nuevos_logros.length} logro{datos.nuevos_logros.length > 1 ? "s" : ""} nuevo{datos.nuevos_logros.length > 1 ? "s" : ""}!
                </Text>
              </View>
            )}

            {/* Secciones por categoría */}
            {CATEGORIAS.map((cat) => {
              const logros = datos?.logros_por_categoria?.[cat.key] || [];
              if (logros.length === 0) return null;

              return (
                <View key={cat.key} style={styles.seccion}>
                  {/* Encabezado de categoría */}
                  <View style={[styles.catHeader, { backgroundColor: cat.bg }]}>
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
                    <Text style={[styles.catConteo, { color: cat.color }]}>
                      {logros.filter((l) => l.obtenido).length}/{logros.length}
                    </Text>
                  </View>

                  {/* Grid 2 columnas */}
                  <View style={styles.grid}>
                    {logros.map((logro) => (
                      <LogroCard
                        key={logro.id_logro}
                        logro={logro}
                        categoriaColor={cat.color}
                      />
                    ))}
                    {/* Relleno si número impar */}
                    {logros.length % 2 !== 0 && <View style={styles.logroCardVacio} />}
                  </View>
                </View>
              );
            })}

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
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },

// Banner progreso
  progresoBanner: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "stretch",
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  progresoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  progresoInfo: {
    flex: 1,
    alignItems: "flex-start",
  },
  mensajeMotivacional: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  progresoNumero: {
    fontSize: 48,
    fontWeight: "bold",
    color: AZUL,
    lineHeight: 56,
  },
  progresoTotal: {
    fontSize: 28,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  progresoLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  barraFondo: {
    width: "100%",
    height: 8,
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  barraRelleno: {
    height: "100%",
    backgroundColor: AZUL,
    borderRadius: 4,
  },
  porcentajeTexto: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },

  // Banner logros nuevos
  nuevoBanner: {
    backgroundColor: "#FFF9C4",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: "#D4A017",
  },
  nuevoTexto: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: "#7B6000",
  },

  // Sección por categoría
  seccion: {
    marginBottom: spacing.lg,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  catEmoji: { fontSize: 20 },
  catLabel: {
    flex: 1,
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
  },
  catConteo: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  // Tarjeta de logro
  logroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  logroCardBloqueado: {
    backgroundColor: colors.grayLight + "80",
  },
  logroCardVacio: {
    flex: 1,
    minWidth: "45%",
  },
  logroIconoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.grayLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  logroEmoji: {
    fontSize: 36,
  },
  lockOverlay: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: colors.gray,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logroNombre: {
    fontSize: fonts.sizes.sm,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 2,
  },
  logroDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  textoLocked: {
    color: colors.gray,
  },
  logroFecha: {
    fontSize: fonts.sizes.xs,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
});
