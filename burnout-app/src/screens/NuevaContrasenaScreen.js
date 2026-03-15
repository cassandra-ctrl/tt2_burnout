// ============================================================================
// PANTALLA RECUPERAR CONTRASEÑA - PASO 3: NUEVA CONTRASEÑA
// src/screens/NuevaContrasenaScreen.js
// ============================================================================

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { recuperacionAPI } from "../services/api";
import { Button, Input } from "../components";
import { colors, fonts, spacing } from "../utils/theme";

export default function NuevaContrasenaScreen({ navigation, route }) {
  const { correo, codigo } = route.params;
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});

  // ---------------------------------------------------------------------------
  // Validar formulario
  // ---------------------------------------------------------------------------
  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!contrasena) {
      nuevosErrores.contrasena = "La contraseña es requerida";
    } else if (contrasena.length < 8) {
      nuevosErrores.contrasena = "Mínimo 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(contrasena)) {
      nuevosErrores.contrasena = "Debe incluir mayúscula, minúscula y número";
    }

    if (!confirmarContrasena) {
      nuevosErrores.confirmarContrasena = "Confirma tu contraseña";
    } else if (contrasena !== confirmarContrasena) {
      nuevosErrores.confirmarContrasena = "Las contraseñas no coinciden";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Cambiar contraseña
  // ---------------------------------------------------------------------------
  const handleCambiar = async () => {
    if (!validarFormulario()) return;
    const resultado = await recuperacionAPI.cambiarContrasena(
      correo,
      codigo,
      contrasena,
      confirmarContrasena,
    );

    if (resultado.success) {
      Alert.alert(
        "¡Listo!",
        "Tu contraseña ha sido actualizada exitosamente.",
        [
          {
            text: "Iniciar sesión",
            onPress: () => navigation.navigate("Login"),
          },
        ],
      );
      // Para web, navegar directamente después de un delay
      setTimeout(() => {
        navigation.navigate("Login");
      }, 2000);
    }
    try {
      setCargando(true);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo cambiar la contraseña");
    } finally {
      setCargando(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Decoración superior */}
          <View style={styles.decoracionSuperior}>
            <View style={styles.circuloGrande} />
          </View>

          {/* Contenido */}
          <View style={styles.contenido}>
            <Text style={styles.title}>Nueva contraseña</Text>
            <Text style={styles.subtitle}>Ingresa tu nueva contraseña</Text>

            {/* Input contraseña */}
            <View style={styles.inputContainer}>
              <Input
                label="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry
                icon="lock-closed-outline"
                error={errores.contrasena}
              />

              <Input
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                value={confirmarContrasena}
                onChangeText={setConfirmarContrasena}
                secureTextEntry
                icon="lock-closed-outline"
                error={errores.confirmarContrasena}
              />
            </View>

            {/* Nota */}
            <Text style={styles.nota}>
              La contraseña debe incluir mayúscula, minúscula y número
            </Text>

            {/* Botón cambiar */}
            <Button
              title="Cambiar contraseña"
              onPress={handleCambiar}
              loading={cargando}
              style={styles.botonCambiar}
            />

            {/* Regresar */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.regresarContainer}
            >
              <Text style={styles.regresarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          {/* Decoración inferior */}
          <View style={styles.decoracionInferior}>
            <View style={styles.onda} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================================================================
// ESTILOS
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B8C4E9",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  decoracionSuperior: {
    height: 200,
    overflow: "hidden",
  },
  circuloGrande: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#1E2340",
  },
  contenido: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  inputContainer: {
    width: "100%",
    marginBottom: spacing.sm,
  },
  nota: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  botonCambiar: {
    width: "70%",
    backgroundColor: "#1E2340",
    borderRadius: 25,
    paddingVertical: 14,
  },
  regresarContainer: {
    marginTop: spacing.lg,
  },
  regresarText: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
  },
  decoracionInferior: {
    height: 150,
    overflow: "hidden",
  },
  onda: {
    position: "absolute",
    bottom: -50,
    left: -50,
    width: 300,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
});
