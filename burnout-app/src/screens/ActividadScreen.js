// PANTALLA DE ACTIVIDAD
// src/screens/ActividadScreen.js

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";
import { progresoAPI, reflexionesAPI } from "../services/api";
import { Button } from "../components";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";
import { useNetwork } from "../context/NetworkContext";
import { agregarCola, estaConectado } from "../utils/offline";
import OfflineBanner from "../components/OfflineBanner";

function esUrlWeb(texto) {
  if (!texto || typeof texto !== "string") return false;
  return texto.startsWith("http://") || texto.startsWith("https://");
}

function parsearCuestionario(texto) {
  try {
    const obj = JSON.parse(texto);
    if (obj?.tipo === "cuestionario_sintomas") return obj;
    return null;
  } catch (_) {
    return null;
  }
}

function parsearDistorsiones(texto) {
  try {
    const obj = JSON.parse(texto);
    if (obj?.tipo === "cuestionario_distorsiones") return obj;
    return null;
  } catch (_) {
    return null;
  }
}

function parsearJournaling(texto) {
  try {
    const obj = JSON.parse(texto);
    if (obj?.tipo === "journaling") return obj;
    return null;
  } catch (_) {
    return null;
  }
}

function parsearFormularioPlan(texto) {
  try {
    const obj = JSON.parse(texto);
    if (obj?.tipo === "formulario_plan") return obj;
    return null;
  } catch (_) {
    return null;
  }
}

function parsearListaReflexion(texto) {
  try {
    const obj = JSON.parse(texto);
    if (obj?.tipo === "lista_reflexion") return obj;
    return null;
  } catch (_) {
    return null;
  }
}

function parsearCajaHerramientas(texto) {
  try {
    const obj = JSON.parse(texto);
    if (obj?.tipo === "caja_herramientas") return obj;
    return null;
  } catch (_) {
    return null;
  }
}

const ESCALA = [
  { valor: 0, label: "Nunca" },
  { valor: 1, label: "Pocas veces" },
  { valor: 2, label: "Frecuentemente" },
  { valor: 3, label: "Siempre" },
];

const DIM_COLORES = {
  agotamiento:      "#4A90D9",
  despersonalizacion: "#7B68EE",
  realizacion:      "#E8875A",
};

const DIM_NIVELES = [
  { max: 30,  label: "En equilibrio",    fondo: "#EAF4FF" },
  { max: 60,  label: "Área de atención", fondo: "#F3F0FF" },
  { max: 100, label: "Requiere cuidado", fondo: "#FFF3EE" },
];

function nivelDimension(porcentaje) {
  return DIM_NIVELES.find((n) => porcentaje <= n.max) || DIM_NIVELES[2];
}

// Extrae el video ID de cualquier formato de URL de YouTube
function extraerVideoId(url) {
  if (!url || typeof url !== "string") return null;
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const re of regexes) {
    const match = url.match(re);
    if (match) return match[1];
  }
  return null;
}

const AZUL = "#1E3A5F";

const TIPO_CONFIG = {
  1: { icono: "leaf",            color: "#4c956c", label: "Meditación"  },
  2: { icono: "create",          color: "#0992C2", label: "Ejercicio"   },
  3: { icono: "body",            color: "#f4a259", label: "Físico"      },
  4: { icono: "book",             color: "#957025", label: "Lectura"     },
  5: { icono: "play-circle",     color: "#c1121f", label: "Video"       },
  6: { icono: "headset",         color: "#576A8F", label: "Audio"       },
  7: { icono: "game-controller", color: "#757bc8", label: "Juego"       },
};

