//card
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, borderRadius, spacing, commonStyles } from "../utils/theme";

export default function Card({ children, title, onPress, style }) {
  // es Onpress?  Entonces la variable Contenedor será igual al componente <TouchableOpacity>. Esto hace que la tarjeta reaccione al tacto y baje la opacidad.

  // Si es NO (: View): Entonces la variable Contenedor será igual al componente <View>. Esto hace que la tarjeta sea una simple caja estática que no hace nada si la tocas.
  const Contenedor = onPress ? TouchableOpacity : View;

  return (
    <Contenedor
      onPress={onPress}
      //       styles.card: Son tus estilos base (fondo blanco, sombras, bordes redondeados) que definiste abajo.

      // style: Son estilos extra que el padre pudo haber mandado (ej. backgroundColor: 'red').
      style={[styles.card, style]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {title && <Text style={styles.title}>{title}</Text>}
      {/* //children: "cae" todo lo que hayas puesto dentro de las etiquetas <Card> ... </Card> en el archivo padre. */}
      {children}
    </Contenedor>
  );
}

const styles = StyleSheet.create({
  card: {
    ...commonStyles.card,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
