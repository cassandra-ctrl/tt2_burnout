// ============================================================================
// COMPONENTE MODAL PERSONALIZADO (Cross-Platform)
// src/components/ModalAlert.js
// ============================================================================

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "../utils/theme";

const { width } = Dimensions.get("window");

export default function ModalAlert({
  visible,
  onClose,
  titulo,
  mensaje,
  tipo = "warning",
  textoBoton = "Entendido",
  onConfirm,
}) {
  const config = {
    success: { icon: "checkmark-circle", color: "#4CAF50", bgColor: "#E8F5E9" },
    error: { icon: "close-circle", color: "#F44336", bgColor: "#FFEBEE" },
    warning: { icon: "warning", color: "#FF9800", bgColor: "#FFF3E0" },
    info: { icon: "information-circle", color: "#2196F3", bgColor: "#E3F2FD" },
  };

  const { icon, color, bgColor } = config[tipo] || config.warning;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const contenidoModal = (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={50} color={color} />
        </View>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.mensaje}>{mensaje}</Text>
        <TouchableOpacity
          style={[styles.boton, { backgroundColor: color }]}
          onPress={handleConfirm}
        >
          <Text style={styles.botonTexto}>{textoBoton}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 1. COMPORTAMIENTO PARA LA WEB
  if (Platform.OS === "web") {
    // En la web sí podemos destruir el componente si no está visible
    if (!visible) return null;
    return contenidoModal;
  }

  // 2. COMPORTAMIENTO PARA MÓVIL (Android/iOS)
  // ¡Aquí NUNCA retornamos null! Dejamos que la propiedad nativa "visible" haga su trabajo.
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {contenidoModal}
    </Modal>
  );
}

// =============================================================================
// ESTILOS
// =============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    // Truco para Web
    ...(Platform.OS === "web" && {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: "100vh",
      width: "100vw",
      zIndex: 99999,
    }),
  },
  modalContainer: {
    width: Platform.OS === "web" ? 400 : width * 0.85,
    maxWidth: "90%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  titulo: {
    fontSize: fonts.sizes.xl,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  mensaje: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  boton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    borderRadius: 25,
  },
  botonTexto: {
    color: colors.white,
    fontSize: fonts.sizes.md,
    fontWeight: "600",
  },
});