export default function ActividadScreen({ navigation, route }) {
  const { actividad, modulo } = route.params;
  const { width } = useWindowDimensions();

  const tipo = TIPO_CONFIG[actividad.id_tipo] || TIPO_CONFIG[2];
  const yaCompletada = actividad.estado === "completada";
  const videoId = extraerVideoId(actividad.contenido);
  const esLectura = !videoId && esUrlWeb(actividad.contenido);
  const cuestionario = !videoId && !esLectura ? parsearCuestionario(actividad.contenido) : null;
  const distorsiones = !videoId && !esLectura && !cuestionario ? parsearDistorsiones(actividad.contenido) : null;
  const journaling       = !videoId && !esLectura && !cuestionario && !distorsiones ? parsearJournaling(actividad.contenido) : null;
  const formularioPlan   = !videoId && !esLectura && !cuestionario && !distorsiones && !journaling ? parsearFormularioPlan(actividad.contenido) : null;
  const listaReflexion   = !videoId && !esLectura && !cuestionario && !distorsiones && !journaling && !formularioPlan ? parsearListaReflexion(actividad.contenido) : null;
  const cajaHerramientas = !videoId && !esLectura && !cuestionario && !distorsiones && !journaling && !formularioPlan && !listaReflexion ? parsearCajaHerramientas(actividad.contenido) : null;

  // Estado del cuestionario de síntomas
  const [respuestas, setRespuestas] = useState({});
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // Estado del quiz de distorsiones
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [quizTerminado, setQuizTerminado] = useState(false);

  const calcularResultados = () => {
    if (!cuestionario) return [];
    return cuestionario.dimensiones.map((dim) => {
      const max = dim.preguntas.length * 3;
      const suma = dim.preguntas.reduce((acc, p) => acc + (respuestas[p.id] ?? 0), 0);
      const porcentaje = Math.round((suma / max) * 100);
      return { ...dim, porcentaje, nivel: nivelDimension(porcentaje) };
    });
  };

  const handleSeleccionarOpcion = (idx) => {
    if (mostrarFeedback) return;
    const pregunta = distorsiones.preguntas[preguntaActual];
    const esCorrecta = idx === pregunta.correcta;
    setRespuestaSeleccionada(idx);
    setMostrarFeedback(true);
    if (esCorrecta) setAciertos((a) => a + 1);
  };

  const handleSiguientePregunta = () => {
    const total = distorsiones?.preguntas.length || 0;
    if (preguntaActual + 1 >= total) {
      setQuizTerminado(true);
    } else {
      setPreguntaActual((p) => p + 1);
      setRespuestaSeleccionada(null);
      setMostrarFeedback(false);
    }
  };

  const cuestionarioCompleto = cuestionario
    ? cuestionario.dimensiones.every((dim) =>
        dim.preguntas.every((p) => respuestas[p.id] !== undefined)
      )
    : false;

  const scrollViewRef = useRef(null);

  // Estado para formulario_plan
  const numPares = formularioPlan?.num_pares || 3;
  const [pares, setPares] = useState(() =>
    Array.from({ length: numPares }, () => ({ senal: "", accion: "" }))
  );
  const planCompleto = pares.every((p) => p.senal.trim() && p.accion.trim());

  const numItems = listaReflexion?.num_items || 5;
  const [items, setItems] = useState(() => Array.from({ length: numItems }, () => ""));
  const listaCompleta = items.every((it) => it.trim());

  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const minSeleccion = cajaHerramientas?.min_seleccion || 3;
  const cajaCompleta = seleccionadas.size >= minSeleccion;

  const toggleTecnica = (id) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const { isConnected, lastSyncAt, refrescarPendientes } = useNetwork();
  const [completando, setCompletando] = useState(false);
  const [completada, setCompletada] = useState(yaCompletada);
  const [mostrarReflexion, setMostrarReflexion] = useState(false);
  const [reflexion, setReflexion] = useState("");
  const [reflexionExistente, setReflexionExistente] = useState(null);
  const [guardandoReflexion, setGuardandoReflexion] = useState(false);

  useEffect(() => {
    cargarReflexion();
  }, []);

  useEffect(() => {
    if (lastSyncAt) cargarReflexion();
  }, [lastSyncAt]);

  const cargarReflexion = async () => {
    try {
      const data = await reflexionesAPI.getByActividad(actividad.id_actividad);
      if (data.reflexion) {
        setReflexionExistente(data.reflexion);
        setReflexion(data.reflexion.contenido);
      }
    } catch (error) {
      // No hay reflexión aún, es normal
    }
  };

  const handleCompletar = async () => {
    const conectado = await estaConectado();
    if (!conectado) {
      await agregarCola({
        type: "completar_actividad",
        payload: { id_actividad: actividad.id_actividad },
      });
      await refrescarPendientes();
      setCompletada(true);
      setMostrarReflexion(true);
      Alert.alert(
        "Sin conexión",
        "La actividad se marcará como completada cuando vuelvas a conectarte."
      );
      return;
    }
    try {
      setCompletando(true);
      await progresoAPI.completarActividad(actividad.id_actividad);
      setCompletada(true);
      setMostrarReflexion(true);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo completar la actividad");
    } finally {
      setCompletando(false);
    }
  };

  const handleGuardarReflexion = async () => {
    if (!reflexion.trim()) {
      setMostrarReflexion(false);
      navigation.goBack();
      return;
    }

    const conectado = await estaConectado();
    if (!conectado) {
      await agregarCola({
        type: "guardar_reflexion",
        payload: { id_actividad: actividad.id_actividad, contenido: reflexion.trim() },
      });
      await refrescarPendientes();
      setMostrarReflexion(false);
      navigation.goBack();
      return;
    }

    try {
      setGuardandoReflexion(true);
      await reflexionesAPI.guardar(actividad.id_actividad, reflexion.trim());
      setMostrarReflexion(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la reflexión");
    } finally {
      setGuardandoReflexion(false);
    }
  };

  const handleGuardarCaja = async () => {
    if (!cajaCompleta) {
      Alert.alert("Selecciona más técnicas", `Elige al menos ${minSeleccion} técnicas para tu caja de herramientas.`);
      return;
    }
    const elegidas = (cajaHerramientas?.tecnicas || []).filter((t) => seleccionadas.has(t.id));
    const contenido = "Mi caja de herramientas:\n\n" + elegidas.map((t) => `✓ ${t.nombre}`).join("\n");

    const conectado = await estaConectado();
    if (!conectado) {
      await agregarCola({ type: "completar_actividad", payload: { id_actividad: actividad.id_actividad } });
      await agregarCola({ type: "guardar_reflexion", payload: { id_actividad: actividad.id_actividad, contenido } });
      await refrescarPendientes();
      setCompletada(true);
      Alert.alert("Sin conexión", "Tu caja de herramientas se guardará cuando vuelvas a conectarte.");
      navigation.goBack();
      return;
    }
    try {
      setGuardandoReflexion(true);
      await progresoAPI.completarActividad(actividad.id_actividad);
      await reflexionesAPI.guardar(actividad.id_actividad, contenido);
      setCompletada(true);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo guardar");
    } finally {
      setGuardandoReflexion(false);
    }
  };

  const handleGuardarLista = async () => {
    if (!listaCompleta) {
      Alert.alert("Espera", `Completa los ${numItems} campos antes de guardar.`);
      return;
    }
    const label = listaReflexion?.label_item || "Ítem";
    const contenido = items
      .map((it, i) => `${label} ${i + 1}: ${it.trim()}`)
      .join("\n");

    const conectado = await estaConectado();
    if (!conectado) {
      await agregarCola({ type: "completar_actividad", payload: { id_actividad: actividad.id_actividad } });
      await agregarCola({ type: "guardar_reflexion", payload: { id_actividad: actividad.id_actividad, contenido } });
      await refrescarPendientes();
      setCompletada(true);
      Alert.alert("Sin conexión", "Tu reflexión se guardará cuando vuelvas a conectarte.");
      navigation.goBack();
      return;
    }
    try {
      setGuardandoReflexion(true);
      await progresoAPI.completarActividad(actividad.id_actividad);
      await reflexionesAPI.guardar(actividad.id_actividad, contenido);
      setCompletada(true);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo guardar");
    } finally {
      setGuardandoReflexion(false);
    }
  };

  const handleGuardarPlan = async () => {
    if (!planCompleto) {
      Alert.alert("Espera", "Completa todas las señales y acciones antes de guardar.");
      return;
    }
    const contenido = pares
      .map((p, i) =>
        `Señal ${i + 1}: ${p.senal.trim()}\nAcción: ${p.accion.trim()}`
      )
      .join("\n\n");

    const conectado = await estaConectado();
    if (!conectado) {
      await agregarCola({ type: "completar_actividad", payload: { id_actividad: actividad.id_actividad } });
      await agregarCola({ type: "guardar_reflexion", payload: { id_actividad: actividad.id_actividad, contenido } });
      await refrescarPendientes();
      setCompletada(true);
      Alert.alert("Sin conexión", "Tu plan se guardará cuando vuelvas a conectarte.");
      navigation.goBack();
      return;
    }
    try {
      setGuardandoReflexion(true);
      await progresoAPI.completarActividad(actividad.id_actividad);
      await reflexionesAPI.guardar(actividad.id_actividad, contenido);
      setCompletada(true);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo guardar el plan");
    } finally {
      setGuardandoReflexion(false);
    }
  };

  const handleGuardarJournaling = async () => {
    if (!reflexion.trim()) {
      Alert.alert("Espera", "Escribe algo antes de guardar tu reflexión.");
      return;
    }
    const conectado = await estaConectado();
    if (!conectado) {
      await agregarCola({ type: "completar_actividad", payload: { id_actividad: actividad.id_actividad } });
      await agregarCola({ type: "guardar_reflexion", payload: { id_actividad: actividad.id_actividad, contenido: reflexion.trim() } });
      await refrescarPendientes();
      setCompletada(true);
      Alert.alert("Sin conexión", "Tu reflexión se guardará cuando vuelvas a conectarte.");
      navigation.goBack();
      return;
    }
    try {
      setGuardandoReflexion(true);
      await progresoAPI.completarActividad(actividad.id_actividad);
      await reflexionesAPI.guardar(actividad.id_actividad, reflexion.trim());
      setCompletada(true);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo guardar la reflexión");
    } finally {
      setGuardandoReflexion(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.moduloNombre}>{modulo.titulo}</Text>
            <Text style={styles.headerTitulo}>{actividad.titulo}</Text>
          </View>

          <View style={styles.contenido}>
            {/* Chips de tipo y duración */}
            <View style={styles.chipsRow}>
              <View style={[styles.chip, { backgroundColor: tipo.color + "20" }]}>
                <Ionicons name={tipo.icono} size={14} color={tipo.color} />
                <Text style={[styles.chipTexto, { color: tipo.color }]}>{tipo.label}</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.chipTexto}>{actividad.duracion_minutos} min</Text>
              </View>
              {completada && (
                <View style={[styles.chip, { backgroundColor: colors.success + "20" }]}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={[styles.chipTexto, { color: colors.success }]}>Completada</Text>
                </View>
              )}
            </View>

            {/* Contenido de la actividad */}
            {videoId ? (
              <View style={styles.videoCard}>
                <YoutubePlayer
                  height={(width - spacing.lg * 2) * 9 / 16}
                  videoId={videoId}
                  play={false}
                />
              </View>
            ) : esLectura ? (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>Lectura</Text>
                <Text style={styles.contenidoTexto}>
                  Abre el artículo para completar esta actividad.
                </Text>
                <TouchableOpacity
                  style={styles.botonLectura}
                  onPress={() => Linking.openURL(actividad.contenido)}
                >
                  <Ionicons name="open-outline" size={18} color={colors.white} />
                  <Text style={styles.botonLecturaTexto}>Abrir artículo</Text>
                </TouchableOpacity>
              </View>
            ) : cuestionario ? (
              completada && !mostrarResultados ? (
                /* ── YA COMPLETADO ── */
                <View style={styles.card}>
                  <View style={{ alignItems: "center", paddingVertical: spacing.lg }}>
                    <Ionicons name="checkmark-circle" size={56} color="#4A90D9" />
                    <Text style={[styles.cardTitulo, { textAlign: "center", marginTop: spacing.md }]}>
                      Ya completaste esta evaluación
                    </Text>
                    <Text style={[styles.cuestionarioInstruccion, { textAlign: "center", marginTop: spacing.sm }]}>
                      Recuerda hablar con tu psicólogo/a sobre lo que encontraste en esta autoevaluación.
                    </Text>
                  </View>
                </View>
              ) : mostrarResultados ? (
                /* ── RESULTADOS ── */
                <View style={styles.card}>
                  <Text style={styles.cardTitulo}>Tus resultados</Text>
                  <Text style={styles.cuestionarioInstruccion}>
                    Así se distribuyen las áreas que exploramos hoy:
                  </Text>
                  {calcularResultados().map((dim) => {
                    const color = DIM_COLORES[dim.id] || "#4A90D9";
                    return (
                      <View key={dim.id} style={[styles.dimResultado, { backgroundColor: dim.nivel.fondo }]}>
                        <View style={styles.dimResultadoHeader}>
                          <Text style={styles.dimLabel}>{dim.label}</Text>
                          <Text style={[styles.dimNivel, { color }]}>{dim.nivel.label}</Text>
                        </View>
                        <View style={styles.barraFondo}>
                          <View style={[styles.barraRelleno, { width: `${dim.porcentaje}%`, backgroundColor: color }]} />
                        </View>
                        <Text style={styles.dimPorcentaje}>{dim.porcentaje}%</Text>
                      </View>
                    );
                  })}
                  <Text style={styles.resultadoNota}>
                    Recuerda que estos resultados son solo un punto de partida para reflexionar. Habla con tu psicólogo/a sobre lo que encontraste.
                  </Text>
                </View>
              ) : (
                /* ── PREGUNTAS ── */
                <View style={styles.card}>
                  <Text style={styles.cardTitulo}>Autoevaluación</Text>
                  <Text style={styles.cuestionarioInstruccion}>{cuestionario.instruccion}</Text>
                  {cuestionario.dimensiones.map((dim) => (
                    <View key={dim.id}>
                      <Text style={styles.dimTitulo}>{dim.label}</Text>
                      {dim.preguntas.map((pregunta) => (
                        <View key={pregunta.id} style={styles.preguntaWrap}>
                          <Text style={styles.preguntaTexto}>{pregunta.id}. {pregunta.texto}</Text>
                          <View style={styles.escalaRow}>
                            {ESCALA.map((op) => {
                              const seleccionada = respuestas[pregunta.id] === op.valor;
                              const color = DIM_COLORES[dim.id] || "#4A90D9";
                              return (
                                <TouchableOpacity
                                  key={op.valor}
                                  style={[
                                    styles.escalaBtn,
                                    seleccionada && { backgroundColor: color, borderColor: color },
                                  ]}
                                  onPress={() => setRespuestas((prev) => ({ ...prev, [pregunta.id]: op.valor }))}
                                >
                                  <Text style={[styles.escalaBtnTexto, seleccionada && { color: "#fff" }]}>
                                    {op.label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
                  <Button
                    title="Ver resultados"
                    onPress={() => setMostrarResultados(true)}
                    style={[styles.botonCompletar, { opacity: cuestionarioCompleto ? 1 : 0.4 }]}
                    disabled={!cuestionarioCompleto}
                  />
                </View>
              )
            ) : distorsiones ? (
              completada && !quizTerminado ? (
                /* ── YA COMPLETADO ── */
                <View style={styles.card}>
                  <View style={{ alignItems: "center", paddingVertical: spacing.lg }}>
                    <Ionicons name="checkmark-circle" size={56} color="#4A90D9" />
                    <Text style={[styles.cardTitulo, { textAlign: "center", marginTop: spacing.md }]}>
                      Ya completaste este quiz
                    </Text>
                    <Text style={[styles.cuestionarioInstruccion, { textAlign: "center", marginTop: spacing.sm }]}>
                      Identificar distorsiones cognitivas es el primer paso para cambiarlas.
                    </Text>
                  </View>
                </View>
              ) : quizTerminado ? (
                /* ── RESULTADO FINAL ── */
                <View style={styles.card}>
                  <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
                    <Text style={{ fontSize: 48 }}>
                      {aciertos === distorsiones.preguntas.length ? "🏆" : aciertos >= distorsiones.preguntas.length / 2 ? "👍" : "💪"}
                    </Text>
                    <Text style={[styles.cardTitulo, { textAlign: "center", marginTop: spacing.md }]}>
                      {aciertos} de {distorsiones.preguntas.length} correctas
                    </Text>
                    <Text style={[styles.cuestionarioInstruccion, { textAlign: "center", marginTop: spacing.sm }]}>
                      {aciertos === distorsiones.preguntas.length
                        ? "¡Excelente! Reconoces muy bien las distorsiones cognitivas."
                        : aciertos >= distorsiones.preguntas.length / 2
                        ? "Buen trabajo. Con práctica identificarás estas distorsiones cada vez más rápido."
                        : "Cada intento es aprendizaje. Las distorsiones son sutiles, lo importante es empezar a reconocerlas."}
                    </Text>
                  </View>
                </View>
              ) : (
                /* ── PREGUNTA ACTUAL ── */
                <View style={styles.card}>
                  <View style={styles.quizProgreso}>
                    <Text style={styles.quizProgresoTexto}>
                      Pregunta {preguntaActual + 1} de {distorsiones.preguntas.length}
                    </Text>
                    <View style={styles.barraFondo}>
                      <View style={[styles.barraRelleno, {
                        width: `${((preguntaActual + (mostrarFeedback ? 1 : 0)) / distorsiones.preguntas.length) * 100}%`,
                        backgroundColor: AZUL,
                      }]} />
                    </View>
                  </View>

                  <View style={styles.situacionCard}>
                    <Text style={styles.situacionLabel}>Situación</Text>
                    <Text style={styles.situacionTexto}>
                      {distorsiones.preguntas[preguntaActual].situacion}
                    </Text>
                  </View>

                  <Text style={styles.cuestionarioInstruccion}>¿Qué distorsión cognitiva representa?</Text>

                  {distorsiones.preguntas[preguntaActual].opciones.map((opcion, idx) => {
                    const pregunta = distorsiones.preguntas[preguntaActual];
                    const esCorrecta = idx === pregunta.correcta;
                    const esSeleccionada = idx === respuestaSeleccionada;

                    let estiloBorde = {};
                    let estiloFondo = {};
                    let colorTexto = colors.text;

                    if (mostrarFeedback) {
                      if (esCorrecta) {
                        estiloBorde = { borderColor: "#4A90D9" };
                        estiloFondo = { backgroundColor: "#EAF4FF" };
                        colorTexto = "#4A90D9";
                      } else if (esSeleccionada) {
                        estiloBorde = { borderColor: "#E8875A" };
                        estiloFondo = { backgroundColor: "#FFF3EE" };
                        colorTexto = "#E8875A";
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.opcionBtn, estiloBorde, estiloFondo]}
                        onPress={() => handleSeleccionarOpcion(idx)}
                        activeOpacity={mostrarFeedback ? 1 : 0.7}
                      >
                        <View style={styles.opcionRow}>
                          <Text style={[styles.opcionTexto, { color: colorTexto }]}>{opcion}</Text>
                          {mostrarFeedback && esCorrecta && (
                            <Ionicons name="checkmark-circle" size={18} color="#4A90D9" />
                          )}
                          {mostrarFeedback && esSeleccionada && !esCorrecta && (
                            <Ionicons name="close-circle" size={18} color="#E8875A" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {mostrarFeedback && (
                    <View style={styles.feedbackWrap}>
                      <Text style={styles.feedbackTexto}>
                        💡 {distorsiones.preguntas[preguntaActual].explicacion}
                      </Text>
                      <TouchableOpacity style={styles.btnSiguiente} onPress={handleSiguientePregunta}>
                        <Text style={styles.btnSiguienteTexto}>
                          {preguntaActual + 1 < distorsiones.preguntas.length ? "Siguiente →" : "Ver resultado"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            ) : journaling ? (
              completada ? (
                /* ── YA COMPLETADO ── */
                <View style={styles.card}>
                  <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
                    <Ionicons name="checkmark-circle" size={56} color="#4A90D9" />
                    <Text style={[styles.cardTitulo, { textAlign: "center", marginTop: spacing.md }]}>
                      Ya guardaste tu reflexión
                    </Text>
                    {reflexionExistente && (
                      <View style={[styles.situacionCard, { marginTop: spacing.md, width: "100%" }]}>
                        <Text style={styles.reflexionTexto}>{reflexionExistente.contenido}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                /* ── FORMULARIO JOURNALING ── */
                <View style={styles.card}>
                  <Text style={styles.cardTitulo}>Journaling</Text>
                  <Text style={styles.cuestionarioInstruccion}>{journaling.instrucciones}</Text>

                  {journaling.preguntas_guia?.length > 0 && (
                    <View style={styles.guiaContainer}>
                      <Text style={styles.guiaTitulo}>Preguntas para guiarte:</Text>
                      {journaling.preguntas_guia.map((q, i) => (
                        <Text key={i} style={styles.guiaPregunta}>• {q}</Text>
                      ))}
                    </View>
                  )}

                  <TextInput
                    style={styles.journalingInput}
                    value={reflexion}
                    onChangeText={setReflexion}
                    placeholder="Escribe tu reflexión aquí..."
                    placeholderTextColor={colors.gray}
                    multiline
                    textAlignVertical="top"
                    maxLength={1000}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
                    }}
                  />
                  <Text style={styles.contadorCaracteres}>{reflexion.length}/1000</Text>

                  <Button
                    title="Guardar reflexión"
                    onPress={handleGuardarJournaling}
                    loading={guardandoReflexion}
                    style={styles.botonCompletar}
                  />
                </View>
              )
            ) : formularioPlan ? (
              completada ? (
                /* ── YA COMPLETADO ── */
                <View style={styles.card}>
                  <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
                    <Ionicons name="checkmark-circle" size={56} color="#4A90D9" />
                    <Text style={[styles.cardTitulo, { textAlign: "center", marginTop: spacing.md }]}>
                      Tu plan de acción está guardado
                    </Text>
                    {reflexionExistente && (
                      <View style={[styles.situacionCard, { marginTop: spacing.md, width: "100%" }]}>
                        <Text style={styles.reflexionTexto}>{reflexionExistente.contenido}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                /* ── FORMULARIO ── */
                <View style={styles.card}>
                  <Text style={styles.cardTitulo}>Plan de acción</Text>
                  <Text style={styles.cuestionarioInstruccion}>{formularioPlan.instrucciones}</Text>

                  {pares.map((par, i) => (
                    <View key={i} style={styles.parContainer}>
                      <View style={styles.parNumero}>
                        <Text style={styles.parNumeroTexto}>{i + 1}</Text>
                      </View>

                      <View style={styles.parCampos}>
                        <Text style={styles.parLabel}>Señal de alarma</Text>
                        <TextInput
                          style={styles.planInput}
                          value={par.senal}
                          onChangeText={(v) =>
                            setPares((prev) => prev.map((p, j) => j === i ? { ...p, senal: v } : p))
                          }
                          placeholder="Ej: Me siento irritable sin razón..."
                          placeholderTextColor={colors.gray}
                          multiline
                          textAlignVertical="top"
                        />

                        <Text style={[styles.parLabel, { marginTop: spacing.sm }]}>Acción que tomaré</Text>
                        <TextInput
                          style={styles.planInput}
                          value={par.accion}
                          onChangeText={(v) =>
                            setPares((prev) => prev.map((p, j) => j === i ? { ...p, accion: v } : p))
                          }
                          placeholder="Ej: Haré 10 minutos de respiración..."
                          placeholderTextColor={colors.gray}
                          multiline
                          textAlignVertical="top"
                        />
                      </View>
                    </View>
                  ))}

                  <Button
                    title="Guardar mi plan"
                    onPress={handleGuardarPlan}
                    loading={guardandoReflexion}
                    style={[styles.botonCompletar, { opacity: planCompleto ? 1 : 0.4 }]}
                    disabled={!planCompleto}
                  />
                </View>
              )
            ) : listaReflexion ? (
              completada ? (
                /* ── YA COMPLETADO ── */
                <View style={styles.card}>
                  <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
                    <Ionicons name="checkmark-circle" size={56} color="#4A90D9" />
                    <Text style={[styles.cardTitulo, { textAlign: "center", marginTop: spacing.md }]}>
                      ¡Reflexión guardada!
                    </Text>
                    {reflexionExistente && (
                      <View style={[styles.situacionCard, { marginTop: spacing.md, width: "100%" }]}>
                        <Text style={styles.reflexionTexto}>{reflexionExistente.contenido}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                /* ── LISTA DE ITEMS ── */
                <View style={styles.card}>
                  <Text style={styles.cardTitulo}>{listaReflexion.label_item}s</Text>
                  <Text style={styles.cuestionarioInstruccion}>{listaReflexion.instrucciones}</Text>

                  {items.map((valor, i) => (
                    <View key={i} style={styles.itemRow}>
                      <View style={styles.parNumero}>
                        <Text style={styles.parNumeroTexto}>{i + 1}</Text>
                      </View>
                      <TextInput
                        style={[styles.planInput, { flex: 1 }]}
                        value={valor}
                        onChangeText={(v) =>
                          setItems((prev) => prev.map((it, j) => j === i ? v : it))
                        }
                        placeholder={listaReflexion.placeholder || `${listaReflexion.label_item} ${i + 1}...`}
                        placeholderTextColor={colors.gray}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  ))}

                  <Button
                    title="Guardar reflexión"
                    onPress={handleGuardarLista}
                    loading={guardandoReflexion}
                    style={[styles.botonCompletar, { opacity: listaCompleta ? 1 : 0.4 }]}
                    disabled={!listaCompleta}
                  />
                </View>
              )
            ) : cajaHerramientas ? (
              completada ? (
                /* ── YA COMPLETADO ── */
                <View style={styles.card}>
                  <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
                    <Text style={{ fontSize: 56 }}>🧰</Text>
                    <Text style={[styles.cardTitulo, { textAlign: "center", marginTop: spacing.md }]}>
                      ¡Tu caja de herramientas está lista!
                    </Text>
                    <Text style={[styles.cuestionarioInstruccion, { textAlign: "center" }]}>
                      Has completado el programa. Lleva estas herramientas contigo.
                    </Text>
                    {reflexionExistente && (
                      <View style={[styles.situacionCard, { marginTop: spacing.md, width: "100%" }]}>
                        <Text style={styles.reflexionTexto}>{reflexionExistente.contenido}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                /* ── SELECCIÓN ── */
                <View style={styles.card}>
                  <Text style={styles.cardTitulo}>🧰 Mi caja de herramientas</Text>
                  <Text style={styles.cuestionarioInstruccion}>{cajaHerramientas.instrucciones}</Text>
                  <Text style={styles.cajaContador}>
                    {seleccionadas.size} seleccionadas · mínimo {minSeleccion}
                  </Text>

                  <View style={styles.cajaGrid}>
                    {cajaHerramientas.tecnicas.map((tecnica) => {
                      const activa = seleccionadas.has(tecnica.id);
                      return (
                        <TouchableOpacity
                          key={tecnica.id}
                          style={[styles.cajaTarjeta, activa && styles.cajaTarjetaActiva]}
                          onPress={() => toggleTecnica(tecnica.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={activa ? tecnica.icono : `${tecnica.icono}-outline`}
                            size={24}
                            color={activa ? colors.white : AZUL}
                          />
                          <Text style={[styles.cajaTarjetaNombre, activa && { color: colors.white }]}>
                            {tecnica.nombre}
                          </Text>
                          {activa && (
                            <Ionicons name="checkmark-circle" size={16} color={colors.white} style={styles.cajaCheck} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Button
                    title="Guardar mi caja de herramientas"
                    onPress={handleGuardarCaja}
                    loading={guardandoReflexion}
                    style={[styles.botonCompletar, { opacity: cajaCompleta ? 1 : 0.4 }]}
                    disabled={!cajaCompleta}
                  />
                </View>
              )
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>Descripción</Text>
                <Text style={styles.contenidoTexto}>{actividad.contenido}</Text>
              </View>
            )}

            {/* Reflexión existente (si ya completó antes) */}
            {reflexionExistente && !mostrarReflexion && !journaling && !formularioPlan && !listaReflexion && !cajaHerramientas && (
              <View style={styles.card}>
                <View style={styles.reflexionHeader}>
                  <Text style={styles.cardTitulo}>Mi reflexión</Text>
                  <TouchableOpacity onPress={() => setMostrarReflexion(true)}>
                    <Ionicons name="create-outline" size={18} color={AZUL} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.reflexionTexto}>{reflexionExistente.contenido}</Text>
              </View>
            )}

            {/* Input de reflexión (al completar o editar) */}
            {mostrarReflexion && !journaling && !formularioPlan && !listaReflexion && !cajaHerramientas && (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>
                  {reflexionExistente ? "Editar reflexión" : "¿Qué aprendiste?"}
                </Text>
                <Text style={styles.reflexionHint}>
                  Escribe una reflexión breve sobre esta actividad (opcional)
                </Text>
                <TextInput
                  style={styles.reflexionInput}
                  value={reflexion}
                  onChangeText={setReflexion}
                  placeholder="Escribe tu reflexión aquí..."
                  placeholderTextColor={colors.gray}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <View style={styles.reflexionBotones}>
                  <TouchableOpacity
                    style={styles.botonOmitir}
                    onPress={() => {
                      setMostrarReflexion(false);
                      if (completada && !reflexionExistente) navigation.goBack();
                    }}
                  >
                    <Text style={styles.botonOmitirTexto}>Omitir</Text>
                  </TouchableOpacity>
                  <Button
                    title="Guardar"
                    onPress={handleGuardarReflexion}
                    loading={guardandoReflexion}
                    style={styles.botonGuardar}
                  />
                </View>
              </View>
            )}

            {/* Botón completar */}
            {!completada && !mostrarReflexion && !journaling && !formularioPlan && !listaReflexion && !cajaHerramientas && (
              <Button
                title="Marcar como completada"
                onPress={handleCompletar}
                loading={completando}
                style={styles.botonCompletar}
              />
            )}

            <View style={{ height: spacing.xl }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: AZUL,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: { marginBottom: spacing.sm },
  moduloNombre: {
    fontSize: fonts.sizes.xs,
    color: colors.primaryLight,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitulo: {
    fontSize: fonts.sizes.xl,
    fontWeight: "bold",
    color: colors.white,
  },
  contenido: { padding: spacing.lg },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.grayLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  chipTexto: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  videoCard: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    backgroundColor: colors.black,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitulo: {
    fontSize: fonts.sizes.sm,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  contenidoTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 22,
  },
  reflexionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  reflexionTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 22,
    fontStyle: "italic",
  },
  reflexionHint: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  reflexionInput: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.sizes.sm,
    color: colors.text,
    minHeight: 100,
    marginBottom: spacing.md,
  },
  reflexionBotones: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  botonOmitir: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  botonOmitirTexto: { fontSize: fonts.sizes.sm, color: colors.textSecondary },
  botonGuardar: { flex: 0, paddingHorizontal: spacing.lg, backgroundColor: AZUL },
  botonCompletar: { backgroundColor: AZUL, borderRadius: borderRadius.lg },
  botonLectura: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: AZUL,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  botonLecturaTexto: {
    color: colors.white,
    fontWeight: "600",
    fontSize: fonts.sizes.sm,
  },
  cuestionarioInstruccion: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  dimTitulo: {
    fontSize: fonts.sizes.sm,
    fontWeight: "700",
    color: AZUL,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    paddingBottom: spacing.xs,
  },
  preguntaWrap: {
    marginBottom: spacing.md,
  },
  preguntaTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  escalaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  escalaBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
    backgroundColor: colors.white,
  },
  escalaBtnTexto: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  dimResultado: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dimResultadoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  dimLabel: {
    fontSize: fonts.sizes.sm,
    fontWeight: "700",
    color: colors.text,
  },
  dimNivel: {
    fontSize: fonts.sizes.xs,
    fontWeight: "600",
  },
  barraFondo: {
    height: 8,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: 4,
  },
  barraRelleno: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  dimPorcentaje: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    textAlign: "right",
  },
  quizProgreso: { marginBottom: spacing.md },
  quizProgresoTexto: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  situacionCard: {
    backgroundColor: "#F0F4FF",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: AZUL,
  },
  situacionLabel: {
    fontSize: fonts.sizes.xs,
    color: AZUL,
    fontWeight: "700",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  situacionTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 22,
    fontStyle: "italic",
  },
  opcionBtn: {
    borderWidth: 1.5,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  opcionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  opcionTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  feedbackWrap: {
    backgroundColor: "#F8F9FF",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  feedbackTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  btnSiguiente: {
    backgroundColor: AZUL,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  btnSiguienteTexto: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fonts.sizes.sm,
  },
  resultadoNota: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.md,
    lineHeight: 18,
    textAlign: "center",
  },
  guiaContainer: {
    backgroundColor: "#F0F4FF",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: AZUL,
  },
  guiaTitulo: {
    fontSize: fonts.sizes.xs,
    fontWeight: "700",
    color: AZUL,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  guiaPregunta: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  journalingInput: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.sizes.sm,
    color: colors.text,
    minHeight: 160,
    marginBottom: 4,
  },
  contadorCaracteres: {
    fontSize: fonts.sizes.xs,
    color: colors.gray,
    textAlign: "right",
    marginBottom: spacing.md,
  },
  parContainer: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  parNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AZUL,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  parNumeroTexto: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: fonts.sizes.sm,
  },
  parCampos: { flex: 1 },
  parLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: "700",
    color: AZUL,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  planInput: {
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fonts.sizes.sm,
    color: colors.text,
    minHeight: 64,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cajaContador: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cajaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cajaTarjeta: {
    width: "47%",
    backgroundColor: "#F0F4FF",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: "transparent",
    position: "relative",
  },
  cajaTarjetaActiva: {
    backgroundColor: AZUL,
    borderColor: AZUL,
  },
  cajaTarjetaNombre: {
    fontSize: fonts.sizes.xs,
    color: AZUL,
    fontWeight: "600",
    textAlign: "center",
  },
  cajaCheck: {
    position: "absolute",
    top: 6,
    right: 6,
  },
});
