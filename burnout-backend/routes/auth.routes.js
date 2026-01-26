//RUTAS DE AUTENTICACION
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

//POST /api/auth/login
//Iniciar sesión
router.post(
  "/login",
  [
    body("correo").isEmail().withMessage("Correo Incorrecto"),
    body("contrasena").notEmpty().withMessage("Contraseña requerida"),
  ],
  async (req, res) => {
    try {
      //Validar datos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos incorrectos",
          errors: errors.array(),
        });
      }

      const { correo, contrasena } = req.body;

      //Buscar usuario con datos de rol
      const usuario = await db.queryOne(
        `
        SELECT u.*,
          CASE
            WHEN u.rol = 'paciente' THEN p.id_paciente
            WHEN u.rol = 'psicologo' THEN ps.id_psicologo
            WHEN u.rol = 'administrador' THEN a.id_administrador
          END as role_id
          FROM usuario u
          LEFT JOIN paciente p ON u.id_usuario = p.id_usuario
          LEFT JOIN psicologo ps ON u.id_usuario = ps.id_usuario
          LEFT JOIN administrador a ON u.id_usuario = a.id_usuario
          WHERE u.correo = ? AND u.activo = TRUE
        `,
        [correo],
      );

      //¿Existe el usuario?
      if (!usuario) {
        return res.status(401).json({
          error: "Credenciales incorrectas",
          message: "El usuario o contraseña son incorrectos",
        });
      }

      //Verifica contraseña: compara la contraseña que ingresó con la de la BD
      const validPassword = await bcrypt.compare(
        contrasena,
        usuario.contrasena,
      );
      if (!validPassword) {
        return res.status(401).json({
          error: "Credenciales incorrectas",
          message: "El usuario o contraseña son incorrectos",
        });
      }

      //Genera token JWT
      const token = jwt.sign(
        {
          id: usuario.id_usuario,
          correo: usuario.correo,
          rol: usuario.rol,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      //Respuesta exitosa
      res.json({
        message: "Inicio de sesión exitoso",
        token,
        user: {
          id: usuario.id_usuario,
          roleId: usuario.role_id,
          nombre: usuario.nombre,
          paterno: usuario.paterno,
          materno: usuario.materno,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({
        error: "Error al iniciar sesión",
        message: error.message,
      });
    }
  },
);

//POST /api/auth/register
//Registrar nuevo paciente
//trim: remueve espacios en blanco al inicio y final del string
router.post(
  "/register",
  [
    body("nombre").trim().notEmpty().withMessage("Nombre requerido"),
    body("paterno").trim().notEmpty().withMessage("Apellido paterno requerido"),
    body("materno").optional().trim(),
    body("correo").isEmail().withMessage("Correo inválido"),
    body("contrasena")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe contener al menos 6 caracteres"),
    body("matricula").trim().notEmpty().withMessage("Matrícula requerida"),
  ],
  async (req, res) => {
    try {
      //Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos inválidos",
          errors: errors.array(),
        });
      }

      const { nombre, paterno, materno, correo, contrasena, matricula } =
        req.body;

      //¿Ya existe el correo?
      const existingUser = await db.queryOne(
        "SELECT id_usuario FROM usuario WHERE correo = ?",
        [correo],
      );

      if (existingUser) {
        return res.status(400).json({
          error: "Correo ya registrado",
          message: "Este correo ya está en uso",
        });
      }

      //Verificar si ya existe la matrícula
      const existingMatricula = await db.queryOne(
        "SELECT id_paciente FROM paciente WHERE matricula = ?",
        [matricula],
      );

      if (existingMatricula) {
        return res.status(400).json({
          error: "Matrícula ya registrada",
          message: "Esta matrícula ya está en uso",
        });
      }

      //Hash de la contraseña (10 rondas de bcrypt)
      const hashedPassword = await bcrypt.hash(contrasena, 10);

      //Transacción: Creamos el usuario y el paciente
      const result = await db.transaction(async (connection) => {
        //Insertar el usuario
        const [userResult] = await connection.query(
          "INSERT INTO usuario (nombre, paterno, materno, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)",
          [
            nombre,
            paterno,
            materno || null,
            correo,
            hashedPassword,
            "paciente",
          ],
        );

        const userId = userResult.insertId;

        //Insertar paciente
        const [pacienteResult] = await connection.query(
          "INSERT INTO paciente (id_usuario, matricula) VALUES (?, ?)",
          [userId, matricula],
        );

        return {
          userId,
          pacienteId: pacienteResult.insertId,
        };
      });

      //Generar token automáticamente después del registro
      const token = jwt.sign(
        {
          id: result.userId,
          correo: correo,
          rol: "paciente",
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      //Respuesta exitosa
      res.status(201).json({
        message: "Registro exitoso",
        token,
        user: {
          id: result.userId,
          roleId: result.pacienteId,
          nombre,
          paterno,
          materno,
          correo,
          rol: "paciente",
        },
      });
    } catch (error) {
      console.error("Error en registro:", error);
      res.status(500).json({
        error: "Error en registro",
        message: error.message,
      });
    }
  },
);

//GET /api/auth/me
//Obtener información del usuario actual (requiere autenticación)
router.get("/me", authenticate.required, async (req, res) => {
  try {
    //Buscar usuario con su información según rol
    const usuario = await db.queryOne(
      `
      SELECT 
          u.id_usuario, 
          u.nombre, 
          u.paterno, 
          u.materno, 
          u.correo, 
          u.rol,
          CASE 
              WHEN u.rol = 'paciente' THEN p.id_paciente
              WHEN u.rol = 'psicologo' THEN ps.id_psicologo
              WHEN u.rol = 'administrador' THEN a.id_administrador
          END as role_id,
          CASE 
              WHEN u.rol = 'paciente' THEN p.matricula
              WHEN u.rol = 'psicologo' THEN ps.cedula_profesional
              ELSE NULL
          END as identificador,
          CASE 
              WHEN u.rol = 'paciente' THEN p.tutorial_completado
              ELSE NULL
          END as tutorial_completado,
          CASE 
              WHEN u.rol = 'paciente' THEN p.test_olbi_inicial_completado
              ELSE NULL
          END as test_inicial_completado
      FROM usuario u
      LEFT JOIN paciente p ON u.id_usuario = p.id_usuario
      LEFT JOIN psicologo ps ON u.id_usuario = ps.id_usuario
      LEFT JOIN administrador a ON u.id_usuario = a.id_usuario
      WHERE u.id_usuario = ?
      `,
      [req.user.id],
    );

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json({
      user: usuario,
    });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    res.status(500).json({
      error: "Error obteniendo usuario",
      message: error.message,
    });
  }
});

//POST /api/auth/change-password
//Cambiar contraseña del usuario actual
router.post(
  "/change-password",
  authenticate.required,
  [
    body("contrasenaActual")
      .notEmpty()
      .withMessage("Contraseña actual requerida"),
    body("contrasenaNueva")
      .isLength({ min: 6 })
      .withMessage("La nueva contraseña debe tener al menos 6 caracteres"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos inválidos",
          errors: errors.array(),
        });
      }

      const { contrasenaActual, contrasenaNueva } = req.body;

      //Obtener contraseña actual de la BD
      const usuario = await db.queryOne(
        "SELECT contrasena FROM usuario WHERE id_usuario = ?",
        [req.user.id],
      );

      //Verificar contraseña actual
      const validPassword = await bcrypt.compare(
        contrasenaActual,
        usuario.contrasena,
      );

      //¿Coinciden?
      if (!validPassword) {
        return res.status(401).json({
          error: "Contraseña incorrecta",
          message: "La contraseña actual no es correcta",
        });
      }

      //Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(contrasenaNueva, 10);

      //Actualizar la contraseña en la BD
      await db.query("UPDATE usuario SET contrasena = ? WHERE id_usuario = ?", [
        hashedPassword,
        req.user.id,
      ]);

      res.json({
        message: "Contraseña actualizada exitosamente",
      });
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      res.status(500).json({
        error: "Error cambiando contraseña",
        message: error.message,
      });
    }
  },
);

//POST /api/auth/logout
//Cerrar sesión (el logout real se hace en frontend eliminando el token)
router.post("/logout", authenticate.required, (req, res) => {
  res.json({
    message: "Sesión cerrada exitosamente",
  });
});

module.exports = router;
