//RUTAS DE MODULOS Y DE ACTIVIDADES
// routes/modulos.routes.js

const express = require("express");
const router = express.Router();
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

//GET /api/modulos
router.get("/", authenticate.required, async (req, res) => {
  try {
    //obtenemos la informacion de cada uno de los modulos, los agrupamos y se ordenan de forma ascendente 1,2,3...
    const modulos = await db.query(`
            SELECT 
                m.id_modulo,
                m.titulo,
                m.descripcion,
                m.orden,
                m.imagen_url,
                COUNT(a.id_actividad) as total_actividades
            FROM modulo m
            LEFT JOIN actividad a ON m.id_modulo = a.id_modulo
            GROUP BY m.id_modulo
            ORDER BY m.orden ASC
        `);

    res.json({
      total: modulos.length,
      modulos,
    });
  } catch (error) {
    console.error("Error obteniendo módulos:", error);
    res.status(500).json({
      error: "Error obteniendo módulos",
      message: error.message,
    });
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

//GET /api/modulos/:id/actividades - Obtiene la informacion de las actividades de un modulo

router.get("/:id/actividades", authenticate.required, async (req, res) => {
  try {
    const modulo = await db.queryOne(
      //Obtenemos el id del modulo y el titulo
      "SELECT id_modulo, titulo FROM modulo WHERE id_modulo =?",
      [req.params.id],
    );

    if (!modulo) {
      return res.status(404).json({ error: "Modulo no encontrado" });
    }

    const actividades = await db.query(
      //Buscamos la informacion de las actividades segun el modulo que busquemos, orden de forma ascendente 1,2,3...
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
      [req.params.id],
    );

    //Si no hay errores, manda un JSON
    res.json({
      modulo: { id: modulo.id_modulo, titulo: modulo.titulo },
      total_actividades: actividades.length,
      actividades,
    });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ error: "Error obteniendo las actividades" });
  }
});

//GET /api/modulos/:moduloId/actividades/:actividadId
//Ver el detalle de una actividad
router.get(
  "/:moduloId/actividades/:actividadId",
  authenticate.required,
  async (req, res) => {
    try {
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
                m.titulo as modulo_titulo
            FROM actividad a
            JOIN modulo m ON a.id_modulo = m.id_modulo
            LEFT JOIN cat_actividad ca ON a.id_tipo = ca.id_tipo WHERE a.id_modulo = ? AND a.id_actividad =?
            `,
        [req.params.moduloId, req.params.actividadId],
      );

      if (!actividad) {
        return res.status(404).json({ error: "Actividad no encontrada" });
      }

      res.json({ actividad });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({
        error: "Error al obtener la actividad",
        message: "Error al obtener actividad",
      });
    }
  },
);

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

module.exports = router;
