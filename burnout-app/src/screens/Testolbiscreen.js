import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { testAPI } from "../services/api";

import { colors, fonts, spacing } from "../utils/theme";
import { Button, Loading, ModalAlert } from "../components";

//Opciones de respuesta
const OPCIONES = [
  { valor: 1, color: "#357C3C" }, //se acuerdo
  { valor: 2, color: "#5D9C59" }, // algo de acuero
  { valor: 3, color: "#E64848" }, // algo en desacuedo
  { valor: 4, color: "#C21010" }, // en desacuedo
];

export default function TestOLBIScreen({ navigation, route }) {
  const tipoPrueba = route?.params?.tipo || "inicial";

  //se guardan las preguntas cuando se descargen del servidor
  const [preguntas, setPreguntas] = useState([]);
  //funciona como diccionario, id y valor
  const [respuestas, setRespuestas] = useState({});
  //cambia de estado true a false y viceversa
  const [cargando, setCargando] = useState(true);
  //inicia en false/ bloque ael boton de finalizar
  const [enviando, setEnviando] = useState(false);

  //para el mensaje bonito
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    titulo: "",
    mensaje: "",
    tipo: "warning",
  });

  //cargamos las preguntas
  useEffect(() => {
    cargarPreguntas();
  }, []);

  const cargarPreguntas = async () => {
    try {
      setCargando(true);

      //llamamos a la API
      const data = await testAPI.getPreguntas();
      //Establecemos las preguntas
      setPreguntas(data.preguntas || []);
    } catch (error) {
      console.error("Error caargando preguntas: ", error);
      Alert.alert("Error", "No se pudo cargar el Test OLBI");
    } finally {
      setCargando(false);
    }
  };

  //SELECCIONAR RESPUESTA
  const seleccionarRespuesta = (idPregunta, valor) => {
    //Guardamos cada pregunta con su  valor en un diccionaio
    setRespuestas((prev) => ({
      ...prev,
      [idPregunta]: valor,
    }));
  };

  //Validamos que se hayan respondido todas las preguntas y las enviamos
  const handleFinalizar = async () => {
    const preguntasSinResponder = preguntas.filter(
      (p) => !respuestas[p.id_pregunta],
    );

    if (preguntasSinResponder.length > 0) {
      setModalConfig({
        titulo: "¡Espera!",
        mensaje: `Tienes ${preguntasSinResponder.length} pregunta(s) sin responder. Por favor completa todas las preguntas antes de continuar.`,
        tipo: "warning",
      });
      setModalVisible(true);
      return;
    }

    try {
      setEnviando(true);

      const respuestasFormateadas = Object.entries(respuestas).map(
        ([id_pregunta, respuesta]) => ({
          id_pregunta: parseInt(id_pregunta),
          respuesta,
        }),
      );

      const resultado = await testAPI.responder(
        tipoPrueba,
        respuestasFormateadas,
      );

      navigation.navigate("ResultadoTest", {
        resultado: resultado.resultado,
        tipo: tipoPrueba,
      });
    } catch (error) {
      setModalConfig({
        titulo: "Error",
        mensaje: error.message || "No se pudo enviar el test",
        tipo: "error",
      });
      setModalVisible(true);
    } finally {
      setEnviando(false);
    }
  };
  //RENDER
  if (cargando) {
    return <Loading message="Cargando Test OLBI inicial... "></Loading>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header (BOTON Y TITULO) */}
      <View style={styles.header}>
        <TouchableOpacity
          // estilos al presionar el boton
          style={styles.backButton}
          //regresa a la slide anterior
          onPress={() => navigation.goBack()}
        >
          {/* ponemos el icono, establecemos el tamano y el color */}
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Test {tipoPrueba === "inicial" ? "Inicial" : "Final"} de Burnout
        </Text>
      </View>

      {/* PREGUNTAS */}
      <ScrollView
        style={styles.contenido}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ESTABLECEMOS LAS PREGUNTAS */}
        {preguntas.map((pregunta, index) => (
          // identificamos el numero de pregunta y establecemos su estilo dentro de un contenedor
          <View key={pregunta.id_pregunta} style={styles.preguntaContainer}>
            {/* numero de pregunta */}
            <Text style={styles.preguntaNumero}>Pregunta {index + 1}</Text>
            {/* texto de Pregunta */}
            <Text style={styles.preguntaTexto}>{pregunta.pregunta}</Text>
            {/* etiquetas */}
            <View style={styles.etiquetasContainer}>
              <Text style={styles.etiqueta}>De acuerdo</Text>
              <Text style={styles.etiqueta}>En desacuerdo</Text>
            </View>

            {/* OPCIONES DE RESPUESTA (CIRCULOS) */}
            <View style={styles.opcionesContainer}>
              {OPCIONES.map((opcion) => (
                //al presionar
                <TouchableOpacity
                  key={opcion.valor}
                  style={[
                    styles.opcionCirculo,
                    { borderColor: opcion.color },
                    respuestas[pregunta.id_pregunta] === opcion.valor &&
                      styles.opcionSeleccionada,
                    respuestas[pregunta.id_pregunta] === opcion.valor && {
                      backgroundColor: opcion.color,
                    },
                  ]}
                  onPress={() =>
                    seleccionarRespuesta(pregunta.id_pregunta, opcion.valor)
                  }
                />
              ))}
            </View>
          </View>
        ))}
        {/* Espaciado para el botón */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón finalizar */}
      <View style={styles.footer}>
        <Button
          title="Finalizar"
          onPress={handleFinalizar}
          loading={enviando}
          style={styles.botonFinalizar}
        />
      </View>

      <ModalAlert
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        titulo={modalConfig.titulo}
        mensaje={modalConfig.mensaje}
        tipo={modalConfig.tipo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B8C4E9", // Fondo lavanda del mockup
  },
  header: {
    backgroundColor: "#1E3A5F",
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  contenido: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingTop: spacing.lg,
  },
  preguntaContainer: {
    marginBottom: spacing.xl,
  },
  preguntaNumero: {
    fontSize: fonts.sizes.sm,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  preguntaTexto: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  etiquetasContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  etiqueta: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
  },
  opcionesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.md,
  },
  opcionCirculo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    backgroundColor: "#E0E0E0",
  },
  opcionSeleccionada: {
    borderWidth: 3,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  botonFinalizar: {
    width: "50%",
    backgroundColor: "#1E3A5F",
    borderRadius: 25,
  },
});
