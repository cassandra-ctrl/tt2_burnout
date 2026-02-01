const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

// GET /api/documentos/consentimiento
// Obtener la carta de consentimiento informado

router.get("/consentimiento", authenticate.required, async (req, res) => {
  try {
    //CARTA DE CONSENTIMIENTO
    const documento = await db.queryOne(
      `
                SELECT 
                    dl.id_documento,
                    dl.titulo,
                    dl.contenido,
                    cd.tipo
                FROM documento_legal dl
                JOIN cat_documento cd ON dl.id_cat_documento = cd.id_cat_documento
                WHERE cd.tipo = 'carta de consentimiento informado'
                LIMIT 1
            `,
    );

    if (!documento) {
      return res.status(404).json({
        error: "Documento no encontrado",
      });
    }
    res.json({ documento });
  } catch (error) {
    console.error("Error obteniendo consentimiento:", error);
    res.status(500).json({
      error: "Error obteniendo documento",
      message: error.message,
    });
  }
});

// GET /api/documentos/aviso-privacidad
// Obtener el aviso de privacidad

router.get("/aviso-privacidad", authenticate.required, async (req, res) => {
  try {
    const documento = await db.queryOne(
      `
            SELECT
                dl.id_documento,
                dl.titulo,
                dl.contenido,
                cd.tipo
            FROM documento_legal dl
            JOIN cat_documento cd ON dl.id_cat_documento = cd.id_cat_documento
            WHERE cd.tipo = 'aviso de privacidad'
            LIMIT 1
            `,
    );

    if (!documento) {
      return res.status(404).json({
        error: "Documento no encontrado",
      });
    }

    res.json({ documento });
  } catch (error) {
    console.error("Error obteniendo aviso de privacidad:", error);
    res.status(500).json({
      error: "Error obteniendo documento",
      message: error.message,
    });
  }
});

// GET /api/documentos/todos
// Obtener todos los documentos legales

router.get("/todos", authenticate.required, async (req, res) => {
  try {
    //listamos todos los documentos legales junto a su categoria, ordenandolos por esa categoriax
    const documentos = await db.query(
      `
            SELECT
                dl.id_documento,
                dl.titulo,
                dl.contenido,
                cd.id_cat_documento,
                cd.tipo
            FROM documento legal dl
            JOIN cat_documento cd ON dl.id_cat_documento = cd.id_cat_documento
            ORDER BY cd.id_cat_documento ASC
            `,
    );

    res.json({
      total: documentos.length,
      documentos,
    });
  } catch (error) {
    console.error("Error obteniendo documentos:", error);
    res.status(500).json({
      error: "Error obteniendo documentos",
      message: error.message,
    });
  }
});

// GET /api/documentos/estado
// Verificar qué documentos ha aceptado el paciente

router.get("/estado", authenticate.paciente, async (req, res) => {
  try {
    //obtenemos el id del paciende
    const paciente = await db.queryOne(
      "SELECT id_paciente FROM paciente WHERE id_usuario= ?",
      [req.user.id],
    );

    if (!paciente) {
      return res.status(404).json({
        error: "Paciente no encontrado",
      });
    }

    //Obtenemos los documentos que ha aceptado ese paciente
    const documentosAceptados = await db.query(
      `
        SELECT
            dl.id_documento,
            dl.titulo,
            cd.tipo,
            dp.fecha_aceptacion
        FROM documento_paciente dp
        JOIN documento_legal dl ON dp.id_documento = dl.id_documento
        JOIN cat_documento cd ON dl.id_cat_documento = cd.id_cat_documento
        WHERE dp.id_paciente = ?
        ORDER BY dp.fecha_aceptacion ASC
        `,
      [paciente.id_paciente],
    );

    //verificamos si falta algun documento que no ha aceptado el paciente
    const tiposAceptados = documentosAceptados.map((d) => d.tipo);
    const consentimientoAceptado = tiposAceptados.includes(
      "carta de consentimiento informado",
    );
    const avisoAceptado = tiposAceptados.includes("aviso de privacidad");

    res.json({
      documentos_completos: consentimientoAceptado && avisoAceptado,
      consentimiento_informado: {
        aceptado: consentimientoAceptado,
        fecha:
          documentosAceptados.find(
            (d) => d.tipo === "carta de consentimiento informado",
          )?.fecha_aceptacion || null,
      },
      aviso_privacidad: {
        aceptado: avisoAceptado,
        fecha:
          documentosAceptados.find((d) => d.tipo === "aviso de privacidad")
            ?.fecha_aceptacion || null,
      },
      documentos_aceptados: documentosAceptados,
    });
  } catch (error) {
    console.error("Error obteniendo estado de documentos:", error);
    res.status(500).json({
      error: "Error obteniendo estado",
      message: error.message,
    });
  }
});

