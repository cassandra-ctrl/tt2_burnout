// NAVEGACIÓN PRINCIPAL

import React from "react";
//gestiona el estado de la navegacion
import { NavigationContainer } from "@react-navigation/native";
//permite la navegacion tipo pila
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// hook para autentificacion
import { useAuth } from "../context/AuthContext";
import { Loading } from "../components";

// Pantallas
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

const Stack = createNativeStackNavigator();

//define las pantallas disponibles para un usuario que no ha iniciado sesion
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registro" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

//pantalla que se mostrara cuando haya iniciado sesion
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { cargando, estaLogueado } = useAuth();

  // estado de carga
  if (cargando) {
    return <Loading message="Cargando..." />;
  }
  //decision de navegacion
  return (
    <NavigationContainer>
      {estaLogueado ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
