// PANTALLA RECUPERAR CONTRASEÑA - PASO 1: INGRESAR CORREO

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

export default function RecuperarPasswordScreen({ navigation }) {
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  //VALIDAMOS EL CORREO
  const validarCorreo = () => {
    //No ha introducido un correo
    if (!correo.trim()) {
      setError("El correo es requerido");
      return false;
    }
    // el formato no es valido
    if (!/\S+@\S+\.\S+/.test(correo)) {
      setError("Ingresa un correo válido");
      return false;
    }
    setError("");
    return true;
  };

  //ENVIAR CODIGO Y NAVEGAR A PESTANA DE INTROUCIR CODIGOD
  const handleEnviar = async () => {
    if (!validarCorreo()) return;

    try {
      setCargando(true);
      await recuperacionAPI.solicitarCodigo(correo.trim().toLowerCase());

      //Navega a la pantalla donde pide el codigo
      navigation.navigate("VerificarCodigo", {
        correo: correo.trim().toLowerCase(),
      });
    } catch (err) {
      Alert.alert(
        "Error",
        err.message ||
          "Hubo un error al enviar el código, favor de intentarlo más tarde",
      );
    } finally {
      setCargando(false);
    }
  };

  //RENDER
  return (
    //Manejo de pantalla
    // SafeAreaView evita que el contenido se superponga con el notch o la barra de estado del telefono
    //KeyboardAvoidingView evita que el teclado tape el campo del etxto cuando el usuario escribe
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Decoracion superior */}
          <View style={styles.decoracionSuperior}>
            <View style={styles.circuloGrande} />
          </View>

          {/* Contenido */}
          <View style={styles.contenido}>
            <Text style={styles.title}>Ayuda en la cuenta</Text>
            <Text style={styles.subtitle}>
              {" "}
              Introduzca su correo electrónico para recibir instrucciones para
              reestablecer su cuenta
            </Text>

            {/* Input Correo */}
            <View style={styles.inputContainer}>
              <Input
                placeholder={"ejemplo@correo.com"}
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={"mail-outline"}
                error={error}
              />
            </View>

            <Button
              title="Enviar"
              onPress={handleEnviar}
              loading={cargando}
              style={styles.botonEnviar}
            />

            {/* Regresar al login */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.regresarContainer}
            >
              <Text style={styles.regresarText}>
                Regresar al inicio de sesión
              </Text>
            </TouchableOpacity>
          </View>

          {/* Decoracion inferior */}
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
    backgroundColor: colors.background,
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
    top: -130,
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
    marginBottom: spacing.lg,
  },
  botonEnviar: {
    width: "60%",
    backgroundColor: colors.primary,
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
    bottom: -80,
    left: -20,
    width: 300,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
});