// POST /api/documentos/aceptar
// Aceptar/firmar un documento legal
router.post(
  "/aceptar",
  authenticate.paciente,
  [body("id_documento").isInt().withMessage("ID de documento iválido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos inválidos",
          errors: errors.array(),
        });
      }

      const { id_documento } = req.body;

      //Obtener el id_paciente
      const paciente = await db.queryOne(
        "SELECT id_paciente FROM paciente WHERE id_usuario =?",
        [req.user.id],
      );

      if (!paciente) {
        return res.status(404).json({
          error: "Paciente no encontrado",
        });
      }

      //Verificamos que el documento exista (carta de consentimiento o el aviso de privacidad)
      const documento = await db.queryOne(
        `
        SELECT dl.id_documento, dl.titulo, cd.tipo
        FROM documento_legal dl
        JOIN cat_documento cd ON dl.id_cat_documento = cd.id_cat_documento
        WHERE dl.id_documento = ?
        `,
        [id_documento],
      );

      if (!documento) {
        return res.status(404).json({
          error: "Documento no encontrado",
        });
      }

      //Verifica si este paciente ya aceptó este documento específico anteriormente.
      const yaAceptado = await db.queryOne(
        "SELECT id_documento FROM documento_paciente WHERE id_paciente =? AND id_documento =?",
        [paciente.id_paciente, id_documento],
      );

      if (yaAceptado) {
        return res.status(400).json({
          error: "Documento ya aceptado",
          message: "Ya has aceptado este documento anteriormente",
        });
      }

      //Registramos la aceptacion del documento
      // Se inserta un nuevo registro en la tabla intermedia documento_paciente
      await db.query(
        `
      INSERT INTO documento_paciente (id_documento, id_paciente, fecha_aceptacion) VALUES(?,?, NOW())
      `,
        [id_documento, paciente.id_paciente],
      );

      //Verificamos que el paciente ya acepto los documentos
      const documentosAceptados = await db.query(
        "SELECT id_documento FROM documento_paciente WHERE id_paciente =? ",
        [paciente.id_paciente],
      );

      //calcula el total de documentos legales que hay en nuestra bd
      const totalDocumentos = await db.queryOne(
        "SELECT COUNT(*) as total FROM documento_legal",
      );

      const todosCompletos =
        documentosAceptados.length >= totalDocumentos.total;

      res.status(201).json({
        message: "Documento aceptado exitosamente",
        documento: {
          id: documento.id_documento,
          titulo: documento.titulo,
          tipo: documento.tipo,
        },
        documentos_completos: todosCompletos,
        fecha_aceptacion: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error aceptando documento:", error);
      res.status(500).json({
        error: "Error aceptando documento",
        message: error.message,
      });
    }
  },
);

//POST /api/documentos/aceptar-todos
//aceptar todos los documentos de una vez
router.post("/aceptar-todos", authenticate.paciente, async (req, res) => {
  try {
    const paciente = await db.queryOne(
      "SELECT id_paciente FROM paciente WHERE id_usuario =?",
      [req.user.id],
    );

    if (!paciente) {
      return res.status(404).json({
        error: "Paciente no encontrado",
      });
    }

    //Obtener todos los documentos
    const documentos = await db.query(
      `
      SELECT dl.id_documento, dl.titulo, cd.tipo
      FROM documento_legal dl
      JOIN cat_documento cd ON dl.id_cat_documento = cd.id_cat_documento
      `,
    );

    if (documentos.length === 0) {
      return res.status(404).json({
        error: "No hay documentos disponibles",
      });
    }

    // Verificar cuáles ya aceptó
    const yaAceptados = await db.query(
      "SELECT id_documento FROM documento_paciente WHERE id_paciente = ?",
      [paciente.id_paciente],
    );

    const idsAceptados = yaAceptados.map((d) => d.id_documento);

    // Filtrar los que faltan
    const documentosPendientes = documentos.filter(
      (d) => !idsAceptados.includes(d.id_documento),
    );

    if (documentosPendientes.length === 0) {
      return res.status(400).json({
        error: "Ya aceptaste todos los documentos",
        message: "No hay documentos pendientes por aceptar",
      });
    }

    // Insertar todos los pendientes
    await db.transaction(async (connection) => {
      for (const doc of documentosPendientes) {
        await connection.query(
          `
          INSERT INTO documento_paciente (id_documento, id_paciente, fecha_aceptacion)
          VALUES (?, ?, NOW())
          `,
          [doc.id_documento, paciente.id_paciente],
        );
      }
    });

    res.status(201).json({
      message: "Todos los documentos han sido aceptados",
      documentos_aceptados: documentosPendientes.map((d) => ({
        id: d.id_documento,
        titulo: d.titulo,
        tipo: d.tipo,
      })),
      fecha_aceptacion: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error aceptando documentos:", error);
    res.status(500).json({
      error: "Error aceptando documentos",
      message: error.message,
    });
  }
});

module.exports = router;
