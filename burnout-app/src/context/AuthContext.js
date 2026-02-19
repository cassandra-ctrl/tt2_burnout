// CONTEXTO DE AUTENTICACIÓN
// src/context/AuthContext.js
// Maneja el estado global del usuario logueado

// createContext: Crea un "espacio compartido". es una nube accesible desde cualquier pantalla de tu app sin tener que pasar datos manualmente de una a otra.

//useState: Es la memoria local.

//useEffect: Permite ejecutar código automáticamente cuando algo sucede

//useContext: gancho para leer los datos de esa nube compartida.* *///

import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";
// Crear el contexto
const AuthContext = createContext({});

// PROVEEDOR DEL CONTEXTO
export function AuthProvider({ children }) {
  //usuario: ¿Quién está usando la app?
  const [usuario, setUsuario] = useState(null);
  //cargando: ¿Estamos esperando al servidor?
  const [cargando, setCargando] = useState(true);
  //error: ¿Pasó algo malo?
  const [error, setError] = useState(null);

  //Verificamos si ya se inicio sesion antes
  useEffect(() => {
    verificarSesion();
  }, []);

  //seguimos este patron:
  // 1. Limpiar errores viejos
  // 2. Bloquear (espera al servidor)
  // 3. Llamar: usa authAPI para hablar con el servidor
  // 4. Guarda los datos
  // 5. desbloquea: (estado de espera)

  const verificarSesion = async () => {
    try {
      //bloquea la pantalla un momento para "pensar" y no mostrarte la pantalla de Login ni la de Home incorrectamente.
      setCargando(true);
      //vemos si ya existe un token creado
      const token = await AsyncStorage.getItem("token");

      if (token) {
        // Verificar que el token siga válido
        const data = await authAPI.getProfile();
        setUsuario(data.usuario);
      }
    } catch (err) {
      // Token inválido o expirado
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("usuario");
      setUsuario(null);
    } finally {
      //Garantiza que la app no se quede "cargando" infinitamente.
      setCargando(false);
    }
  };

  //....................
  // Iniciar sesión
  const login = async (correo, contrasena) => {
    try {
      setError(null);
      setCargando(true);
      const data = await authAPI.login(correo, contrasena);
      setUsuario(data.usuario);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  };

  //....................
  // Registrarse
  const register = async (datos) => {
    try {
      setError(null);
      setCargando(true);
      const data = await authAPI.register(datos);
      setUsuario(data.usuario);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  };

  //.........................
  //cerrar sesion
  const logout = async () => {
    try {
      await authAPI.logout();
      setUsuario(null);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  //........................
  // Actualizar datos del usuario
  const actualizarUsuario = async () => {
    try {
      const data = await authAPI.getProfile();
      setUsuario(data.usuario);
      await AsyncStorage.setItem("usuario", JSON.stringify(data.usuario));
    } catch (err) {
      console.error("Error actualizando usuario:", err);
    }
  };

  //..............................
  // Limpiar error
  const limpiarError = () => {
    setError(null);
  };

  //.....................
  // Valores del contexto

  const value = {
    usuario,
    cargando,
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

// HOOK PARA USAR EL CONTEXTO

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }

  return context;
}

export default AuthContext;
