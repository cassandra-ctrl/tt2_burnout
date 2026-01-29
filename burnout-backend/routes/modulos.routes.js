//RUTAS DE MODULOS Y DE ACTIVIDADES
// routes/modulos.routes.js

const express = require("express");
const router = express.Router();
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

///GET /api/modulos
//Lista todos los módulos con información de bloqueo para pacientes
router.get("/", authenticate.required, async (req, res) => {
  try {
    // Si es paciente, obtener su id_paciente para calcular progreso
    let idPaciente = null;
    if (req.user.rol === "paciente") {
      const paciente = await db.queryOne(
        "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
        [req.user.id],
      );
      idPaciente = paciente ? paciente.id_paciente : null;
    }

    // Obtener módulos con información de progreso
    const modulos = await db.query(
      `
      SELECT 
        m.id_modulo,
        m.titulo,
        m.descripcion,
        m.orden,
        m.imagen_url,
        COUNT(a.id_actividad) as total_actividades,
        COALESCE(pm.estado, 'bloqueado') as estado,
        COALESCE(pm.progreso, 0) as porcentaje_completado
      FROM modulo m
      LEFT JOIN actividad a ON m.id_modulo = a.id_modulo
      LEFT JOIN progreso_modulo pm ON m.id_modulo = pm.id_modulo 
        AND pm.id_paciente = ?
      GROUP BY m.id_modulo
      ORDER BY m.orden ASC
    `,
      [idPaciente],
    );

    // Aplicar lógica de bloqueo solo para pacientes
    let modulosConBloqueo = modulos;

    if (req.user.rol === "paciente" && idPaciente) {
      modulosConBloqueo = modulos.map((modulo, index) => {
        if (index === 0) {
          // Primer módulo siempre desbloqueado
          console.log(
            `Módulo ${modulo.orden} (${modulo.titulo}): DESBLOQUEADO (es el primero)`,
          );
          return { ...modulo, bloqueado: false };
        } else {
          // Módulo se desbloquea si el anterior tiene 100% de progreso
          const moduloAnterior = modulos[index - 1];
          console.log(
            `Módulo anterior ${moduloAnterior.orden}: progreso = ${moduloAnterior.porcentaje_completado}`,
          );
          const estaDesbloqueado = moduloAnterior.porcentaje_completado >= 100;
          console.log(
            `Módulo ${modulo.orden} (${modulo.titulo}): ${estaDesbloqueado ? "DESBLOQUEADO" : "BLOQUEADO"}`,
          );
          return { ...modulo, bloqueado: !estaDesbloqueado };
        }
      });
    } else {
      // Admin y psicólogo ven todos desbloqueados
      modulosConBloqueo = modulos.map((m) => ({ ...m, bloqueado: false }));
    }

    res.json({
      total: modulosConBloqueo.length,
      modulos: modulosConBloqueo,
    });
  } catch (error) {
    console.error("Error obteniendo módulos:", error);
    res.status(500).json({
      error: "Error obteniendo módulos",
      message: error.message,
    });
  }
});

//GET /api/modulos/categoria/lista
router.get("/categorias/lista", authenticate.required, async (req, res) => {
  try {
    const categorias = await db.query(`
            SELECT 
                id_tipo,
                nombre_tipo
            FROM cat_actividad
            ORDER BY nombre_tipo ASC
        `);

    res.json({
      total: categorias.length,
      categorias,
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "Error obteniendo categorías", message: error.message });
  }
});

//GET /api/modulos/:id
//Obtiene el detalle de un modulo, cuantas actividades estan ligadas a cada uno de ellos
router.get("/:id", authenticate.required, async (req, res) => {
  try {
    const { id } = req.params;

    const modulo = await db.queryOne(
      `
                SELECT 
                    m.id_modulo,
                    m.titulo,
                    m.descripcion,
                    m.orden,
                    m.imagen_url,
                    COUNT(a.id_actividad) as total_actividades
                FROM modulo m
                LEFT JOIN actividad a ON m.id_modulo = a.id_modulo
                WHERE m.id_modulo =?
                GROUP BY m.id_modulo
                    
            `,
      [req.params.id],
    );

    if (!modulo) {
      return res.status(404).json({ error: "Modulo no encontrado" });
    }

    res.json({ modulo });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Error al obtener el modulo",
      message: "Error al encontrar modulo",
    });
  }
});

