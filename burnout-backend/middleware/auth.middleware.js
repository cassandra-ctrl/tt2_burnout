// MIDDELWARE DE AUTENTIFICACION JWT

const jwt = require("jsonwebtoken");
const { db } = require("../config/database");

//Verifica token jwt y carga informacion del usuario

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Acceso denegado",
        message: "No se proporcionó token de autenticación",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await db.queryOne(
      "SELECT id_usuario, correo, rol, activo FROM usuario WHERE id_usuario = ?",
      [decoded.id],
    );

    if (!usuario) {
      return res.status(401).json({
        error: "Acceso denegado",
        message: "Usuario no encontrado",
      });
    }

    if (!usuario.activo) {
      return res.status(401).json({
        error: "Acceso denegado",
        message: "Usuario inactivo",
      });
    }

    req.user = {
      id: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
        message: "Por favor inicia sesión nuevamente",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token inválido",
        message: "Token de autenticación inválido",
      });
    }

    console.error("Error en autenticación:", error);
    res.status(500).json({
      error: "Error de autenticación",
      message: "Error al verificar token",
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    //verifica que tenga el token verificado
    if (!req.user) {
      return res.status(401).json({
        error: "No autenticado",
        message: "Iniciar sesión primero",
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: `Se requiere rol: ${roles.join(" o ")}`,
        tuRol: req.user.rol,
      });
    }
    next();
  };
};

//Verifica que sea el admin
const sameUserOrAdmin = async (req, res, next) => {
  //verificamos el token de forma manual
  await verifyToken(req, res, () => {
    //busca el id que intenta hacer sesion, lo compara
    const userId = parseInt(req.params.id || req.params.userId);
    if (req.user.id === userId || req.user.rol === "administrador") {
      return next();
    }

    return res.status(403).json({
      error: "Acceso denegado",
      message: "No tienes permiso para acceder a este recurso",
    });
  });
};

const authenticate = {
  //verifica que este autenticado
  required: verifyToken,

  //verifica que sea el admin
  admin: [verifyToken, requireRole("administrador")],

  //verifica que sea el psicologo
  psicologo: [verifyToken, requireRole("psicologo")],

  //verifica que sea paciente
  paciente: [verifyToken, requireRole("paciente")],

  //verifica que sea psioclogo o administrador
  staff: [verifyToken, requireRole("administrador", "psicologo")],

  sameUserOrAdmin: sameUserOrAdmin,
};

module.exports = authenticate;
