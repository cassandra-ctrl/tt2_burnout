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

  // Hook de autenticación
  const { register, cargando } = useAuth();

  //Validamos los datos del formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    //Validar nombre
    if (!nombre.trim()) {
      nuevosErrores.nombre = "Ingresa tu nombre";
    }

    //Validar paterno
    if (!paterno.trim()) {
      nuevosErrores.paterno = "Ingresa tu apellido paterno";
    }

    //Validar materno
    if (!materno.trim()) {
      nuevosErrores.nombre = "Ingresa tu apellido materno";
    }

    // Validar correo
    if (!correo.trim()) {
      nuevosErrores.correo = "Ingresa un correo";
    } else if (!/\S+@\S+\.\S+/.test(correo)) {
      nuevosErrores.correo = "Ingresa un correo válido";
    }

    // Validar matrícula
    if (!matricula.trim()) {
      nuevosErrores.matricula = "Matrícula es requerida";
    } else if (matricula.length < 10) {
      nuevosErrores.matricula = "La matrícula debe tener 10 caracteres";
    }

    // Validar contraseña
    if (!contrasena) {
      nuevosErrores.contrasena = "La contraseña es requerida";
    } else if (contrasena.length < 8) {
      nuevosErrores.contrasena =
        "La contraseña debe tener al menos 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(contrasena)) {
      nuevosErrores.contrasena = "Debe incluir mayúscula, minúscula y número";
    }

    // Validar confirmar contraseña
    if (!confirmarContrasena) {
      nuevosErrores.confirmarContrasena = "Confirma tu contraseña";
    } else if (contrasena !== confirmarContrasena) {
      nuevosErrores.confirmarContrasena = "Las contraseñas no coinciden";
    }
  };

  setErrores(nuevosErrores);
  return Object.keys(nuevosErrores).length === 0;
}

//Registro
const handleRegistro = async () => {
  if (!validarFormulario()) return;

  const datos = {
    nombre: nombre.trim(),
    paterno: paterno.trim(),
    materno: materno.trim(),
    correo: correo.trim().toLowerCase(),
    matricula: matricula.trim(),
    contrasena,
  };

  const resultado = await registrar(datos);

  if (!resultado.success) {
    Alert.error(
      "Error",
      resultado.error ||
        "No fue posible crear la cuenta, favor de intentarlo mas tarde",
    );
  }

  //si es exitoso, redirige automaticamente
};

//SafeAreaView: evita que el formulario se solape
return (
  <SafeAreaView style={styles.container}>
    {/* //keyboardView: hace que se acomode la pantalla cuando usamos el teclaso */}
    <KeyboardAvoidingView
      behavior={Platform.OS === "android" ? "padding" : "height"}
      style={styles.KeyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* {Header} */}
        <View style={styles.header}>
          <Text style={styles.title}>Registrarse</Text>
          <Text style={styles.subtitle}>Crea un cuenta</Text>
        </View>

        {/* Formulario */}
        <View stye={styles.form}>
          {/* nOMBRE */}
          <Input
            label="Nombre"
            placeholder={"Nombre"}
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            icon="person-outline"
            error={errores.nombre}
          />

          {/* apellido paterno */}
          <Input
            label="Apellido paterno"
            placeholder={"Paterno"}
            value={paterno}
            onChangeText={setPaterno}
            autoCapitalize="words"
            error={errores.paterno}
          />

          {/* apellido materno*/}
          <Input
            label="Apellido materno"
            placeholder={"Materno"}
            value={materno}
            onChangeText={setMaterno}
            autoCapitalize="words"
            error={errores.materno}
          />

          {/* correo*/}
          <Input
            label="Correo electrónico"
            placeholder={"ejemplo@correo.com"}
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errores.correo}
          />

          {/*matricula*/}
          <Input
            label="Matrícula"
            placeholder={"Matrícula"}
            value={matricula}
            onChangeText={setMatricula}
            autoCapitalize="none"
            error={errores.matricula}
          />

          {/*contrasena*/}
          <Input
            label="Contraseña"
            placeholder={"8 caracteres"}
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            icon="lock-closed-outline"
            error={errores.contrasena}
          />

          {/*confirmar contrasena*/}
          <Input
            label="Contraseña"
            placeholder={"8 caracteres"}
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            icon="lock-closed-outline"
            error={errores.contrasena}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
