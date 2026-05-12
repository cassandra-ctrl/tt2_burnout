// ============================================================================
// CONTEXTO DE AUTENTICACIÓN
// src/context/AuthContext.js
//
// Maneja el estado global del usuario logueado
// ============================================================================

import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, testAPI } from "../services/api";

// Crear el contexto
const AuthContext = createContext({});

// ============================================================================
// PROVEEDOR DEL CONTEXTO
// ============================================================================

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [error, setError] = useState(null);
  const [onboardingCompletado, setOnboardingCompletado] = useState(false);

  // Helper: consultar el estado del onboarding desde la BD
  const consultarOnboarding = async () => {
    try {
      const estado = await testAPI.getEstado();
      return estado?.prueba_inicial?.completada === true;
    } catch (err) {
      console.log("Error consultando estado de onboarding:", err);
      return false;
    }
  };

  // -------------------------------------------------------------------------
  // Verificar sesion al iniciar la app
  // -------------------------------------------------------------------------
  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        try {
          const data = await authAPI.getProfile();
          const user = data.usuario || data.user;

          // IMPORTANTE: consultar onboarding ANTES de setUsuario
          // Asi cuando el navigator se monte, ya tendra el valor correcto
          const completado = await consultarOnboarding();
          setOnboardingCompletado(completado);
          setUsuario(user);
        } catch (err) {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("usuario");
          setUsuario(null);
          setOnboardingCompletado(false);
        }
      }
    } catch (err) {
      console.log("Error verificando sesion:", err);
      setUsuario(null);
      setOnboardingCompletado(false);
    } finally {
      setCargandoInicial(false);
    }
  };

  // -------------------------------------------------------------------------
  // Iniciar sesion
  // -------------------------------------------------------------------------
  const login = async (correo, contrasena) => {
    try {
      setError(null);
      setCargando(true);

      const data = await authAPI.login(correo, contrasena);
      const user = data.usuario || data.user;

      // IMPORTANTE: consultar onboarding ANTES de setUsuario
      // Asi cuando el navigator se monte, ya tendra el valor correcto
      const completado = await consultarOnboarding();
      setOnboardingCompletado(completado);
      setUsuario(user);

      return { success: true, data };
    } catch (err) {
      setError(err.message);
      if (err.data?.requiresVerification) {
        return {
          success: false,
          requiresVerification: true,
          correo: err.data?.correo,
          error: err.message,
        };
      }
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  };

  // -------------------------------------------------------------------------
  // Registrarse
  // -------------------------------------------------------------------------
  const register = async (datos) => {
    try {
      setError(null);
      setCargando(true);

      const data = await authAPI.register(datos);
      return { success: true, requiresVerification: true, correo: data.correo };
    } catch (err) {
      const mensajeError =
        err.message || "Error inesperado al registrar la cuenta.";
      setError(mensajeError);
      return { success: false, error: mensajeError };
    } finally {
      setCargando(false);
    }
  };

  // Completar login despues de verificar correo
  // Cuenta recien verificada -> nunca ha hecho el test -> mostrar onboarding
  const loginConDatos = (user) => {
    setOnboardingCompletado(false);
    setUsuario(user);
  };

  // -------------------------------------------------------------------------
  // Cerrar sesion
  // -------------------------------------------------------------------------
  const logout = async () => {
    try {
      await authAPI.logout();
      setOnboardingCompletado(false);
      setUsuario(null);
    } catch (err) {
      console.error("Error al cerrar sesion:", err);
    }
  };

  // -------------------------------------------------------------------------
  // Actualizar datos del usuario
  // -------------------------------------------------------------------------
  const actualizarUsuario = async () => {
    try {
      const data = await authAPI.getProfile();
      const user = data.usuario || data.user;
      setUsuario(user);
      await AsyncStorage.setItem("usuario", JSON.stringify(user));
    } catch (err) {
      console.error("Error actualizando usuario:", err);
    }
  };

  // Marcar onboarding como completado (despues de hacer el test inicial)
  const marcarOnboardingCompletado = () => {
    setOnboardingCompletado(true);
  };

  const limpiarError = () => {
    setError(null);
  };

  const value = {
    usuario,
    cargando,
    cargandoInicial,
    error,
    estaLogueado: !!usuario,
    onboardingCompletado,
    login,
    loginConDatos,
    register,
    logout,
    actualizarUsuario,
    marcarOnboardingCompletado,
    limpiarError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK PARA USAR EL CONTEXTO
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }

  return context;
}

export default AuthContext;