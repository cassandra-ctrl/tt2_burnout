// PANTALLA DE VERIFICACIÓN DE CORREO TRAS REGISTRO

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
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { Button, Input } from "../components";
import { colors, fonts, spacing } from "../utils/theme";

export default function VerificacionCorreoScreen({ navigation, route }) {
  const { correo } = route.params;
  const { loginConDatos } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const validarCodigo = () => {
    if (!codigo.trim()) {
      setError("El código es requerido");
      return false;
    }
    if (codigo.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return false;
    }
    setError("");
    return true;
  };

  const handleVerificar = async () => {
    if (!validarCodigo()) return;

    try {
      setCargando(true);
      const data = await authAPI.verificarCorreo(correo, codigo.trim());
      // Logueamos al usuario después de verificar
      loginConDatos(data.usuario || data.user);
    } catch (err) {
      setError(err.message || "Código inválido o expirado");
    } finally {
      setCargando(false);
    }
  };

  const handleReenviar = async () => {
    try {
      setCargando(true);
      await authAPI.reenviarCodigoVerificacion(correo);
      Alert.alert("Código enviado", "Se ha enviado un nuevo código a tu correo.");
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo reenviar el código");
    } finally {
      setCargando(false);
    }
  };

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
            <Text style={styles.title}>Verifica tu correo</Text>
            <Text style={styles.subtitle}>
              Te enviamos un código de 6 dígitos a:
            </Text>
            <Text style={styles.correoText}>{correo}</Text>

            <View style={styles.inputContainer}>
              <Input
                placeholder="000000"
                value={codigo}
                onChangeText={(val) => {
                  setCodigo(val);
                  setError("");
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={error}
              />
            </View>

            <Button
              title="Verificar"
              onPress={handleVerificar}
              loading={cargando}
              style={styles.botonVerificar}
            />

            <TouchableOpacity
              onPress={handleReenviar}
              style={styles.reenviarContainer}
              disabled={cargando}
            >
              <Text style={styles.reenviarText}>
                ¿No recibiste el código? Reenviar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.regresarContainer}
            >
              <Text style={styles.regresarText}>Regresar al login</Text>
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
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  correoText: {
    fontWeight: "bold",
    fontSize: fonts.sizes.md,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  botonVerificar: {
    width: "60%",
    backgroundColor: "#1E2340",
    borderRadius: 25,
    paddingVertical: 14,
  },
  reenviarContainer: {
    marginTop: spacing.lg,
  },
  reenviarText: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
  },
  regresarContainer: {
    marginTop: spacing.md,
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
