// PANTALLA DE ACTIVIDAD
// src/screens/ActividadScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { progresoAPI, reflexionesAPI } from "../services/api";
import { Button } from "../components";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";

const AZUL = "#1E3A5F";

const TIPO_CONFIG = {
  1: { icono: "leaf",            color: "#4c956c", label: "Meditación"  },
  2: { icono: "create",          color: "#0992C2", label: "Ejercicio"   },
  3: { icono: "body",            color: "#f4a259", label: "Físico"      },
  4: { icono: "book",             color: "#957025", label: "Lectura"     },
  5: { icono: "play-circle",     color: "#c1121f", label: "Video"       },
  6: { icono: "headset",         color: "#576A8F", label: "Audio"       },
  7: { icono: "game-controller", color: "#757bc8", label: "Juego"       },
};

export default function ActividadScreen({ navigation, route }) {
  const { actividad, modulo } = route.params;

  const tipo = TIPO_CONFIG[actividad.id_tipo] || TIPO_CONFIG[2];
  const yaCompletada = actividad.estado === "completada";

  const [completando, setCompletando] = useState(false);
  const [completada, setCompletada] = useState(yaCompletada);
  const [mostrarReflexion, setMostrarReflexion] = useState(false);
  const [reflexion, setReflexion] = useState("");
  const [reflexionExistente, setReflexionExistente] = useState(null);
  const [guardandoReflexion, setGuardandoReflexion] = useState(false);

  useEffect(() => {
    cargarReflexion();
  }, []);

  const cargarReflexion = async () => {
    try {
      const data = await reflexionesAPI.getByActividad(actividad.id_actividad);
      if (data.reflexion) {
        setReflexionExistente(data.reflexion);
        setReflexion(data.reflexion.contenido);
      }
    } catch (error) {
      // No hay reflexión aún, es normal
    }
  };

  const handleCompletar = async () => {
    try {
      setCompletando(true);
      await progresoAPI.completarActividad(actividad.id_actividad);
      setCompletada(true);
      setMostrarReflexion(true);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo completar la actividad");
    } finally {
      setCompletando(false);
    }
  };

  const handleGuardarReflexion = async () => {
    if (!reflexion.trim()) {
      setMostrarReflexion(false);
      navigation.goBack();
      return;
    }

    try {
      setGuardandoReflexion(true);
      await reflexionesAPI.guardar(actividad.id_actividad, reflexion.trim());
      setMostrarReflexion(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la reflexión");
    } finally {
      setGuardandoReflexion(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.moduloNombre}>{modulo.titulo}</Text>
            <Text style={styles.headerTitulo}>{actividad.titulo}</Text>
          </View>

          <View style={styles.contenido}>
            {/* Chips de tipo y duración */}
            <View style={styles.chipsRow}>
              <View style={[styles.chip, { backgroundColor: tipo.color + "20" }]}>
                <Ionicons name={tipo.icono} size={14} color={tipo.color} />
                <Text style={[styles.chipTexto, { color: tipo.color }]}>{tipo.label}</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.chipTexto}>{actividad.duracion_minutos} min</Text>
              </View>
              {completada && (
                <View style={[styles.chip, { backgroundColor: colors.success + "20" }]}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={[styles.chipTexto, { color: colors.success }]}>Completada</Text>
                </View>
              )}
            </View>

            {/* Contenido de la actividad */}
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Descripción</Text>
              <Text style={styles.contenidoTexto}>{actividad.contenido}</Text>
            </View>

            {/* Reflexión existente (si ya completó antes) */}
            {reflexionExistente && !mostrarReflexion && (
              <View style={styles.card}>
                <View style={styles.reflexionHeader}>
                  <Text style={styles.cardTitulo}>Mi reflexión</Text>
                  <TouchableOpacity onPress={() => setMostrarReflexion(true)}>
                    <Ionicons name="create-outline" size={18} color={AZUL} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.reflexionTexto}>{reflexionExistente.contenido}</Text>
              </View>
            )}

            {/* Input de reflexión (al completar o editar) */}
            {mostrarReflexion && (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>
                  {reflexionExistente ? "Editar reflexión" : "¿Qué aprendiste?"}
                </Text>
                <Text style={styles.reflexionHint}>
                  Escribe una reflexión breve sobre esta actividad (opcional)
                </Text>
                <TextInput
                  style={styles.reflexionInput}
                  value={reflexion}
                  onChangeText={setReflexion}
                  placeholder="Escribe tu reflexión aquí..."
                  placeholderTextColor={colors.gray}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <View style={styles.reflexionBotones}>
                  <TouchableOpacity
                    style={styles.botonOmitir}
                    onPress={() => {
                      setMostrarReflexion(false);
                      if (completada && !reflexionExistente) navigation.goBack();
                    }}
                  >
                    <Text style={styles.botonOmitirTexto}>Omitir</Text>
                  </TouchableOpacity>
                  <Button
                    title="Guardar"
                    onPress={handleGuardarReflexion}
                    loading={guardandoReflexion}
                    style={styles.botonGuardar}
                  />
                </View>
              </View>
            )}

            {/* Botón completar */}
            {!completada && !mostrarReflexion && (
              <Button
                title="Marcar como completada"
                onPress={handleCompletar}
                loading={completando}
                style={styles.botonCompletar}
              />
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: { marginBottom: spacing.sm },
  moduloNombre: {
    fontSize: fonts.sizes.xs,
    color: colors.primaryLight,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitulo: {
    fontSize: fonts.sizes.xl,
    fontWeight: "bold",
    color: colors.white,
  },
  contenido: { padding: spacing.lg },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.grayLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  chipTexto: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitulo: {
    fontSize: fonts.sizes.sm,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  contenidoTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 22,
  },
  reflexionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  reflexionTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 22,
    fontStyle: "italic",
  },
  reflexionHint: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  reflexionInput: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.sizes.sm,
    color: colors.text,
    minHeight: 100,
    marginBottom: spacing.md,
  },
  reflexionBotones: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  botonOmitir: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  botonOmitirTexto: { fontSize: fonts.sizes.sm, color: colors.textSecondary },
  botonGuardar: { flex: 0, paddingHorizontal: spacing.lg, backgroundColor: AZUL },
  botonCompletar: { backgroundColor: AZUL, borderRadius: borderRadius.lg },
});
