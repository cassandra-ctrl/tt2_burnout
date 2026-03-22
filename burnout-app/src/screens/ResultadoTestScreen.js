import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components";
import { colors, fonts, spacing } from "../utils/theme";

export default function ResultadoTestScreen({ navigation, route }) {
  const { resultado, tipo } = route.params;

  // Determinar color según nivel
  const getColorNivel = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case "bajo":
        return "#4CAF50"; // Verde
      case "medio":
        return "#FF9800"; // Naranja
      case "alto":
        return "#F44336"; // Rojo
      default:
        return colors.primary;
    }
  };

  // Mensaje según nivel
  const getMensajeNivel = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case "bajo":
        return "¡Excelente! Tu nivel de burnout es bajo. Sigue cuidando tu bienestar.";
      case "medio":
        return "Tu nivel de burnout es moderado. Las actividades te ayudarán a mejorar.";
      case "alto":
        return "Tu nivel de burnout es alto. Es importante que sigas el tratamiento.";
      default:
        return "Gracias por completar el test.";
    }
  };

  // Continuar al siguiente paso
  const handleContinuar = () => {
    if (tipo === "inicial") {
      navigation.navigate("Empecemos");
    } else {
      navigation.navigate("MainTabs");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resultado del Test</Text>
      </View>

      {/* Contenido */}
      <View style={styles.contenido}>
        {/* Imagen */}
        <View style={styles.imagenContainer}>
          <Text style={styles.emoji}>📊</Text>
        </View>

        {/* Nivel de burnout */}
        <View
          style={[
            styles.nivelContainer,
            { backgroundColor: getColorNivel(resultado?.nivel_burnout) },
          ]}
        >
          <Text style={styles.nivelLabel}>Tu nivel de burnout es:</Text>
          <Text style={styles.nivelValor}>
            {resultado?.nivel_burnout?.toUpperCase() || "---"}
          </Text>
        </View>

        {/* Puntajes */}
        <View style={styles.puntajesContainer}>
          <View style={styles.puntajeItem}>
            <Text style={styles.puntajeLabel}>Agotamiento</Text>
            <Text style={styles.puntajeValor}>
              {resultado?.puntaje_agotamiento?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={styles.puntajeDivider} />
          <View style={styles.puntajeItem}>
            <Text style={styles.puntajeLabel}>Desvinculación</Text>
            <Text style={styles.puntajeValor}>
              {resultado?.puntaje_desvinculacion?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>

        {/* Mensaje */}
        <Text style={styles.mensaje}>
          {getMensajeNivel(resultado?.nivel_burnout)}
        </Text>

        {/* Nota informativa */}
        <View style={styles.notaContainer}>
          <Text style={styles.notaTexto}>
            Este resultado es solo una referencia inicial. Tu psicólogo te
            ayudará a entender mejor estos resultados.
          </Text>
        </View>
      </View>

      {/* Botón continuar */}
      <View style={styles.footer}>
        <Button
          title="Continuar"
          onPress={handleContinuar}
          style={styles.botonContinuar}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F0F8",
  },
  header: {
    backgroundColor: "#1E3A5F",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  contenido: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  imagenContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emoji: {
    fontSize: 50,
  },
  nivelContainer: {
    width: "80%",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  nivelLabel: {
    fontSize: fonts.sizes.md,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  nivelValor: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
  },
  puntajesContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    width: "90%",
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  puntajeItem: {
    flex: 1,
    alignItems: "center",
  },
  puntajeDivider: {
    width: 1,
    backgroundColor: colors.grayLight,
    marginHorizontal: spacing.md,
  },
  puntajeLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  puntajeValor: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  mensaje: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  notaContainer: {
    backgroundColor: "#FFF9C4",
    padding: spacing.md,
    borderRadius: 8,
    width: "90%",
  },
  notaTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  botonContinuar: {
    width: "60%",
    backgroundColor: "#1E3A5F",
    borderRadius: 25,
  },
});
