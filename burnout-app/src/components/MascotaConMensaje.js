// src/components/MascotaConMensaje.js
// MASCOTA CON BURBUJA DE MENSAJE (estilo cómic)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Mascota from "./Mascota";
import { colors, spacing, borderRadius, fonts } from "../utils/theme";

/**
 * Componente MascotaConMensaje
 * Muestra al panda con una burbuja de diálogo a su lado.
 *
 * Props:
 * - tipo: tipo de mascota (saludando, celebrando, etc.)
 * - mensaje: texto a mostrar en la burbuja
 * - tamano: tamaño de la mascota (xs, sm, md, lg, xl)
 * - direccion: "horizontal" | "vertical" (default: "horizontal")
 *   - horizontal: panda a la izquierda, burbuja a la derecha
 *   - vertical: panda arriba, burbuja debajo
 * - style: estilos adicionales para el contenedor
 */
export default function MascotaConMensaje({
  tipo = "saludando",
  mensaje = "",
  tamano = "md",
  direccion = "horizontal",
  style,
}) {
  const esVertical = direccion === "vertical";

  return (
    <View
      style={[
        styles.contenedor,
        esVertical ? styles.contenedorVertical : styles.contenedorHorizontal,
        style,
      ]}
    >
      <Mascota tipo={tipo} tamano={tamano} />

      {mensaje ? (
        <View
          style={[
            styles.burbuja,
            esVertical ? styles.burbujaVertical : styles.burbujaHorizontal,
          ]}
        >
          {/* Punta de la burbuja */}
          <View
            style={[
              styles.punta,
              esVertical ? styles.puntaVertical : styles.puntaHorizontal,
            ]}
          />
          <Text style={styles.texto}>{mensaje}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: "center",
  },
  contenedorHorizontal: {
    flexDirection: "row",
    justifyContent: "center",
  },
  contenedorVertical: {
    flexDirection: "column",
    justifyContent: "center",
  },
  burbuja: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    flexShrink: 1,
    maxWidth: 250,
  },
  burbujaHorizontal: {
    marginLeft: spacing.md,
    flex: 1,
  },
  burbujaVertical: {
    marginTop: spacing.md,
    maxWidth: "85%",
  },
  punta: {
    position: "absolute",
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
  },
  puntaHorizontal: {
    // Punta apuntando a la izquierda (hacia el panda)
    left: -10,
    top: "50%",
    marginTop: -8,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: colors.primaryLight,
  },
  puntaVertical: {
    // Punta apuntando hacia arriba (hacia el panda)
    top: -10,
    left: "50%",
    marginLeft: -8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.primaryLight,
  },
  texto: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    lineHeight: 22,
  },
});