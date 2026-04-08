// RUTAS DE REFLEXIONES POR ACTIVIDAD
// routes/reflexiones.routes.js

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

// POST /api/reflexiones
// Guardar o actualizar la reflexión de una actividad
router.post(
  "/",
  authenticate.paciente,
  [
    body("id_actividad").isInt({ min: 1 }).withMessage("ID de actividad inválido"),
    body("contenido").trim().notEmpty().withMessage("La reflexión no puede estar vacía"),
  ],
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

      const { id_actividad, contenido } = req.body;

      // Verificar que la actividad existe
      const actividad = await db.queryOne(
        "SELECT id_actividad FROM actividad WHERE id_actividad = ?",
        [id_actividad]
      );
      if (!actividad) {
        return res.status(404).json({ error: "Actividad no encontrada" });
      }

      // Verificar si ya existe una reflexión
      const reflexionExistente = await db.queryOne(
        "SELECT id_reflexion FROM reflexiones_paciente WHERE id_paciente = ? AND id_actividad = ?",
        [idPaciente, id_actividad]
      );

      if (reflexionExistente) {
        await db.query(
          "UPDATE reflexiones_paciente SET contenido = ? WHERE id_paciente = ? AND id_actividad = ?",
          [contenido, idPaciente, id_actividad]
        );
      } else {
        await db.query(
          "INSERT INTO reflexiones_paciente (id_paciente, id_actividad, contenido) VALUES (?, ?, ?)",
          [idPaciente, id_actividad, contenido]
        );
      }

      const reflexion = await db.queryOne(
        "SELECT * FROM reflexiones_paciente WHERE id_paciente = ? AND id_actividad = ?",
        [idPaciente, id_actividad]
      );

      res.json({
        message: reflexionExistente ? "Reflexión actualizada" : "Reflexión guardada",
        reflexion,
      });
    } catch (error) {
      console.error("Error guardando reflexión:", error);
      res.status(500).json({ error: "Error guardando reflexión", message: error.message });
    }
  }
);

// GET /api/reflexiones/actividad/:id
// Obtener la reflexión del paciente para una actividad específica
router.get("/actividad/:id", authenticate.paciente, async (req, res) => {
  try {
    const idPaciente = await getPacienteId(req.user.id);
    if (!idPaciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const reflexion = await db.queryOne(
      `SELECT r.id_reflexion, r.contenido, r.fecha, a.titulo as actividad_titulo
       FROM reflexiones_paciente r
       JOIN actividad a ON r.id_actividad = a.id_actividad
       WHERE r.id_paciente = ? AND r.id_actividad = ?`,
      [idPaciente, req.params.id]
    );

    res.json({ reflexion: reflexion || null });
  } catch (error) {
    console.error("Error obteniendo reflexión:", error);
    res.status(500).json({ error: "Error obteniendo reflexión", message: error.message });
  }
});

module.exports = router;
