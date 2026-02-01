///Creamos un nuevo correo gmail, el cual actura como servidor para poder enviar el codigo de recuperacion a todas las solicitudes de recuperacion de contrasena

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");
const {
  enviarCodigoRecuperacion,
  enviarConfirmacionCambio,
} = require("../services/mail.services");

//Generamos el codigo de 6 digitos
function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

//POST /api/recuperacion/solicitar
//solicitar el codigo de recuperacion
//verifica que el correo ingresado tenga una estructura correcta
router.post(
  "/solicitar",
  [body("correo").isEmail().normalizeEmail().withMessage("Correo incorrecto")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty) {
        return res.status(400).json({
          error: "Datos inválidos",
          errors: errors.array(),
        });
      }

      const { correo } = req.body;

      //Buscar usuario en la bd segun el correo que proporciono
      const usuario = await db.queryOne(
        "SELECT id_usuario, nombre, correo FROM usuario WHERE correo =? AND activo = TRUE",
        [correo],
      );

      //por seguridad no respondemos que el correo existe en la bd
      if (!usuario) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return res.json({
          message: "Si el correo existe, recibirás un código de recuperación",
        });
      }

      //invalidamos codigos anteriores que el usuario haya solicitado

      await db.query(
        "UPDATE token_recuperacion SET usado = TRUE WHERE id_usuario = ? AND usado = FALSE",
        [usuario.id_usuario],
      );

      //generamos nuevo codigo
      const codigo = generarCodigo();

      //fecha de expiracion (15 minutos)
      const fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000);

      //guardar codigo en la bd
      await db.query(
        `INSERT INTO token_recuperacion (id_usuario,codigo, fecha_expiracion) VALUES (?,?,?)`,
        [usuario.id_usuario, codigo, fechaExpiracion],
      );

      //enviamos el codigo al correo proporcionado
      try {
        await enviarCodigoRecuperacion(usuario.correo, usuario.nombre, codigo);
      } catch (mailError) {
        console.error("Error enviando correo:", mailError);
        return res.status(500).json({
          error: "Error enviando correo",
          message: "No se pudo enviar el correo. Intenta más tarde.",
        });
      }

      res.json({
        message: "Si el correo existe, recibiras un codigo de recuperacion",
        ...(process.env.NODE_ENV === "development" && { codigo_debug: codigo }),
      });
    } catch (error) {
      console.error("Error en solicitud de recuperación:", error);
      res.status(500).json({
        error: "Error procesando solicitud",
        message: error.message,
      });
    }
  },
);

//POST /api/recuperacion/verificar
// verificamos que el codigo de verificacion coincida con el enviado por correo al paciente

router.post(
  "/verificar",
  [
    body("correo").isEmail().normalizeEmail().withMessage("Correo incorrecto"),
    body("codigo")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("El código debe de tener 6 dígitos"),
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

      //guardamos el correo y el codigo en constante
      const { correo, codigo } = req.body;

      //buscamos el usuario
      const usuario = await db.queryOne(
        "SELECT id_usuario FROM usuario WHERE correo = ?",
        [correo],
      );

      //la consulta falla
      if (!usuario) {
        return res.status(400).json({
          error: "Código inválido",
          message: "El código es incorrecto o ha expirado",
        });
      }

      //buscamos el codigo en la bd segun el id del paciente y del token de expiracion
      //el token debe de estar en false = no usado y la fecha de expiracion no tiene que haber finalizado
      const tokenValido = await db.queryOne(
        `
        SELECT id_token, codigo, fecha_expiracion
        FROM token_recuperacion
        WHERE id_usuario = ?
            AND codigo = ?
            AND usado = FALSE
            AND fecha_expiracion >NOW()
            ORDER BY created_at DESC
        LIMIT 1
        `,
        [usuario.id_usuario, codigo],
      );

      //El token es invalido
      if (!tokenValido) {
        return res.status(400).json({
          error: "Código inválido",
          message: "El código es incorrecto o ha expirado",
        });
      }

      //La consulta fue un exito
      res.json({
        message: "Código verificado correctamente",
        valido: true,
      });
    } catch (error) {
      console.error("Error verificando código:", error);
      res.status(500).json({
        error: "Error verificando código",
        message: error.message,
      });
    }
  },
);

//POST /api/recuperacion/cambiar
// Cambiar contrasena con codigo verificado
router.post(
  "/cambiar",
  [
    body("correo")
      .isEmail()
      .normalizeEmail()
      .withMessage("Correo electrónico incorrecto"),
    body("codigo")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("El código debe contener 6 dígitos"),
    body("nueva_contrasena")
      .isLength({ min: 8 })
      .withMessage("La contraseña debe tener al menos 8 caracteres")
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage(
        "La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial",
      ),

    body("confirmar_contrasena")
      .custom((value, { req }) => value === req.body.nueva_contrasena)
      .withMessage("Las contraseñas no coinciden"),
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

      const { correo, codigo, nueva_contrasena } = req.body;

      //buscamos al usuario
      const usuario = await db.queryOne(
        "SELECT id_usuario, nombre, correo FROM usuario WHERE correo = ?",
        [correo],
      );

      if (!usuario) {
        return res.status(400).json({
          error: "Error",
          message: "No se pudo procesar la solicitud",
        });
      }

      // Verificar código válido
      const tokenValido = await db.queryOne(
        `SELECT id_token 
         FROM token_recuperacion 
         WHERE id_usuario = ? 
           AND codigo = ? 
           AND usado = FALSE 
           AND fecha_expiracion > NOW()
         ORDER BY created_at DESC 
         LIMIT 1`,
        [usuario.id_usuario, codigo],
      );

      if (!tokenValido) {
        return res.status(400).json({
          error: "Código inválido",
          message: "El código es incorrecto o ha expirado",
        });
      }

      //Hasheamos la nueva contrasena y la guardamos en la bd
      const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);

      //Actualizamos la contrasena y marcamos el token como usado
      await db.transaction(async (connection) => {
        //actualizamos la contrasena en la bd dependiendo del usuario
        await connection.query(
          "UPDATE usuario SET contrasena = ? WHERE id_usuario = ?",
          [hashedPassword, usuario.id_usuario],
        );

        // Marcar token como usado
        await connection.query(
          "UPDATE token_recuperacion SET usado = TRUE WHERE id_token = ?",
          [tokenValido.id_token],
        );

        // Invalidar todos los demás tokens del usuario
        await connection.query(
          "UPDATE token_recuperacion SET usado = TRUE WHERE id_usuario = ? AND id_token != ?",
          [usuario.id_usuario, tokenValido.id_token],
        );
      });

      // Enviar correo de confirmación
      try {
        await enviarConfirmacionCambio(usuario.correo, usuario.nombre);
      } catch (mailError) {
        console.error("Error enviando confirmación:", mailError);
      }

      res.json({
        message: "Contraseña actualizada exitosamente",
        success: true,
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

module.exports = router;
