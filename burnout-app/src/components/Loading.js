//Loading
import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../utils/theme";

export default function Loading({
  message = "Cargando...",
  fullScreen = true,
}) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.primary} />
      {message && <Text style={styles.messageSmall}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  message: {
    marginTop: 16,
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
  },
  messageSmall: {
    marginLeft: 8,
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
});
