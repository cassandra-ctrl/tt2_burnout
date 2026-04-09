// ============================================================================
// APP.JS - Punto de entrada de la aplicación
// ============================================================================

import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NetworkProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </NetworkProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
