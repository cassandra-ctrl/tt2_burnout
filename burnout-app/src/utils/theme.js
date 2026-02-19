//COLORES Y TEMA DE LA APP
export const colors = {
  //COLORES PRINCIPALES
  primary: "#232946",
  primaryDark: "#C0D6DF",
  primaryLight: "#B8C1EC",

  //COLORES SECUNDARIOS
  secundary: "#757bc8",
  secundaryDark: "#576A8F",
  secundaryLight: "#fae0e4",

  //COLORES DE ESTADO
  // Colores de estado
  success: "#4c956c", // Verde
  warning: "#f4a259", // Naranja
  error: "#c1121f", // Rojo
  info: "#0992C2",

  //NIVELES DE BURNOUT
  burnoutBajo: "#4c956c", // Verde
  burnoutMedio: "#f4a259", // Naranja
  burnoutAlto: "#c1121f",

  //CATEGORIAS DE LOGROS
  bronce: "#957025",
  plata: "#8A9597",
  oro: "#a87b05",
  diamante: "#B9F2FF",

  //NEUTROS
  white: "#FFFFFF",
  black: "#000000",
  gray: "#9E9E9E",
  grayLight: "#EAE0E4",
  grayDark: "#616161",
  background: "#B8C1EC",
  //TEXTO

  text: "#000000",
  textSecondary: "#757575",
  textLight: "EAE0E4",
};

export const fonts = {
  regular: "System",
  bold: "System",
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 999,
};

//estilos comunes para reutilizar
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerPadding: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  shadow: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};

export default {
  colors,
  fonts,
  spacing,
  borderRadius,
  commonStyles,
};
