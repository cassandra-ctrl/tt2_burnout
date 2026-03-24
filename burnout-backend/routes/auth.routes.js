//RUTAS DE AUTENTICACION
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");
const { enviarCodigoVerificacion } = require("../services/mail.services");

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
          END as role_id,
          u.correo_verificado
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

      // Verificar correo para pacientes
      if (usuario.rol === "paciente" && !usuario.correo_verificado) {
        return res.status(403).json({
          error: "Correo no verificado",
          message: "Debes verificar tu correo antes de iniciar sesión.",
          requiresVerification: true,
          correo: usuario.correo,
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
      .isLength({ min: 8 })
      .withMessage("La contraseña debe contener al menos 8 caracteres"),
    body("matricula")
      .trim()
      .notEmpty()
      .withMessage("Matrícula requerida")
      .matches(/^\d{10}$/)
      .withMessage("La matrícula debe contener 10 dígitos"),
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

      //Transacción: Creamos el usuario, el paciente y asignamos al psicólogo
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

        const pacienteId = pacienteResult.insertId;

        // ASIGNACIÓN AUTOMÁTICA AL PSICÓLOGO

        const [psicologoRows] = await connection.query(
          "SELECT id_psicologo FROM psicologo LIMIT 1",
        );

        if (psicologoRows.length > 0) {
          await connection.query(
            `INSERT INTO expediente (id_paciente, id_psicologo, fecha_apertura, estado)
       VALUES (?, ?, NOW(), 'activo')`,
            [pacienteId, psicologoRows[0].id_psicologo],
          );
        }

        return {
          userId,
          pacienteId,
        };
      });

      // Generar y guardar código de verificación
      const codigo = generarCodigo();
      const fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000);

      await db.query(
        "INSERT INTO token_verificacion_correo (id_usuario, codigo, fecha_expiracion) VALUES (?, ?, ?)",
        [result.userId, codigo, fechaExpiracion],
      );

      // Enviar correo de verificación
      try {
        await enviarCodigoVerificacion(correo, nombre, codigo);
      } catch (mailError) {
        console.error("Error enviando correo de verificación:", mailError);
        return res.status(500).json({
          error: "Error enviando correo",
          message: "No se pudo enviar el correo de verificación. Intenta más tarde.",
        });
      }

      res.status(201).json({
        message: "Registro exitoso. Verifica tu correo para continuar.",
        requiresVerification: true,
        correo,
        ...(process.env.NODE_ENV === "development" && { codigo_debug: codigo }),
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

//POST /api/auth/verificar-correo
//Verificar código enviado al correo tras el registro
router.post(
  "/verificar-correo",
  [
    body("correo").isEmail().normalizeEmail().withMessage("Correo inválido"),
    body("codigo")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("El código debe tener 6 dígitos"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Datos inválidos", errors: errors.array() });
      }

      const { correo, codigo } = req.body;

      const usuario = await db.queryOne(
        "SELECT id_usuario, nombre, paterno, materno, correo, rol FROM usuario WHERE correo = ? AND activo = TRUE",
        [correo],
      );

      if (!usuario) {
        return res.status(400).json({ error: "Código inválido", message: "El código es incorrecto o ha expirado" });
      }

      const tokenValido = await db.queryOne(
        `SELECT id_token FROM token_verificacion_correo
         WHERE id_usuario = ? AND codigo = ? AND usado = FALSE AND fecha_expiracion > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [usuario.id_usuario, codigo],
      );

      if (!tokenValido) {
        return res.status(400).json({ error: "Código inválido", message: "El código es incorrecto o ha expirado" });
      }

      // Marcar como verificado y el token como usado
      await db.transaction(async (connection) => {
        await connection.query(
          "UPDATE usuario SET correo_verificado = TRUE WHERE id_usuario = ?",
          [usuario.id_usuario],
        );
        await connection.query(
          "UPDATE token_verificacion_correo SET usado = TRUE WHERE id_token = ?",
          [tokenValido.id_token],
        );
      });

      // Obtener roleId del paciente
      const paciente = await db.queryOne(
        "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
        [usuario.id_usuario],
      );

      // Generar JWT ahora que está verificado
      const token = jwt.sign(
        { id: usuario.id_usuario, correo: usuario.correo, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      res.json({
        message: "Correo verificado exitosamente",
        token,
        user: {
          id: usuario.id_usuario,
          roleId: paciente?.id_paciente,
          nombre: usuario.nombre,
          paterno: usuario.paterno,
          materno: usuario.materno,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      });
    } catch (error) {
      console.error("Error verificando correo:", error);
      res.status(500).json({ error: "Error verificando correo", message: error.message });
    }
  },
);

//POST /api/auth/reenviar-verificacion
//Reenvía el código de verificación de correo
router.post(
  "/reenviar-verificacion",
  [body("correo").isEmail().normalizeEmail().withMessage("Correo inválido")],
  async (req, res) => {
    try {
      const { correo } = req.body;

      const usuario = await db.queryOne(
        "SELECT id_usuario, nombre, correo_verificado FROM usuario WHERE correo = ? AND activo = TRUE",
        [correo],
      );

      if (!usuario || usuario.correo_verificado) {
        return res.json({ message: "Si el correo existe y no está verificado, recibirás un nuevo código." });
      }

      // Invalidar códigos anteriores
      await db.query(
        "UPDATE token_verificacion_correo SET usado = TRUE WHERE id_usuario = ? AND usado = FALSE",
        [usuario.id_usuario],
      );

      const codigo = generarCodigo();
      const fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000);

      await db.query(
        "INSERT INTO token_verificacion_correo (id_usuario, codigo, fecha_expiracion) VALUES (?, ?, ?)",
        [usuario.id_usuario, codigo, fechaExpiracion],
      );

      try {
        await enviarCodigoVerificacion(correo, usuario.nombre, codigo);
      } catch (mailError) {
        return res.status(500).json({ error: "Error enviando correo", message: "No se pudo reenviar el código." });
      }

      res.json({
        message: "Código reenviado exitosamente.",
        ...(process.env.NODE_ENV === "development" && { codigo_debug: codigo }),
      });
    } catch (error) {
      console.error("Error reenviando verificación:", error);
      res.status(500).json({ error: "Error procesando solicitud", message: error.message });
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
