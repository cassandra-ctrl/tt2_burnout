// RUTAS DE PROGRESO DEL PACIENTE
// routes/progreso.routes.js

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

// GET /api/progreso/paciente/:id
// Se obtiene el progreso del paciente de forma general

router.get("/paciente/:id", authenticate.required, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificamos que el paciente solo pueda ver su propio progreso
    if (req.user.rol === "paciente") {
      const paciente = await db.queryOne(
        `SELECT id_paciente FROM paciente WHERE id_usuario = ?`,
        [req.user.id],
      );

      if (!paciente || paciente.id_paciente !== parseInt(id)) {
        return res.status(403).json({
          error: "No tienes permiso para ver el progreso",
        });
      }
    }

    // Obtenemos la info del paciente
    const paciente = await db.queryOne(
      `
      SELECT 
        p.id_paciente,
        u.nombre,
        u.paterno,
        u.materno,
        p.matricula,
        p.tutorial_completado,
        p.test_olbi_inicial_completado,
        p.test_olbi_final_completado
      FROM paciente p
      JOIN usuario u ON p.id_usuario = u.id_usuario
      WHERE p.id_paciente = ?
      `,
      [id],
    );

    if (!paciente) {
      return res.status(404).json({
        error: "Paciente no encontrado",
      });
    }

    // PROGRESO POR MÓDULO
    const progresoModulo = await db.query(
      `
      SELECT
        m.id_modulo,
        m.titulo,
        m.orden,
        COALESCE(pm.progreso, 0) as porcentaje_completado,
        COALESCE(pm.estado, 'bloqueado') as estado,
        COUNT(DISTINCT a.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN pa.estado = 'completada' THEN pa.id_actividad END) as actividades_completadas
      FROM modulo m
      LEFT JOIN actividad a ON m.id_modulo = a.id_modulo
      LEFT JOIN progreso_actividad pa ON a.id_actividad = pa.id_actividad
        AND pa.id_paciente = ?
      LEFT JOIN progreso_modulo pm ON m.id_modulo = pm.id_modulo
        AND pm.id_paciente = ?
      GROUP BY m.id_modulo, pm.progreso, pm.estado
      ORDER BY m.orden ASC
      `,
      [id, id],
    );

    // Total de actividades completadas
    const totalActividades = await db.queryOne(
      `
      SELECT
        COUNT(*) as total_actividades,
        (SELECT COUNT(*) FROM progreso_actividad WHERE id_paciente = ? AND estado = 'completada') as completadas
      FROM actividad
      `,
      [id],
    );

    // Obtenemos el porcentaje en actividades completadas
    const porcentajeTotal =
      totalActividades.total_actividades > 0
        ? Math.round(
            (totalActividades.completadas /
              totalActividades.total_actividades) *
              100,
          )
        : 0;

    // Obtenemos la última actividad completada
    const ultimaActividad = await db.queryOne(
      `
      SELECT 
        a.titulo,
        m.titulo as modulo_titulo,
        pa.fecha_terminada as fecha_completado
      FROM progreso_actividad pa
      JOIN actividad a ON pa.id_actividad = a.id_actividad
      JOIN modulo m ON a.id_modulo = m.id_modulo
      WHERE pa.id_paciente = ? AND pa.estado = 'completada'
      ORDER BY pa.fecha_terminada DESC
      LIMIT 1
      `,
      [id],
    );

    res.json({
      paciente: {
        id: paciente.id_paciente,
        nombre:
          `${paciente.nombre} ${paciente.paterno} ${paciente.materno || ""}`.trim(),
        matricula: paciente.matricula,
        tutorial_completado: paciente.tutorial_completado,
        test_inicial_completado: paciente.test_olbi_inicial_completado,
        test_final_completado: paciente.test_olbi_final_completado,
      },
      progreso_general: {
        total_actividades: totalActividades.total_actividades,
        actividades_completadas: totalActividades.completadas,
        porcentaje_completado: porcentajeTotal,
        ultima_actividad: ultimaActividad,
      },
      progreso_por_modulo: progresoModulo,
    });
  } catch (error) {
    console.error("Error obteniendo progreso:", error);
    res.status(500).json({
      error: "Error obteniendo progreso",
      message: error.message,
    });
  }
});

