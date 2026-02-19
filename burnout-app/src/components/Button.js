//button
// COMPONENTE BUTTON

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors, borderRadius, fonts } from "../utils/theme";

export default function Button({
  title,
  onPress,
  variant = "primary", // primary, secondary, outline, danger
  size = "md", // sm, md, lg
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  //define el fondo para cada boton
  const getBackgroundColor = () => {
    if (disabled) return colors.grayLight;

    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.secondary;
      case "danger":
        return colors.error;
      // transparente (solo el borden)
      case "outline":
        return "transparent";
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.gray;

    switch (variant) {
      case "outline":
        //define el color del texto (fondo transparente)
        return colors.primary;
      default:
        return colors.white;
    }
  };

  const getPadding = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case "lg":
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return fonts.sizes.sm;
      case "lg":
        return fonts.sizes.lg;
      default:
        return fonts.sizes.md;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      //bloquea el boton mientras hace una funcion
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === "outline" ? colors.primary : "transparent",
          borderWidth: variant === "outline" ? 2 : 0,
        },
        getPadding(),
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: getFontSize() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontWeight: "600",
  },
});
