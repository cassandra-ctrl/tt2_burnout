// PANTALLA DE CIERRE DEL PROGRAMA
// src/screens/GraciasScreen.js

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";

const AZUL = "#1E3A5F";

export default function GraciasScreen({ navigation }) {
  const handleVolver = () => {
    navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Ilustración */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>🌟</Text>
        </View>

        {/* Título */}
        <Text style={styles.titulo}>¡Lo lograste!</Text>
        <Text style={styles.subtitulo}>Completaste el programa</Text>

        {/* Mensaje principal */}
        <View style={styles.card}>
          <Text style={styles.mensaje}>
            Terminar un proceso como este requiere valentía, constancia y mucho esfuerzo.
            Cada actividad que completaste fue un paso hacia una versión más equilibrada de ti.
          </Text>
        </View>

        {/* Recordatorios */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Recuerda llevar contigo:</Text>
          {[
            "🧰  Las herramientas que construiste",
            "🧭  Tu brújula de valores personales",
            "📔  El hábito de escribir en tu diario",
            "🌿  Los ejercicios de respiración",
            "💙  La compasión hacia ti mismo/a",
          ].map((item, i) => (
            <Text key={i} style={styles.recordatorioItem}>{item}</Text>
          ))}
        </View>

        {/* Mensaje de despedida */}
        <View style={[styles.card, styles.cardDestacada]}>
          <Text style={styles.despedida}>
            Tu psicólogo/a seguirá acompañándote. No estás solo/a en este camino.
          </Text>
        </View>

        <Button
          title="Volver al inicio"
          onPress={handleVolver}
          style={styles.boton}
        />

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F0F8",
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  emojiContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: AZUL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    fontSize: 60,
  },
  titulo: {
    fontSize: 34,
    fontWeight: "bold",
    color: AZUL,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitulo: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "100%",
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: AZUL,
    marginBottom: spacing.md,
  },
  mensaje: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    lineHeight: 26,
    textAlign: "center",
  },
  recordatorioItem: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 28,
  },
  cardDestacada: {
    backgroundColor: "#1E3A5F",
  },
  despedida: {
    fontSize: fonts.sizes.md,
    color: colors.white,
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
  boton: {
    width: "70%",
    backgroundColor: AZUL,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
});
