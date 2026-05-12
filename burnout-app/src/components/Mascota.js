// src/components/Mascota.js
// COMPONENTE REUTILIZABLE PARA LA MASCOTA (PANDA)
import React from "react";
import { View, Image, StyleSheet } from "react-native";

// Mapa de tipos -> rutas de imagen
const SPRITES = {
  saludando: require("../../assets/panda/panda-saludando.png"),
  meditando: require("../../assets/panda/panda-meditando.png"),
  celebrando: require("../../assets/panda/panda-celebrando.png"),
  motivador: require("../../assets/panda/panda-motivador.png"),
  pensando: require("../../assets/panda/panda-pensando.png"),
  durmiendo: require("../../assets/panda/panda-durmiendo.png"),
  empatico: require("../../assets/panda/panda-empatico.png"),
  estudiando: require("../../assets/panda/panda-estudiando.png"),
};

// Tamanos predefinidos
const TAMANOS = {
  xs: 60,
  sm: 100,
  md: 150,
  lg: 200,
  xl: 280,
};

/**
 * Componente Mascota - muestra al panda en distintas poses
 * 
 * Props:
 * - tipo: "saludando" | "meditando" | "celebrando" | "motivador" | 
 *         "pensando" | "durmiendo" | "empatico" | "estudiando"
 * - tamano: "xs" | "sm" | "md" | "lg" | "xl" (default: "md")
 * - style: estilos adicionales para el contenedor
 */
export default function Mascota({ tipo = "saludando", tamano = "md", style }) {
  const sprite = SPRITES[tipo] || SPRITES.saludando;
  const size = TAMANOS[tamano] || TAMANOS.md;

return (
    <View style={[styles.contenedor, style]}>
      <View
        style={[
          styles.imagenContenedor,
          {
            width: size,
            height: size,
            borderRadius: size / 2, // Circular
          },
        ]}
      >
        <Image
          source={sprite}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagenContenedor: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(184, 193, 236, 0.25)", // primaryLight semi-transparente
  },
});