// GET /api/progreso/modulo/:moduloId/paciente/:pacienteId
// Obtenemos el progreso de un módulo específico

router.get(
  "/modulo/:moduloId/paciente/:pacienteId",
  authenticate.required,
  async (req, res) => {
    try {
      const { moduloId, pacienteId } = req.params;

      // Verificamos los permisos
      if (req.user.rol === "paciente") {
        const paciente = await db.queryOne(
          "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
          [req.user.id],
        );

        if (!paciente || paciente.id_paciente !== parseInt(pacienteId)) {
          return res.status(403).json({
            error: "No tienes acceso para ver el progreso de este paciente",
          });
        }
      }

      // Obtenemos la información del módulo
      const modulo = await db.queryOne(
        `SELECT id_modulo, titulo, descripcion FROM modulo WHERE id_modulo = ?`,
        [moduloId],
      );

      if (!modulo) {
        return res.status(404).json({
          error: "Módulo no encontrado",
        });
      }

      // Actividades del módulo con progreso
      const actividades = await db.query(
        `
        SELECT 
          a.id_actividad,
          a.titulo,
          a.orden,
          a.duracion_minutos,
          ca.nombre_tipo as tipo_actividad,
          COALESCE(pa.estado, 'pendiente') as estado,
          pa.fecha_inicio,
          pa.fecha_terminada as fecha_completado
        FROM actividad a
        LEFT JOIN cat_actividad ca ON a.id_tipo = ca.id_tipo
        LEFT JOIN progreso_actividad pa ON a.id_actividad = pa.id_actividad
          AND pa.id_paciente = ?
        WHERE a.id_modulo = ?
        ORDER BY a.orden ASC
        `,
        [pacienteId, moduloId],
      );

      const totalActividades = actividades.length;
      const completadas = actividades.filter(
        (a) => a.estado === "completada",
      ).length;
      const porcentaje =
        totalActividades > 0
          ? Math.round((completadas / totalActividades) * 100)
          : 0;

      res.json({
        modulo,
        progreso: {
          total_actividades: totalActividades,
          completadas,
          porcentaje_completado: porcentaje,
        },
        actividades,
      });
    } catch (error) {
      console.error("Error obteniendo progreso del módulo:", error);
      res.status(500).json({
        error: "Error obteniendo progreso del módulo",
        message: error.message,
      });
    }
  },
);

// POST /api/progreso/actividad/completar
// Marcar una actividad como completada

router.post(
  "/actividad/completar",
  authenticate.paciente,
  [body("id_actividad").isInt().withMessage("ID de actividad no válido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos inválidos",
          errors: errors.array(),
        });
      }

      const { id_actividad } = req.body;

      // Obtenemos el id_paciente
      const paciente = await db.queryOne(
        "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
        [req.user.id],
      );

      if (!paciente) {
        return res.status(404).json({
          error: "Paciente no encontrado",
        });
      }

      // ¿Existe la actividad?
      const actividad = await db.queryOne(
        "SELECT id_actividad, id_modulo, titulo FROM actividad WHERE id_actividad = ?",
        [id_actividad],
      );

      if (!actividad) {
        return res.status(404).json({
          error: "Actividad no encontrada",
        });
      }

      // Verificar si ya existe un registro de progreso
      const progresoExistente = await db.queryOne(
        "SELECT id_paciente, id_actividad, estado FROM progreso_actividad WHERE id_paciente = ? AND id_actividad = ?",
        [paciente.id_paciente, id_actividad],
      );

      if (progresoExistente) {
        // Actualizar registro existente
        await db.query(
          `
          UPDATE progreso_actividad
          SET estado = 'completada',
              fecha_terminada = NOW()
          WHERE id_paciente = ? AND id_actividad = ?
          `,
          [paciente.id_paciente, id_actividad],
        );
      } else {
        // Crear nuevo registro
        await db.query(
          `
          INSERT INTO progreso_actividad
          (id_paciente, id_actividad, fecha_inicio, fecha_terminada, estado)
          VALUES (?, ?, NOW(), NOW(), 'completada')
          `,
          [paciente.id_paciente, id_actividad],
        );
      }

      // Actualizamos el progreso del módulo
      await actualizarProgresoModulo(paciente.id_paciente, actividad.id_modulo);

      res.json({
        message: "Actividad marcada como completada",
        actividad: {
          id: actividad.id_actividad,
          titulo: actividad.titulo,
        },
      });
    } catch (error) {
      console.error("Error completando actividad:", error);
      res.status(500).json({
        error: "Error completando actividad",
        message: error.message,
      });
    }
  },
);

