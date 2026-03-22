// ============================================================================
// PANTALLA ¡EMPECEMOS!
// src/screens/EmpecemosScreen.js
// ============================================================================

import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components";
import { colors, fonts, spacing } from "../utils/theme";

export default function EmpecemosScreen({ navigation }) {
  const { actualizarUsuario } = useAuth();

  // ---------------------------------------------------------------------------
  // Comenzar - Ir al Home
  // ---------------------------------------------------------------------------
  const handleComenzar = async () => {
    try {
      // Actualizar datos del usuario (tutorial completado)
      await actualizarUsuario();
    } catch (error) {
      console.log("Error actualizando usuario:", error);
    }

    // Navegar al Home principal
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titulo}>¡Empecemos!</Text>
        </View>

        {/* Contenido */}
        <View style={styles.contenido}>
          {/* Imagen del panda - usar emoji si no hay imagen */}
          <View style={styles.imagenContainer}>
            <Text style={styles.emoji}>🐼</Text>
          </View>

          {/* Recursos */}
          <View style={styles.recursosContainer}>
            <Text style={styles.recursosTitulo}>Recursos de{"\n"}lectura</Text>
          </View>

          {/* Mensaje */}
          <Text style={styles.mensaje}>
            Estás listo para iniciar. Da clic en Comenzar y empieza el proceso.
          </Text>

          {/* Tarjeta de diario */}
          <View style={styles.tarjetaDiario}>
            <Text style={styles.diarioTitulo}>Diario de gratitud</Text>
          </View>
        </View>

        {/* Botón comenzar */}
        <View style={styles.footer}>
          <Button
            title="Comenzar"
            onPress={handleComenzar}
            style={styles.botonComenzar}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// ESTILOS
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F0F8",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#1E3A5F",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  contenido: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  imagenContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emoji: {
    fontSize: 80,
  },
  recursosContainer: {
    position: "absolute",
    top: 100,
    right: spacing.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recursosTitulo: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  mensaje: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    textAlign: "center",
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  tarjetaDiario: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diarioTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  botonComenzar: {
    width: "60%",
    backgroundColor: "#1E3A5F",
    borderRadius: 25,
  },
});
