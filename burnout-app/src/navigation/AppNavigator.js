// NAVEGACIÓN PRINCIPAL
// src/navigation/AppNavigator.js
//
// Flujo de onboarding:
// Tutorial → Consentimiento → Aviso Privacidad → Test OLBI → Empecemos → Home

import React from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Loading } from "../components";
import { colors } from "../utils/theme";

// Pantallas de autenticación
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RecuperarPasswordScreen from "../screens/RecuperarPasswordScreen";
import VerificarCodigoScreen from "../screens/VerificarCodigoScreen";
import NuevaContrasenaScreen from "../screens/NuevaContrasenaScreen";
import VerificacionCorreoScreen from "../screens/VerificacionCorreoScreen";

// Pantallas de onboarding/tutorial
import TutorialScreen from "../screens/TutorialScreen";
import ConsentimientoScreen from "../screens/ConsentimientoScreen";
import AvisoPrivacidadScreen from "../screens/Avisoprivacidadscreen";
import TestOLBIScreen from "../screens/Testolbiscreen";
import ResultadoTestScreen from "../screens/ResultadoTestScreen";
import EmpecemosScreen from "../screens/EmpecemosScreen";

// Pantallas principales
import HomeScreen from "../screens/HomeScreen";
import ModulosScreen from "../screens/ModulosScreen";
import DetalleModuloScreen from "../screens/DetalleModuloScreen";
import ActividadScreen from "../screens/ActividadScreen";
import DiarioScreen from "../screens/DiarioScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder temporal para pantallas de fase 3, 4 y 5
function PlaceholderScreen({ route }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#B8C1EC" }}>
      <Text style={{ fontSize: 18, color: "#1E3A5F", fontWeight: "bold" }}>
        {route.name} — Próximamente
      </Text>
    </View>
  );
}

// STACK DE AUTENTICACIÓN (Login, Registro, Recuperar contraseña)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registro" component={RegisterScreen} />
      <Stack.Screen name="RecuperarPassword" component={RecuperarPasswordScreen} />
      <Stack.Screen name="VerificarCodigo" component={VerificarCodigoScreen} />
      <Stack.Screen name="NuevaContrasena" component={NuevaContrasenaScreen} />
      <Stack.Screen name="VerificacionCorreo" component={VerificacionCorreoScreen} />
    </Stack.Navigator>
  );
}

// TABS PRINCIPALES (Inicio, Módulos, Diario, Perfil)
function MainTabs() {
  const ICONS = {
    Inicio:   ["home",         "home-outline"],
    Módulos:  ["library",      "library-outline"],
    Diario:   ["journal",      "journal-outline"],
    Perfil:   ["person-circle","person-circle-outline"],
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = ICONS[route.name] || ["ellipse", "ellipse-outline"];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#1E3A5F",
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          paddingTop: 5,
          height: 80,
        },
      })}
    >
      <Tab.Screen name="Inicio"   component={HomeScreen} />
      <Tab.Screen name="Módulos"  component={ModulosScreen} />
      <Tab.Screen name="Diario"   component={DiarioScreen} />
      <Tab.Screen name="Perfil"   component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

// STACK PRINCIPAL (Cuando el usuario está logueado)
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Onboarding / Tutorial */}
      <Stack.Screen name="Tutorial" component={TutorialScreen} />
      <Stack.Screen name="ConsentimientoInformado" component={ConsentimientoScreen} />
      <Stack.Screen name="AvisoPrivacidad" component={AvisoPrivacidadScreen} />
      <Stack.Screen name="TestOLBI" component={TestOLBIScreen} />
      <Stack.Screen name="ResultadoTest" component={ResultadoTestScreen} />
      <Stack.Screen name="Empecemos" component={EmpecemosScreen} />

      {/* App principal */}
      <Stack.Screen name="MainTabs"      component={MainTabs} />
      <Stack.Screen name="DetalleModulo" component={DetalleModuloScreen} />
      <Stack.Screen name="Actividad"     component={ActividadScreen} />
    </Stack.Navigator>
  );
}

// NAVEGADOR PRINCIPAL

export default function AppNavigator() {
  const { cargandoInicial, estaLogueado } = useAuth();

  // Mostrar loading mientras verifica sesión
  if (cargandoInicial) {
    return <Loading message="Cargando..." />;
  }

  return (
    <NavigationContainer>
      {estaLogueado ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