// POST /api/progreso/actividad/iniciar
// Marcar una actividad como iniciada

router.post(
  "/actividad/iniciar",
  authenticate.paciente,
  [body("id_actividad").isInt().withMessage("ID de actividad no válido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos inválidos",
          errors: errors.array(),
        });
      }

      const { id_actividad } = req.body;

      const paciente = await db.queryOne(
        "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
        [req.user.id],
      );

      if (!paciente) {
        return res.status(404).json({
          error: "Paciente no encontrado",
        });
      }

      const actividad = await db.queryOne(
        "SELECT id_actividad, id_modulo, titulo FROM actividad WHERE id_actividad = ?",
        [id_actividad],
      );

      if (!actividad) {
        return res.status(404).json({
          error: "Actividad no encontrada",
        });
      }

      // Verificar si ya existe
      const progresoExistente = await db.queryOne(
        "SELECT id_paciente FROM progreso_actividad WHERE id_paciente = ? AND id_actividad = ?",
        [paciente.id_paciente, id_actividad],
      );

      if (!progresoExistente) {
        await db.query(
          `
          INSERT INTO progreso_actividad
          (id_paciente, id_actividad, fecha_inicio, estado)
          VALUES (?, ?, NOW(), 'en_progreso')
          `,
          [paciente.id_paciente, id_actividad],
        );
      }

      res.json({
        message: "Actividad iniciada",
        actividad: {
          id: actividad.id_actividad,
          titulo: actividad.titulo,
        },
      });
    } catch (error) {
      console.error("Error iniciando actividad:", error);
      res.status(500).json({
        error: "Error iniciando actividad",
        message: error.message,
      });
    }
  },
);

// Función auxiliar: Actualizar el progreso del módulo

async function actualizarProgresoModulo(idPaciente, idModulo) {
  try {
    // Calculamos el progreso del módulo
    const progreso = await db.queryOne(
      `
      SELECT 
        COUNT(DISTINCT a.id_actividad) as total_actividades,
        COUNT(DISTINCT CASE WHEN pa.estado = 'completada' THEN pa.id_actividad END) as completadas
      FROM actividad a
      LEFT JOIN progreso_actividad pa ON a.id_actividad = pa.id_actividad
        AND pa.id_paciente = ?
      WHERE a.id_modulo = ?
      `,
      [idPaciente, idModulo],
    );

    const porcentaje =
      progreso.total_actividades > 0
        ? Math.round((progreso.completadas / progreso.total_actividades) * 100)
        : 0;

    // Determinar estado del módulo (usa 'completado' porque es progreso_modulo)
    let estado;
    if (porcentaje >= 100) {
      estado = "completado";
    } else if (porcentaje > 0) {
      estado = "en_progreso";
    } else {
      estado = "bloqueado";
    }

    // Verificar si existe registro de progreso del módulo
    const progresoModuloExistente = await db.queryOne(
      "SELECT id_paciente FROM progreso_modulo WHERE id_paciente = ? AND id_modulo = ?",
      [idPaciente, idModulo],
    );

    if (progresoModuloExistente) {
      if (estado === "completado") {
        await db.query(
          `
          UPDATE progreso_modulo
          SET progreso = ?,
              estado = ?,
              fecha_fin = NOW()
          WHERE id_paciente = ? AND id_modulo = ?
          `,
          [porcentaje, estado, idPaciente, idModulo],
        );
      } else {
        await db.query(
          `
          UPDATE progreso_modulo
          SET progreso = ?,
              estado = ?
          WHERE id_paciente = ? AND id_modulo = ?
          `,
          [porcentaje, estado, idPaciente, idModulo],
        );
      }
    } else {
      await db.query(
        `
        INSERT INTO progreso_modulo 
        (id_paciente, id_modulo, fecha_inicio, estado, progreso)
        VALUES (?, ?, NOW(), ?, ?)
        `,
        [idPaciente, idModulo, estado, porcentaje],
      );
    }
  } catch (error) {
    console.error("Error actualizando progreso del módulo:", error);
    throw error;
  }
}

module.exports = router;
