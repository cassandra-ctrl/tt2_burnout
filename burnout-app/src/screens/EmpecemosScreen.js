// ============================================================================
// PANTALLA ¡EMPECEMOS!
// src/screens/EmpecemosScreen.js
// ============================================================================

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Button, Mascota } from "../components";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";

export default function EmpecemosScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();

  // Primer nombre del usuario (si tiene varios)
  const primerNombre = usuario?.nombre?.split(" ")[0] || "";

  // ---------------------------------------------------------------------------
  // Comenzar - Ir al Home
  // ---------------------------------------------------------------------------
  const handleComenzar = async () => {
    try {
      await actualizarUsuario();
    } catch (error) {
      console.log("Error actualizando usuario:", error);
    }

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

        {/* Contenido principal */}
        <View style={styles.contenido}>
          {/* Mascota saludando */}
          <View style={styles.mascotaContainer}>
            <Mascota tipo="saludando" tamano="xl" />
          </View>

          {/* Saludo personalizado */}
          <Text style={styles.saludo}>
            {primerNombre ? `¡Hola, ${primerNombre}!` : "¡Hola!"}
          </Text>

          {/* Mensaje de bienvenida */}
          <Text style={styles.mensajeBienvenida}>
            Estoy aquí para acompañarte en este camino. Vamos juntos, paso a paso.
          </Text>

          {/* Tarjeta con qué hacer ahora */}
          <View style={styles.tarjetaInfo}>
            <Text style={styles.tarjetaTitulo}>¿Qué sigue?</Text>
            <View style={styles.pasoItem}>
              <Text style={styles.pasoNumero}>1</Text>
              <Text style={styles.pasoTexto}>
                Explora los módulos del programa
              </Text>
            </View>
            <View style={styles.pasoItem}>
              <Text style={styles.pasoNumero}>2</Text>
              <Text style={styles.pasoTexto}>
                Completa actividades a tu ritmo
              </Text>
            </View>
            <View style={styles.pasoItem}>
              <Text style={styles.pasoNumero}>3</Text>
              <Text style={styles.pasoTexto}>
                Refleja en tu diario cuando lo necesites
              </Text>
            </View>
          </View>

          {/* Mensaje final */}
          <Text style={styles.mensajeFinal}>
            ¿Listo para empezar?
          </Text>
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
  mascotaContainer: {
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  saludo: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  mensajeBienvenida: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  tarjetaInfo: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    width: "100%",
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tarjetaTitulo: {
    fontSize: fonts.sizes.lg,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  pasoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  pasoNumero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E3A5F",
    color: colors.white,
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 32,
  },
  pasoTexto: {
    flex: 1,
    fontSize: fonts.sizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  mensajeFinal: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
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