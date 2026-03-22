// NAVEGACIÓN PRINCIPAL
// src/navigation/AppNavigator.js
//
// Flujo de onboarding:
// Tutorial → Consentimiento → Aviso Privacidad → Test OLBI → Empecemos → Home

import React from "react";
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

// Pantallas de onboarding/tutorial
import TutorialScreen from "../screens/TutorialScreen";
import ConsentimientoScreen from "../screens/ConsentimientoScreen";
import AvisoPrivacidadScreen from "../screens/Avisoprivacidadscreen";
import TestOLBIScreen from "../screens/Testolbiscreen";
import ResultadoTestScreen from "../screens/ResultadoTestScreen";
import EmpecemosScreen from "../screens/EmpecemosScreen";

// Pantallas principales

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// STACK DE AUTENTICACIÓN (Login, Registro, Recuperar contraseña)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registro" component={RegisterScreen} />
      <Stack.Screen
        name="RecuperarPassword"
        component={RecuperarPasswordScreen}
      />
      <Stack.Screen name="VerificarCodigo" component={VerificarCodigoScreen} />
      <Stack.Screen name="NuevaContrasena" component={NuevaContrasenaScreen} />
    </Stack.Navigator>
  );
}

// TABS PRINCIPALES (Home, Módulos, Perfil)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Inicio") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Módulos") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "Yo") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Módulos" component={HomeScreen} />
      <Tab.Screen name="Yo" component={HomeScreen} />
    </Tab.Navigator>
  );
}

// STACK PRINCIPAL (Cuando el usuario está logueado)
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Onboarding / Tutorial */}
      <Stack.Screen name="Tutorial" component={TutorialScreen} />
      <Stack.Screen
        name="ConsentimientoInformado"
        component={ConsentimientoScreen}
      />
      <Stack.Screen name="AvisoPrivacidad" component={AvisoPrivacidadScreen} />
      <Stack.Screen name="TestOLBI" component={TestOLBIScreen} />
      <Stack.Screen name="ResultadoTest" component={ResultadoTestScreen} />
      <Stack.Screen name="Empecemos" component={EmpecemosScreen} />

      {/* App principal */}
      <Stack.Screen name="MainTabs" component={MainTabs} />
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
