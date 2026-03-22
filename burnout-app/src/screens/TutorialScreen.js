// ============================================================================
// PANTALLA DE TUTORIAL / ONBOARDING
// src/screens/TutorialScreen.js
// ============================================================================

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components";
import { colors, fonts, spacing } from "../utils/theme";

const { width, height } = Dimensions.get("window");

// DATOS DE LAS SLIDES DEL TUTORIAL (con emojis en lugar de imágenes)
const slides = [
  {
    id: "1",
    titulo: "Bienvenido",
    descripcion:
      "Bienvenido a BurnOut App. Este espacio ha sido creado especialmente para apoyarte en tu proceso de bienestar y ayudarte a enfrentar el BurnOut.",
    emoji: "🐼",
  },
  {
    id: "2",
    titulo: "¿Cómo te ayudaremos?",
    descripcion:
      "Tendrás acceso a pruebas, actividades, meditaciones y un acompañamiento psicológico para ayudarte a sentirte mejor día con día.",
    emoji: "🧘",
  },
  {
    id: "3",
    titulo: "Tu progreso",
    descripcion:
      "Podrás seguir tu avance con gráficos, logros e insignias. Esto te motivará a continuar tu tratamiento y ver tu mejoría.",
    emoji: "🏆",
  },
  {
    id: "4",
    titulo: "Seguridad",
    descripcion:
      "Tu información está protegida y solo tú y tu psicólogo tendrán acceso a tu progreso. Este es un espacio seguro para ti.",
    emoji: "🔒",
  },
];

export default function TutorialScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const handleSiguiente = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      navigation.navigate("ConsentimientoInformado");
    }
  };

  const handleSaltar = () => {
    navigation.navigate("ConsentimientoInformado");
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.saltarBtn} onPress={handleSaltar}>
        <Text style={styles.saltarText}>×</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.slideTop}>
              <Text style={styles.slideTitulo}>{slide.titulo}</Text>
            </View>
            <View style={styles.slideBottom}>
              <View style={styles.emojiContainer}>
                <Text style={styles.emoji}>{slide.emoji}</Text>
              </View>
              <Text style={styles.slideDescripcion}>{slide.descripcion}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.indicadores}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicador,
                currentIndex === index && styles.indicadorActivo,
              ]}
            />
          ))}
        </View>
        <Button
          title={currentIndex === slides.length - 1 ? "Continuar" : "Siguiente"}
          onPress={handleSiguiente}
          style={styles.botonSiguiente}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  saltarBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  saltarText: { fontSize: 20, color: colors.text, fontWeight: "bold" },
  scrollView: { flex: 1 },
  slide: { width: width, flex: 1 },
  slideTop: {
    backgroundColor: "#1E3A5F",
    height: height * 0.25,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  slideTitulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  slideBottom: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  emojiContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#E8F0F8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emoji: { fontSize: 80 },
  slideDescripcion: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  indicadores: { flexDirection: "row", marginBottom: spacing.lg },
  indicador: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.grayLight,
    marginHorizontal: 4,
  },
  indicadorActivo: { backgroundColor: "#1E3A5F", width: 24 },
  botonSiguiente: {
    width: "50%",
    backgroundColor: "#1E3A5F",
    borderRadius: 20,
  },
});
