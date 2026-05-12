import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Mascota } from "../components";
import { colors, fonts, spacing } from "../utils/theme";

export default function ResultadoTestScreen({ navigation, route }) {
  const { resultado, tipo } = route.params;

  // Determinar color según nivel
  const getColorNivel = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case "bajo":
        return "#4A90D9"; // Azul suave
      case "medio":
        return "#7B68EE"; // Lavanda
      case "alto":
        return "#E8875A"; // Naranja suave
      default:
        return colors.primary;
    }
  };

  // Etiqueta amigable según nivel
  const getEtiquetaNivel = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case "bajo":  return "En equilibrio";
      case "medio": return "Área de atención";
      case "alto":  return "Requiere cuidado";
      default:      return nivel?.toUpperCase() || "---";
    }
  };

  // Tipo de mascota segun el nivel de burnout
  const getTipoMascota = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case "bajo":  return "celebrando";  // ¡Vas bien!
      case "medio": return "motivador";    // Vamos juntos
      case "alto":  return "empatico";     // No estas solo
      default:      return "saludando";
    }
  };

  // Mensaje según nivel
  const getMensajeNivel = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case "bajo":
        return "¡Vas muy bien! Te encuentras en equilibrio. Sigue cuidando tu bienestar con las actividades del programa.";
      case "medio":
        return "Hay algunas áreas que vale la pena atender. Las actividades del programa te ayudarán a sentirte mejor poco a poco.";
      case "alto":
        return "Este resultado indica que podrías estar pasando por un momento difícil. El programa está diseñado para acompañarte en este proceso, paso a paso.";
      default:
        return "Gracias por completar el test.";
    }
  };

  // Continuar al siguiente paso
  const handleContinuar = () => {
    if (tipo === "inicial") {
      navigation.navigate("Empecemos");
    } else {
      navigation.navigate("Gracias");
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

        {/* Mascota segun el nivel */}
        <View style={styles.mascotaContainer}>
          <Mascota
            tipo={getTipoMascota(resultado?.nivel_burnout)}
            tamano="lg"
          />
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
            {getEtiquetaNivel(resultado?.nivel_burnout)}
          </Text>
        </View>

        {/* Puntajes */}
        <View style={styles.puntajesContainer}>
          <View style={styles.puntajeItem}>
            <Text style={styles.puntajeLabel}>Agotamiento</Text>
            <Text style={styles.puntajeValor}>
              {resultado?.puntaje_agotamiento != null
                ? Number(resultado.puntaje_agotamiento).toFixed(2)
                : "0.00"}
            </Text>
          </View>
          <View style={styles.puntajeDivider} />
          <View style={styles.puntajeItem}>
            <Text style={styles.puntajeLabel}>Desvinculación</Text>
            <Text style={styles.puntajeValor}>
              {resultado?.puntaje_desvinculacion != null
                ? Number(resultado.puntaje_desvinculacion).toFixed(2)
                : "0.00"}
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
          title={tipo === "final" ? "Ver cierre del programa" : "Continuar"}
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
  mascotaContainer: {
    marginBottom: spacing.lg,
    alignItems: "center",
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
