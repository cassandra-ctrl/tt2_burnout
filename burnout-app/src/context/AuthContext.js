// ============================================================================
// CONTEXTO DE AUTENTICACIÓN
// src/context/AuthContext.js
//
// Maneja el estado global del usuario logueado
// ============================================================================

import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

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

  // -------------------------------------------------------------------------
  // Verificar sesión al iniciar la app
  // -------------------------------------------------------------------------
  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        // Verificar que el token siga válido
        try {
          const data = await authAPI.getProfile();
          const user = data.usuario || data.user;
          setUsuario(user);
        } catch (err) {
          // Token inválido o expirado
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("usuario");
          setUsuario(null);
        }
      }
    } catch (err) {
      console.log("Error verificando sesión:", err);
      setUsuario(null);
    } finally {
      setCargandoInicial(false);
    }
  };

  // -------------------------------------------------------------------------
  // Iniciar sesión
  // -------------------------------------------------------------------------
  const login = async (correo, contrasena) => {
    try {
      setError(null);
      setCargando(true);

      const data = await authAPI.login(correo, contrasena);
      const user = data.usuario || data.user;
      setUsuario(user);

      return { success: true, data };
    } catch (err) {
      setError(err.message);
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

      const user = data.usuario || data.user;
      setUsuario(user);

      return { success: true, data };
    } catch (err) {
      // err.message es el texto que extrajimos en api.js
      // err.data contiene el JSON completo del backend por si lo necesitas
      const mensajeError =
        err.message || "Error inesperado al registrar la cuenta.";

      setError(mensajeError);

      // Retornamos el objeto exacto que espera tu RegisterScreen
      return { success: false, error: mensajeError };
    } finally {
      setCargando(false);
    }
  };

  // -------------------------------------------------------------------------
  // Cerrar sesión
  // -------------------------------------------------------------------------
  const logout = async () => {
    try {
      await authAPI.logout();
      setUsuario(null);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
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

  // -------------------------------------------------------------------------
  // Limpiar error
  // -------------------------------------------------------------------------
  const limpiarError = () => {
    setError(null);
  };

  // -------------------------------------------------------------------------
  // Valores del contexto
  // -------------------------------------------------------------------------
  const value = {
    usuario,
    cargando,
    cargandoInicial,
    error,
    estaLogueado: !!usuario,
    login,
    register,
    logout,
    actualizarUsuario,
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
