// PANTALLA DE REGISTRO
// src/screens/RegisterScreen.js

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
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Button, Input } from "../components";
import { colors, fonts, spacing } from "../utils/theme";

export default function RegisterScreen({ navigation }) {
  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [paterno, setPaterno] = useState("");
  const [materno, setMaterno] = useState("");
  const [correo, setCorreo] = useState("");
  const [matricula, setMatricula] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [errores, setErrores] = useState({});
  const [errorBackend, setErrorBackend] = useState("");

  // Hook de autenticación
  const { register, cargando } = useAuth();

  // Validar formulario

  const validarFormulario = () => {
    const nuevosErrores = {};
    setErrorBackend("");
    // Validar nombre
    if (!nombre.trim()) {
      nuevosErrores.nombre = "El nombre es requerido";
    }

    // Validar apellido paterno
    if (!paterno.trim()) {
      nuevosErrores.paterno = "El apellido paterno es requerido";
    }

    // Validar correo
    if (!correo.trim()) {
      nuevosErrores.correo = "El correo es requerido";
    } else if (!/\S+@\S+\.\S+/.test(correo)) {
      nuevosErrores.correo = "Ingresa un correo válido";
    }

    // Validar matrícula
    if (!matricula.trim()) {
      nuevosErrores.matricula = "La matrícula es requerida";
    } else if (matricula.length != 10) {
      nuevosErrores.matricula = "La matrícula debe tener 10 dígitos";
    }

    // Validar contraseña
    if (!contrasena) {
      nuevosErrores.contrasena = "La contraseña es requerida";
    } else if (contrasena.length < 8) {
      nuevosErrores.contrasena =
        "La contraseña debe tener al menos 8 caracteres";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*?])/.test(contrasena)
    ) {
      nuevosErrores.contrasena =
        "Debe incluir al menos unas mayúscula, una minúscula, un número y un símbolo";
    }

    // Validar confirmar contraseña
    if (!confirmarContrasena) {
      nuevosErrores.confirmarContrasena = "Confirma tu contraseña";
    } else if (contrasena !== confirmarContrasena) {
      nuevosErrores.confirmarContrasena = "Las contraseñas no coinciden";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  //manejar registro
  const handleRegistro = async () => {
    if (!validarFormulario()) return;

    Keyboard.dismiss(); // Ocultamos el teclado por comodidad
    setErrorBackend(""); // Limpiamos errores previos

    const datos = {
      nombre: nombre.trim(),
      paterno: paterno.trim(),
      materno: materno.trim(),
      correo: correo.trim().toLowerCase(),
      matricula: matricula.trim(),
      contrasena,
    };

    const resultado = await register(datos);

    if (resultado.success) {
      // Como tu AuthContext redirige automáticamente,
      // solo ponemos una alerta nativa sencilla por si acaso.
      if (Platform.OS === "web") {
        window.alert("¡Registro exitoso!");
      } else {
        Alert.alert("Éxito", "Tu cuenta ha sido creada correctamente.");
      }
    } else {
      // AQUÍ GUARDAMOS EL ERROR PARA MOSTRARLO EN EL FORMULARIO
      setErrorBackend(resultado.error || "No se pudo crear la cuenta.");
    }
  };

  // Render

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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Registrarse</Text>
            <Text style={styles.subtitle}>Crea una cuenta</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Nombre */}
            <Input
              label="Nombre(s)"
              placeholder="Tu nombre"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              icon="person-outline"
              error={errores.nombre}
            />

            {/* Apellidos en fila */}

            <Input
              label="Apellido Paterno"
              placeholder="Paterno"
              value={paterno}
              onChangeText={setPaterno}
              autoCapitalize="words"
              error={errores.paterno}
            />

            <Input
              label="Apellido Materno"
              placeholder="Materno"
              value={materno}
              onChangeText={setMaterno}
              autoCapitalize="words"
            />

            {/* Correo */}
            <Input
              label="Correo electrónico"
              placeholder="ejemplo@correo.com"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              error={errores.correo}
            />

            {/* Matrícula */}
            <Input
              label="Matrícula"
              placeholder="Matrícula escolar"
              value={matricula}
              onChangeText={setMatricula}
              autoCapitalize="none"
              icon="card-outline"
              error={errores.matricula}
            />

            {/* Contraseña */}
            <Input
              label="Contraseña"
              placeholder="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry
              icon="lock-closed-outline"
              error={errores.contrasena}
            />

            {/* Confirmar Contraseña */}
            <Input
              label="Confirmar Contraseña"
              placeholder="Repite tu contraseña"
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
              secureTextEntry
              icon="lock-closed-outline"
              error={errores.confirmarContrasena}
            />

            {/* Nota sobre contraseña */}
            <Text style={styles.passwordHint}>
              La contraseña debe incluir mayúscula, minúscula y número
            </Text>

            {errorBackend ? (
              <View style={styles.errorBackendContainer}>
                <Text style={styles.errorBackendText}>{errorBackend}</Text>
              </View>
            ) : null}

            {/* Botón de registro */}
            <Button
              title="Crear Cuenta"
              onPress={handleRegistro}
              loading={cargando}
              style={styles.registerButton}
            />
          </View>

          {/* Footer - Ya tengo cuenta */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}> Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ESTILOS

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
    padding: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  form: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  passwordHint: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.md,
  },
  loginLink: {
    color: colors.primary,
    fontSize: fonts.sizes.md,
    fontWeight: "600",
  },
  errorBackendContainer: {
    backgroundColor: "#FFEBEE",
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorBackendText: {
    color: "#F44336",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: fonts.sizes.sm,
  },
});
