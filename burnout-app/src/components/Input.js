//Input
import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, fonts, spacing } from "../utils/theme";

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  icon,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  style,
}) {
  //Interactividad y calulos

  //Hooks de estado (memoria del componente)
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enfocado, setEnfocado] = useState(false);

  //Variables derivadas /logica simpl
  const esPassword = secureTextEntry;

  //JSX (HTML)
  return (
    <View style={[styles.container, style]}>
      {/* Si hay un label, ponerle el estilo adecuado */}
      {label && <Text style={styles.label}></Text>}

      <View
        style={[
          // Combina el estilo base con estilos que se activan según el estado
          styles.inputContainer,
          enfocado && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={enfocado ? colors.primary : colors.gray}
            style={styles.icon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            multiline && {
              height: numberOfLines * 24,
              textAlignVertical: "top",
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={esPassword && !mostrarPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
        />

        {esPassword && (
          <TouchableOpacity
            onPress={() => setMostrarPassword(!mostrarPassword)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={mostrarPassword ? "eye-off" : "eye"}
              size={20}
              color={colors.gray}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.grayLight,
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.grayLight,
  },
  icon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fonts.sizes.md,
    color: colors.text,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  errorText: {
    fontSize: fonts.sizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
