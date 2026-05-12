// PANTALLA PRINCIPAL - HOME
// src/screens/HomeScreen.js

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { progresoAPI, logrosAPI, modulosAPI, testAPI } from "../services/api";
import { Loading, MascotaConMensaje } from "../components";
import { colors, fonts, spacing, borderRadius } from "../utils/theme";
import { guardarCache, leerCache } from "../utils/offline";
import OfflineBanner from "../components/OfflineBanner";
import { getMensajePorHora, getMensajeAleatorio } from "../utils/mensajes-mascota";

const AZUL = "#1E3A5F";

export default function HomeScreen({ navigation }) {
  const { usuario } = useAuth();
  const pacienteId = usuario?.roleId || usuario?.role_id;

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [progreso, setProgreso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [ultimoLogro, setUltimoLogro] = useState(null);
  const [testFinalPendiente, setTestFinalPendiente] = useState(false);
  const yaVerificoFinalRef = useRef(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [progresoData, modulosData, logrosData] = await Promise.all([
        progresoAPI.getByPaciente(pacienteId),
        modulosAPI.getAll(),
        logrosAPI.getMisLogros(),
      ]);

      guardarCache(`home_progreso_${pacienteId}`, progresoData);
      guardarCache("home_modulos", modulosData);
      guardarCache("home_logros", logrosData);

      setProgreso(progresoData);
      setModulos(modulosData.modulos || []);

      const misLogros = logrosData.logros || [];
      if (misLogros.length > 0) setUltimoLogro(misLogros[0]);

      // Verificar si el programa está completo y falta el test final
      if (!yaVerificoFinalRef.current) {
        yaVerificoFinalRef.current = true;
        const porcentaje = progresoData?.progreso_general?.porcentaje_completado || 0;
        if (porcentaje >= 100) {
          try {
            const estadoTest = await testAPI.getEstado();
            if (!estadoTest?.prueba_final?.completada) {
              setTestFinalPendiente(true);
            }
          } catch (_) {}
        }
      }
    } catch (error) {
      if (error.status === 0) {
        const [progresoData, modulosData, logrosData] = await Promise.all([
          leerCache(`home_progreso_${pacienteId}`),
          leerCache("home_modulos"),
          leerCache("home_logros"),
        ]);
        if (progresoData) setProgreso(progresoData);
        if (modulosData) setModulos(modulosData.modulos || []);
        if (logrosData) {
          const misLogros = logrosData.logros || [];
          if (misLogros.length > 0) setUltimoLogro(misLogros[0]);
        }
      } else {
        console.error("Error cargando datos del home:", error);
      }
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarDatos();
  };

  // Módulo actual: primero en_progreso, si no el primero desbloqueado
  const moduloActual = modulos.find((m) => m.estado === "en_progreso")
    || modulos.find((m) => !m.bloqueado && m.estado !== "completado");

  const porcentajeTotal = progreso?.progreso_general?.porcentaje_completado || 0;
  const rachaActual = progreso?.paciente?.racha_actual || 0;

  // Determinar tipo de mascota y mensaje segun contexto
  const datosMascota = (() => {
    if (porcentajeTotal >= 100) {
      return { tipo: "celebrando", mensaje: getMensajeAleatorio("celebrando") };
    }
    if (rachaActual >= 3) {
      return {
        tipo: "celebrando",
        mensaje: `¡Llevas ${rachaActual} días seguidos! Tu constancia es admirable.`,
      };
    }
    if (rachaActual === 0 && porcentajeTotal > 0) {
      return { tipo: "motivador", mensaje: getMensajeAleatorio("motivador") };
    }
    return getMensajePorHora();
  })();

  if (cargando) {
    return <Loading message="Cargando..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={AZUL} />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.saludo}>
                Hola, {usuario?.nombre} 👋
              </Text>
              <Text style={styles.subtitulo}>¿Cómo te sientes hoy?</Text>
            </View>
            <TouchableOpacity style={styles.campana} onPress={() => navigation.navigate("Perfil")}>
              <Ionicons name="notifications-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contenido}>
          
          {/* MASCOTA CON SALUDO */}
          <View style={styles.mascotaCard}>
            <MascotaConMensaje
              tipo={datosMascota.tipo}
              mensaje={datosMascota.mensaje}
              tamano="sm"
              direccion="horizontal"
            />
          </View>

          {/* RACHA Y PROGRESO */}
          <View style={styles.card}>
            <View style={styles.rachaRow}>
              <Text style={styles.rachaTexto}>🔥 Racha: {rachaActual} día{rachaActual !== 1 ? "s" : ""}</Text>
              <Text style={styles.porcentajeTexto}>{porcentajeTotal}% completado</Text>
            </View>
            <View style={styles.barraFondo}>
              <View style={[styles.barraRelleno, { width: `${porcentajeTotal}%` }]} />
            </View>
          </View>

          {/* BANNER TEST FINAL */}
          {testFinalPendiente && (
            <TouchableOpacity
              style={styles.bannerFinal}
              onPress={() => navigation.navigate("TestOLBI", { tipo: "final" })}
              activeOpacity={0.85}
            >
              <Text style={styles.bannerFinalEmoji}>🎓</Text>
              <View style={styles.bannerFinalTextos}>
                <Text style={styles.bannerFinalTitulo}>¡Completaste el programa!</Text>
                <Text style={styles.bannerFinalSubtitulo}>
                  Es momento de realizar tu evaluación final. Toca aquí para comenzar.
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={28} color={colors.white} />
            </TouchableOpacity>
          )}

          {/* CONTINUAR DONDE LO DEJASTE */}
          <Text style={styles.seccionTitulo}>📚 Continuar donde lo dejaste</Text>
          {moduloActual ? (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("DetalleModulo", { modulo: moduloActual, pacienteId })}
            >
              <Text style={styles.moduloTitulo}>{moduloActual.titulo}</Text>
              <Text style={styles.moduloDescripcion} numberOfLines={2}>
                {moduloActual.descripcion}
              </Text>
              <View style={styles.moduloFooter}>
                <Text style={styles.moduloActividades}>
                  {moduloActual.total_actividades} actividades
                </Text>
                <View style={styles.continuarBtn}>
                  <Text style={styles.continuarTexto}>Continuar </Text>
                  <Ionicons name="arrow-forward" size={14} color={AZUL} />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <Text style={styles.textoVacio}>
                {modulos.every((m) => m.estado === "completado")
                  ? "🎉 ¡Has completado todos los módulos!"
                  : "Aún no has iniciado ningún módulo."}
              </Text>
            </View>
          )}

          {/* ACCESOS RÁPIDOS */}
          <Text style={styles.seccionTitulo}>Accesos rápidos</Text>
          <View style={styles.accesosGrid}>
            <TouchableOpacity
              style={styles.accesoItem}
              onPress={() => navigation.navigate("Módulos")}
            >
              <View style={styles.accesoIcono}>
                <Ionicons name="bar-chart" size={28} color={AZUL} />
              </View>
              <Text style={styles.accesoTexto}>Progreso</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accesoItem}
              onPress={() => navigation.navigate("Logros")}
            >
              <View style={styles.accesoIcono}>
                <Ionicons name="trophy" size={28} color={AZUL} />
              </View>
              <Text style={styles.accesoTexto}>Logros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accesoItem}
              onPress={() => navigation.navigate("Citas")}
            >
              <View style={styles.accesoIcono}>
                <Ionicons name="calendar" size={28} color={AZUL} />
              </View>
              <Text style={styles.accesoTexto}>Citas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accesoItem}
              onPress={() => navigation.navigate("Diario")}
            >
              <View style={styles.accesoIcono}>
                <Ionicons name="book" size={28} color={AZUL} />
              </View>
              <Text style={styles.accesoTexto}>Diario</Text>
            </TouchableOpacity>
          </View>

          {/* ÚLTIMO LOGRO */}
          <Text style={styles.seccionTitulo}>🥇 Último logro desbloqueado</Text>
          {ultimoLogro ? (
            <View style={styles.card}>
              <View style={styles.logroRow}>
                <Text style={styles.logroEmoji}>{ultimoLogro.icono || "🏅"}</Text>
                <View style={styles.logroInfo}>
                  <Text style={styles.logroNombre}>{ultimoLogro.nombre}</Text>
                  <Text style={styles.logroDescripcion} numberOfLines={2}>
                    {ultimoLogro.descripcion}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.textoVacio}>
                Completa actividades para desbloquear logros.
              </Text>
            </View>
          )}

          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mascotaCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    backgroundColor: AZUL,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + spacing.md,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  saludo: {
    fontSize: fonts.sizes.xl,
    fontWeight: "bold",
    color: colors.white,
  },
  subtitulo: {
    fontSize: fonts.sizes.md,
    color: colors.primaryLight,
    marginTop: spacing.xs,
  },
  campana: {
    padding: spacing.xs,
  },
  contenido: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  rachaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  rachaTexto: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
  },
  porcentajeTexto: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  barraFondo: {
    height: 10,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  barraRelleno: {
    height: "100%",
    backgroundColor: AZUL,
    borderRadius: borderRadius.full,
  },
  seccionTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  moduloTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  moduloDescripcion: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  moduloFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moduloActividades: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  continuarBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  continuarTexto: {
    fontSize: fonts.sizes.sm,
    fontWeight: "bold",
    color: AZUL,
  },
  accesosGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  accesoItem: {
    alignItems: "center",
    flex: 1,
  },
  accesoIcono: {
    width: 60,
    height: 60,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  accesoTexto: {
    fontSize: fonts.sizes.xs,
    color: colors.text,
    textAlign: "center",
  },
  logroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logroEmoji: {
    fontSize: 36,
  },
  logroInfo: {
    flex: 1,
  },
  logroNombre: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  logroDescripcion: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  textoVacio: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
  bannerFinal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AZUL,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    shadowColor: AZUL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerFinalEmoji: {
    fontSize: 32,
  },
  bannerFinalTextos: {
    flex: 1,
  },
  bannerFinalTitulo: {
    fontSize: fonts.sizes.md,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 2,
  },
  bannerFinalSubtitulo: {
    fontSize: fonts.sizes.xs,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 16,
  },
});
