// BANNER DE ESTADO OFFLINE
// src/components/OfflineBanner.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "../context/NetworkContext";

export default function OfflineBanner() {
  const { isConnected, pendingCount } = useNetwork();

  if (isConnected && pendingCount === 0) return null;

  if (!isConnected) {
    return (
      <View style={[styles.banner, styles.sinConexion]}>
        <Ionicons name="cloud-offline-outline" size={15} color="#fff" />
        <Text style={styles.texto}>
          Sin conexión
          {pendingCount > 0 ? ` · ${pendingCount} cambio${pendingCount > 1 ? "s" : ""} pendiente${pendingCount > 1 ? "s" : ""}` : ""}
        </Text>
      </View>
    );
  }

  // Hay conexión pero aún hay pendientes (sincronizando...)
  return (
    <View style={[styles.banner, styles.sincronizando]}>
      <Ionicons name="sync-outline" size={15} color="#fff" />
      <Text style={styles.texto}>
        Sincronizando {pendingCount} cambio{pendingCount > 1 ? "s" : ""}...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  sinConexion: { backgroundColor: "#B00020" },
  sincronizando: { backgroundColor: "#E65100" },
  texto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
