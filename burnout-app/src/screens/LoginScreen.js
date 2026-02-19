LoginScreen;
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Button, Input } from "../components";
import { colors, fonts, spacing } from "../utils/theme";

export default function LoginScreen({ navigation }) {
  // Estados del formulario
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errores, setErrores] = useState({});

  // Hook de autenticación
  const { login, cargando } = useAuth();

  //validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar correo
    if (!correo.trim()) {
      nuevosErrores.correo = "El correo es requerido";
    } else if (!/\S+@\S+\.\S+/.test(correo)) {
      nuevosErrores.correo = "Ingresa un correo válido";
    }

    // Validar contraseña
    if (!contrasena) {
      nuevosErrores.contrasena = "La contraseña es requerida";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejar login
  const handleLogin = async () => {
    if (!validarFormulario()) return;

    const resultado = await login(correo.trim().toLowerCase(), contrasena);

    if (!resultado.success) {
      Alert.alert("Error", resultado.error || "No se pudo iniciar sesión");
    }
    // Si es exitoso, el AuthContext redirigirá automáticamente
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo y título */}
          {/* Logo y título */}
          <View style={styles.header}>
            <Image
              source={require("../assets/panda-meditando.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>BurnOut App</Text>
            <Text style={styles.subtitle}>
              Tu bienestar es nuestra prioridad
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Input
              label="Correo electrónico"
              placeholder="tu@correo.com"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              error={errores.correo}
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
              icon="lock-closed-outline"
              error={errores.contrasena}
            />

            {/* Olvidé mi contraseña */}
            <TouchableOpacity
              onPress={() => navigation.navigate("RecuperarPassword")}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            {/* Botón de login */}
            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={cargando}
              style={styles.loginButton}
            />
          </View>

          {/* Registro */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Registro")}>
              <Text style={styles.registerLink}> Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.md,
    resizeMode: "contain",
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
  },
  form: {
    marginBottom: spacing.xl,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: fonts.sizes.sm,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.md,
  },
  registerLink: {
    color: colors.primary,
    fontSize: fonts.sizes.md,
    fontWeight: "600",
  },
});
