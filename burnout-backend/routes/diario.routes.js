// RUTAS DEL DIARIO DE GRATITUD
// routes/diario.routes.js

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

// Helper: obtener id_paciente del usuario autenticado
async function getPacienteId(userId) {
  const paciente = await db.queryOne(
    "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
    [userId]
  );
  return paciente ? paciente.id_paciente : null;
}

// POST /api/diario
// Crear o actualizar la entrada del día actual
router.post(
  "/",
  authenticate.paciente,
  [body("contenido").trim().notEmpty().withMessage("El contenido es requerido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Datos inválidos", errors: errors.array() });
      }

      const idPaciente = await getPacienteId(req.user.id);
      if (!idPaciente) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      const { contenido } = req.body;
      const hoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Verificar si ya existe entrada para hoy
      const entradaExistente = await db.queryOne(
        "SELECT id_entrada FROM diario_paciente WHERE id_paciente = ? AND fecha = ?",
        [idPaciente, hoy]
      );

      if (entradaExistente) {
        // Actualizar entrada existente
        await db.query(
          "UPDATE diario_paciente SET contenido = ? WHERE id_paciente = ? AND fecha = ?",
          [contenido, idPaciente, hoy]
        );
      } else {
        // Crear nueva entrada
        await db.query(
          "INSERT INTO diario_paciente (id_paciente, contenido, fecha) VALUES (?, ?, ?)",
          [idPaciente, contenido, hoy]
        );
      }

      const entrada = await db.queryOne(
        "SELECT * FROM diario_paciente WHERE id_paciente = ? AND fecha = ?",
        [idPaciente, hoy]
      );

      res.json({
        message: entradaExistente ? "Entrada actualizada" : "Entrada guardada",
        entrada,
      });
    } catch (error) {
      console.error("Error guardando entrada del diario:", error);
      res.status(500).json({ error: "Error guardando entrada", message: error.message });
    }
  }
);

// GET /api/diario/hoy
// Obtener la entrada del día actual (si existe)
router.get("/hoy", authenticate.paciente, async (req, res) => {
  try {
    const idPaciente = await getPacienteId(req.user.id);
    if (!idPaciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const hoy = new Date().toISOString().split("T")[0];

    const entrada = await db.queryOne(
      "SELECT * FROM diario_paciente WHERE id_paciente = ? AND fecha = ?",
      [idPaciente, hoy]
    );

    res.json({ entrada: entrada || null, fecha: hoy });
  } catch (error) {
    console.error("Error obteniendo entrada de hoy:", error);
    res.status(500).json({ error: "Error obteniendo entrada", message: error.message });
  }
});

// GET /api/diario
// Obtener historial completo del diario (paginado)
router.get("/", authenticate.paciente, async (req, res) => {
  try {
    const idPaciente = await getPacienteId(req.user.id);
    if (!idPaciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const limite = parseInt(req.query.limite) || 20;
    const pagina = parseInt(req.query.pagina) || 1;
    const offset = (pagina - 1) * limite;

    const entradas = await db.query(
      `SELECT id_entrada, contenido, fecha, created_at, updated_at
       FROM diario_paciente
       WHERE id_paciente = ?
       ORDER BY fecha DESC
       LIMIT ? OFFSET ?`,
      [idPaciente, limite, offset]
    );

    const total = await db.queryOne(
      "SELECT COUNT(*) as total FROM diario_paciente WHERE id_paciente = ?",
      [idPaciente]
    );

    res.json({
      entradas,
      total: total.total,
      pagina,
      limite,
    });
  } catch (error) {
    console.error("Error obteniendo historial del diario:", error);
    res.status(500).json({ error: "Error obteniendo historial", message: error.message });
  }
});

module.exports = router;
