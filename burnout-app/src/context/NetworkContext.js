// CONTEXTO DE RED
// src/context/NetworkContext.js
//
// Detecta si hay conexión a internet.
// Polling cada 5 segundos para detectar reconexión mientras la app está activa.
// Cuando detecta offline→online, sincroniza la cola automáticamente.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import * as Network from "expo-network";
import { sincronizarCola, contarPendientes } from "../utils/offline";

const NetworkContext = createContext({ isConnected: true, pendingCount: 0, lastSyncAt: null });

const POLL_INTERVAL_MS = 15000;

export function NetworkProvider({ children }) {
  const [isConnected, setIsConnected] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState(null);

  // Ref para detectar transición offline → online sin re-crear el intervalo
  const prevConnectedRef = useRef(true);

  const checkAndSync = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const conectado =
        state.isConnected !== false && state.isInternetReachable !== false;

      const eraDesconectado = !prevConnectedRef.current;
      prevConnectedRef.current = conectado;
      setIsConnected(conectado);

      if (conectado) {
        const pendientes = await contarPendientes();
        // Sincronizar si: acaba de reconectarse O simplemente hay pendientes
        if (eraDesconectado || pendientes > 0) {
          const n = await sincronizarCola();
          const nuevos = await contarPendientes();
          setPendingCount(nuevos);
          if (n > 0) setLastSyncAt(Date.now());
        }
      } else {
        const n = await contarPendientes();
        setPendingCount(n);
      }
    } catch (_) {}
  }, []);

  // Al montar: verificar y sincronizar de inmediato
  useEffect(() => {
    checkAndSync();
  }, []);

  // Polling cada 5 segundos mientras la app está activa
  useEffect(() => {
    const interval = setInterval(checkAndSync, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkAndSync]);

  // Cuando la app vuelve al primer plano: sincronizar de inmediato
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") checkAndSync();
    });
    return () => sub.remove();
  }, [checkAndSync]);

  const refrescarPendientes = useCallback(async () => {
    const n = await contarPendientes();
    setPendingCount(n);
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, pendingCount, lastSyncAt, refrescarPendientes }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
