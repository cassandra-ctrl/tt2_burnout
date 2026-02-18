//SERVIDOR PRINCIPAL

const express = require("express");

//decide que dominios tienen permitido hablar con el servidor
const cors = require("cors");
//configura cabeceras de seguridad
const helmet = require("helmet");
//registra en consola cada peticion
const morgan = require("morgan");
//comprime los datos antes de enviarlos
const compression = require("compression");
//lee el archivo .env para obtener contrasenas y puertos
require("dotenv").config();

require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

//MIDDLEWARES

//Headers HTTP seguros
app.use(helmet());

//CORS: Permitir peticiones del fronted
app.use(
  cors({
    //si existe la variable de entorno la divide por comas, sino, permire conexion a todo el mundo

    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
    credentials: true,
  }),
);

//El servidor lea formato JSON
app.use(express.json({ limit: "10mb" }));
//Permite leer datos enviados desde formularios HTML
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//Utiliza algoritmos para comprimir el tamano de los datos
app.use(compression());

//RUTAS DE HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    message: "Burnout App API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoint: {
      health: "/health",
      auth: "/api/auth/*",
      usuarios: "/api/usuarios/*",
      progreso: "/api/progreso/*",
      testOLBI: "/api/test-olbi/*",
      citas: "/api/citas/*",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

//RUTAS
//RUTAS
app.use("/api/test", require("./routes/test.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/modulos", require("./routes/modulos.routes"));
app.use("/api/progreso", require("./routes/progreso.routes"));
app.use("/api/test-olbi", require("./routes/test-olbi.routes"));
app.use("/api/recuperacion", require("./routes/recuperacion.routes"));
app.use("/api/documentos", require("./routes/documentos-legales.routes"));
app.use("/api/citas", require("./routes/citas.routes"));
app.use("/api/psicologo", require("./routes/psicologos.routes"));
app.use("/api/graficas", require("./routes/graficas.routes"));
app.use("/api/logros", require("./routes/logros.routes"));
app.use("/api/reportes", require("./routes/reportes.routes"));

//RUTA NO ENCONTRADA
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    //Le devuelve al usuario la ruta exacta que intentó usar
    path: req.path,
    //tipo de metodo
    method: req.method,
    message: "El endpoint no existe",
  });
});

//Manejador de errores global
app.use((err, req, res, next) => {
  console.error("Error: ", err.message);
  //archivos o lineas de codigo que provocaron el error
  console.error(err.stack);

  const statusCode = err.statusCode || 500;

  //error mostrado en produccion
  res.status(statusCode).json({
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
});

//INICIAR SERVIDOR
const server = app.listen(PORT, () => {
  console.log("Servidor iniciado");
  console.log(`Escuchando en el puerto: ${PORT}`);
  console.log(`URL:http://localhost:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
});

//SENALES DE TERMINACION
process.on("SIGTERM", () => {
  console.log("SIGTERM recibido, cerrando servidor...");
  //espera a que las peticiones que ya están en curso terminen
  server.close(() => {
    console.log("Servidor cerrado");
    process.exit(0);
  });
});

//cerrar servidor abruptamente
process.on("SIGINT", () => {
  console.log("\n SIGINT recibido. Cerrando servidor");
  server.close(() => {
    console.log("Servidor cerrado");
    process.exit(0);
  });
});

//Solo loguea el error.
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

//Loguea y apaga el servidor inmediatamente.
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

module.exports = app;
