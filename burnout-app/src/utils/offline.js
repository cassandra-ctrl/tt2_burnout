// UTILIDADES OFFLINE
// src/utils/offline.js
//
// Dos responsabilidades:
//  1. Caché de lectura  — guarda respuestas GET para usarlas sin internet
//  2. Cola de escritura — guarda operaciones POST para enviarlas al reconectar

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { progresoAPI, diarioAPI, reflexionesAPI } from "../services/api";

const CACHE_PREFIX = "cache_";
const QUEUE_KEY = "offline_queue";

// ─── UTILIDADES ───────────────────────────────────────────────────────────────

// Fecha local del dispositivo en formato YYYY-MM-DD (evita desfase UTC)
export function getFechaLocal() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Verifica conectividad en tiempo real (no depende del estado del contexto)
export async function estaConectado() {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected !== false && state.isInternetReachable !== false;
  } catch (_) {
    return true;
  }
}

// ─── CACHÉ ────────────────────────────────────────────────────────────────────

export async function guardarCache(clave, datos) {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + clave, JSON.stringify(datos));
  } catch (_) {}
}

export async function leerCache(clave) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + clave);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

// ─── COLA DE ESCRITURA ────────────────────────────────────────────────────────

export async function agregarCola(operacion) {
  try {
    const cola = await leerCola();
    const nueva = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...operacion,
    };
    cola.push(nueva);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(cola));
  } catch (_) {}
}

export async function leerCola() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export async function contarPendientes() {
  const cola = await leerCola();
  return cola.length;
}

async function removerDeCola(id) {
  const cola = await leerCola();
  const nueva = cola.filter((op) => op.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(nueva));
}

// ─── SINCRONIZACIÓN ───────────────────────────────────────────────────────────
// Recorre la cola y envía cada operación al servidor.
// Si falla por red → la deja en cola para el próximo intento.
// Si falla por otro motivo (ya completada, etc.) → la elimina para no reintentar.

export async function sincronizarCola() {
  const cola = await leerCola();
  if (cola.length === 0) return 0;

  let sincronizadas = 0;

  for (const op of cola) {
    try {
      if (op.type === "completar_actividad") {
        await progresoAPI.completarActividad(op.payload.id_actividad);
      } else if (op.type === "guardar_diario") {
        await diarioAPI.guardar(op.payload.contenido, op.payload.fecha);
      } else if (op.type === "guardar_reflexion") {
        await reflexionesAPI.guardar(op.payload.id_actividad, op.payload.contenido);
      }
      await removerDeCola(op.id);
      sincronizadas++;
    } catch (error) {
      if (error.status !== 0) {
        // Error del servidor (no de red) — eliminar para no reintentar infinitamente
        await removerDeCola(op.id);
        sincronizadas++;
      }
      // Error de red (status === 0) → se queda en cola
    }
  }

  return sincronizadas;
}
