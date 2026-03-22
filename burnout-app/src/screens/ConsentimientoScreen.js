// Pantalla consentimiento informado
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { documentosAPI } from "../services/api";
import { Button, Loading } from "../components";
import { colors, fonts, spacing } from "../utils/theme";

import RenderHtml from "react-native-render-html";
import { useWindowDimensions } from "react-native";

export default function ConsentimientoScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { usuario } = useAuth();
  const [documento, setDocumento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [aceptando, setAceptando] = useState(false);

  //Cargar documento
  useEffect(() => {
    cargarDocumento();
  }, []);

  const cargarDocumento = async () => {
    try {
      setCargando(true);
      const data = await documentosAPI.getConsentimiento();
      setDocumento(data.documento);
    } catch (error) {
      console.error("Error cargando documento:", error);
      Alert.alert("Error", "No se pudo cargar el documento");
    } finally {
      setCargando(false);
    }
  };

  const handleAceptar = async () => {
    try {
      setAceptando(true);
      // Enviar el id_documento del documento cargado
      await documentosAPI.aceptar(documento.id_documento);
      navigation.navigate("AvisoPrivacidad");
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo aceptar el documento");
    } finally {
      setAceptando(false);
    }
  };

  //si no acepta el consentimiento informado, se redirije al paciente al login
  const handleCancelar = () => {
    Alert.alert(
      "¿Estás seguro?",
      "Si no aceptas el consentimiento informado, no podrás usar la aplicación.",
      [
        { text: "Continuar leyendo", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => navigation.navigate("Login"),
        },
      ],
    );
  };

  //RENDER
  if (cargando) {
    return <Loading message="Cargando documento..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header*/}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          {/* Flecha para volver hacia atras */}
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        {/* Titulo y estilos */}
        <Text style={styles.headerTitle}>Consentimiento{"\n"}informado</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.contenido} showsVerticalScrollIndicator={true}>
        {/* encontro el documento? */}
        {documento ? (
          <>
            {/* Índice */}
            <View style={styles.indice}>
              <Text style={styles.indiceItem}>1. Introducción y propósito</Text>
              <Text style={styles.indiceItem}>
                2. Descripción de la participación
              </Text>
              <Text style={styles.indiceItem}>3. Riesgos y beneficios</Text>
              <Text style={styles.indiceItem}>
                4. Confidencialidad y protección de datos
              </Text>
              <Text style={styles.indiceItem}>5. Voluntariedad y retiro</Text>
              <Text style={styles.indiceItem}>6. Limitaciones importantes</Text>
            </View>

            {/* Contenido */}
            <RenderHtml
              contentWidth={width - 48}
              source={{ html: documento.contenido }}
              tagsStyles={{
                h2: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
                h3: { fontSize: 16, fontWeight: "bold", marginVertical: 8 },
                p: { fontSize: 14, lineHeight: 22, marginVertical: 4 },
                li: { fontSize: 14, lineHeight: 22 },
                ul: { marginLeft: 10 },
                strong: { fontWeight: "bold" },
              }}
            />
          </>
        ) : (
          <Text style={styles.errorTexto}>
            No se pudo cargar el documento. Intenta de nuevo.
          </Text>
        )}
      </ScrollView>

      {/* Botones  de cancelar y aceptar*/}
      <View style={styles.footer}>
        <Button
          title="Cancelar"
          variant="outline"
          onPress={handleCancelar}
          style={styles.botonCancelar}
        />
        <Button
          title="Aceptar"
          onPress={handleAceptar}
          loading={aceptando}
          style={styles.botonAceptar}
        />
      </View>
    </SafeAreaView>
  );
}

// estilos

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  placeholder: {
    width: 32,
  },
  contenido: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  indice: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    marginVertical: spacing.md,
  },
  indiceItem: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textoDocumento: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  declaracion: {
    backgroundColor: "#E8F4FD",
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  declaracionTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  declaracionTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  errorTexto: {
    fontSize: fonts.sizes.md,
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    gap: spacing.md,
  },
  botonCancelar: {
    flex: 1,
    borderColor: "#1E3A5F",
  },
  botonAceptar: {
    flex: 1,
    backgroundColor: "#1E3A5F",
  },
});