//GET /api/modulos/:id/actividades
//Obtiene las actividades de un módulo (con validación de bloqueo)
router.get("/:id/actividades", authenticate.required, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el módulo existe
    const modulo = await db.queryOne(
      "SELECT id_modulo, titulo, orden FROM modulo WHERE id_modulo = ?",
      [id],
    );

    if (!modulo) {
      return res.status(404).json({ error: "Módulo no encontrado" });
    }

    // Si es paciente, verificar que tenga acceso al módulo
    if (req.user.rol === "paciente") {
      const paciente = await db.queryOne(
        "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
        [req.user.id],
      );

      if (!paciente) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      // Si NO es el primer módulo (orden > 1), verificar que el anterior esté completado
      if (modulo.orden > 1) {
        const moduloAnterior = await db.queryOne(
          `
          SELECT pm.estado 
          FROM modulo m
          LEFT JOIN progreso_modulo pm ON m.id_modulo = pm.id_modulo 
            AND pm.id_paciente = ?
          WHERE m.orden = ?
        `,
          [paciente.id_paciente, modulo.orden - 1],
        );

        // Si el módulo anterior no existe en progreso_modulo o no está completado
        if (!moduloAnterior || moduloAnterior.estado !== "completado") {
          return res.status(403).json({
            error: "Módulo bloqueado",
            message: "Debes completar el módulo anterior primero",
            modulo_actual: modulo.orden,
            modulo_requerido: modulo.orden - 1,
          });
        }
      }
    }

    // Si pasó las validaciones, obtener las actividades
    const actividades = await db.query(
      `
      SELECT 
        a.id_actividad,
        a.titulo,
        a.contenido,
        a.duracion_minutos,
        a.orden,
        ca.id_tipo,
        ca.nombre_tipo as tipo_actividad
      FROM actividad a
      LEFT JOIN cat_actividad ca ON a.id_tipo = ca.id_tipo 
      WHERE a.id_modulo = ? 
      ORDER BY a.orden ASC
    `,
      [id],
    );

    res.json({
      modulo: {
        id: modulo.id_modulo,
        titulo: modulo.titulo,
        orden: modulo.orden,
      },
      total_actividades: actividades.length,
      actividades,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Error obteniendo las actividades",
      message: error.message,
    });
  }
});

///GET /api/modulos/:moduloId/actividades/:actividadId
//Ver el detalle de una actividad (con validación de bloqueo)
router.get(
  "/:moduloId/actividades/:actividadId",
  authenticate.required,
  async (req, res) => {
    try {
      const { moduloId, actividadId } = req.params;

      // Obtener la actividad
      const actividad = await db.queryOne(
        `
        SELECT
          a.id_actividad,
          a.id_modulo,
          a.titulo,
          a.contenido,
          a.duracion_minutos,
          a.orden,
          ca.id_tipo,
          ca.nombre_tipo as tipo_actividad,
          m.titulo as modulo_titulo,
          m.orden as modulo_orden
        FROM actividad a
        JOIN modulo m ON a.id_modulo = m.id_modulo
        LEFT JOIN cat_actividad ca ON a.id_tipo = ca.id_tipo 
        WHERE a.id_modulo = ? AND a.id_actividad = ?
        `,
        [moduloId, actividadId],
      );

      if (!actividad) {
        return res.status(404).json({ error: "Actividad no encontrada" });
      }

      // Si es paciente, verificar acceso al módulo
      if (req.user.rol === "paciente") {
        const paciente = await db.queryOne(
          "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
          [req.user.id],
        );

        if (!paciente) {
          return res.status(404).json({ error: "Paciente no encontrado" });
        }

        // Verificar que el módulo esté desbloqueado
        if (actividad.modulo_orden > 1) {
          const moduloAnterior = await db.queryOne(
            `
            SELECT pm.estado 
            FROM modulo m
            LEFT JOIN progreso_modulo pm ON m.id_modulo = pm.id_modulo 
              AND pm.id_paciente = ?
            WHERE m.orden = ?
          `,
            [paciente.id_paciente, actividad.modulo_orden - 1],
          );

          if (!moduloAnterior || moduloAnterior.estado !== "completado") {
            return res.status(403).json({
              error: "Módulo bloqueado",
              message: "Debes completar el módulo anterior primero",
            });
          }
        }
      }

      res.json({ actividad });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({
        error: "Error al obtener la actividad",
        message: error.message,
      });
    }
  },
);

module.exports = router;
