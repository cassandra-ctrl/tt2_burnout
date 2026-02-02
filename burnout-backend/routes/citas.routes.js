const express = require("express");
const router = express.Router();
const { body, validationResult, query, param } = require("express-validator");
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

//Roles y permisos:
// Psicologo: Crea, modifica, cancela y ve todas sus citas
//Paciente : solo puede ver sus propias citas

//Nos aseguramos que el administrador no pueda ver las
//citas entre el psicologo y paciente

const noAdmin = (req, res, next) => {
  if (req.user.rol === "administrador") {
    return res.status(403).json({
      error: "Acceso denegado",
      message:
        "Las citas solo pueden mostrarse a los psicólogos y los pacientes",
    });
  }
  next();
};

//GET /api/citas/categorias
//Obtenemos el catalogo de tipos de cita disponible (dropdown)

router.get("/categorias", authenticate.required, noAdmin, async (req, res) => {
  try {
    const categorias = await db.query(
      `
            SELECT 
                id_categoria,
                tipo_cita,
                descripcion
            FROM cat_cita
            ORDER BY id_categoria ASC
            `,
    );

    //Obtenemos el numero de categorias posibles y la busqueda en la base de datos
    res.json({
      total: categorias.length,
      categorias,
    });
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    res.status(500).json({
      error: "Error obteniendo categorías",
      message: error.message,
    });
  }
});

//GET /api/citas
//Lista las citas de acuerdo al usuario
//El psicologo ve todas sus citas, al igual que el paciente

//Se filtra por estado, fecha
router.get("/", authenticate.required, noAdmin, async (req, res) => {
  try {
    const { estado, fecha, desde, hasta } = req.query;

    //
    let query = `
        SELECT
            c.id_cita,
            c.fecha_cita,
            c.hora_cita,
            c.estado,
            c.observaciones,
            c.created_at,
            cat.id_categoria,
            cat.tipo_categoria,
            p.id_paciente,
            CONCAT(up.nombre,' ',up.paterno,' ',COALESCE(up.materno, '' )) as paciente_nombre, ps.id_psicologo
            CONCAT(ups.nombre, ' ',ups.paterno,' ',COALESCE(ups.materno, '')) as psicologo_nombre
        FROM citas c
        JOIN cat_cita cat ON c.id_categoria = cat.id_categoria
        JOIN paciente p ON c.id_paciente = p.id_paciente
        JOIN usuario up ON p.id_usuario = up.id_usuario
        JOIN psicologo ps ON c.id_psicologo = ps.id_psicologo
        JOIN usuario ups ON ps.id_usuario = ups.id_usuario
        WHERE 1=1
        `;

    const params = [];

    //Filtramos segun el rol (psicologo o paciente)

    if (req.user.rol === "psicologo") {
      //busca que exista en la bd
      const psicologo = await db.queryOne(
        "SELECT id_psicologo FROM psicologo WHERE id_usuario=?",
        [req.user.id],
      );

      //no existe?
      if (!psicologo) {
        return res.status(404).json({ error: "Psicólogo no encontrado" });
      }
      //modificamos la variable query y mandamos el id del psicologo
      query += " AND c.id_psicologo =?";
      //Muestra las citas de ese psicologo en especifico
      params.push(psicologo.id_psicologo);
    } else if (req.user.role === "paciente") {
      //el paciente solo ve sus propias citas
      const paciente = await db.queryOne(
        "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
        [req.user.id],
      );

      if (!paciente) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      //muestra las citas que tiene el paciente
      query += "AND c.id_paciente =?";
      params.push(paciente.id_paciente);
    }

    //FILTROS

    //filtramos por estado (programada, completada, cancelada, inasistencia)

    if (estado) {
      query += "AND c.estado = ?";
      params.push(estado);
    }

    //fecha exacta
    if (fecha) {
      query += " AND c.fecha_cita = ?";
      params.push(fecha);
    }

    //rango de fechas (desde)
    if (desde) {
      query += " AND c.fecha_cita>=? ";
      params.push(desde);
    }

    //(hasta)
    if (hasta) {
      query += " AND c.fecha_cita<=?";
      params.push(hasta);
    }

    //ordenamos por fecha y hora (las mas proximas primero)
    query += " ORDER BY c.fecha_cita ASC, c.hora_cita ASC";

    const citas = await db.query(query, param);

    res.json({
      total: citas.length,
      citas,
    });
  } catch (error) {
    console.error("Error obteniendo citas: ", error);
    res.status(500).json({
      error: "Error obteniendo citas",
      message: error.message,
    });
  }
});

//GET /api/citas/mis-citas
//Atajo para que los pacientes vean sus citas de manera simple
router.get("/mis-citas", authenticate.paciente, async (req, res) => {
  try {
    const paciente = await db.queryOne(
      "SELECT id_paciente FROM paciente WHERE id_usuario =?",
      [req.user.id],
    );

    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const citas = await db.query(
      `
        SELECT 
            c.id_cita,
            c.fecha_cita,
            c.hora_cita,
            c.estado,
            c.observaciones,
            cat.tipo_cita,
            CONCAT(ups.nombre, ' ', ups.paterno) as psicologo_nombre
        FROM citas c
        JOIN cat_cita cat ON c.id_categoria = cat.id_categoria
        JOIN psicologo ps ON c.id_psicologo = ps.id_psicologo
        JOIN usuario ups ON ps.id_usuario = ups.id_usuario
        WHERE c.id_paciente = ?
        ORDER BY c.fecha_cita ASC, c.hora_cita ASC
        `,
      [paciente.id_paciente],
    );

    //Separar citas proximas y pasadas

    //Obtenemos la fecha y la convertimos en texto estandar
    const hoy = new Date().toISOString().split("T")[0];
    const citasProximas = citas.filter(
      (c) => c.fecha_cita >= hoy && c.estado === "programada",
    );

    const citasPasadas = citas.filter(
      (c) => c.fecha_cita < hoy || c.estado != "programada",
    );

    res.json({
      total: citas.length,
      proximas: citasProximas,
      historial: citasPasadas,
    });
  } catch (error) {
    console.error("Error obteniendo mis citas:", error);
    res.status(500).json({
      error: "Error obteniendo citas",
      message: error.message,
    });
  }
});

//GET /api/citas/agenda
//Obtenemos la agenda del psicologo

router.get("/agenda", authenticate.psicologo, async (req, res) => {
  try {
    const { fecha } = req.query;

    //sino se especifica la fecha, usar la de hoy por defeccto
    const fechaConsulta = fecha || new Date().toISOString.split("T")[0];

    //Obtenemos el id del psicologo
    const psicologo = await db.queryOne(
      "SELECT id_psicologo FROM psicologo WHERE id_usuario =?",
      [req.user.id],
    );

    if (!psicologo) {
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    }

    //Obtener citas del dia

    const citas = await db.query(
      `
        SELECT
            c.id_cita,
            c.hora_cita,
            c.estado,
            c.observaciones,
            cat.tipo_cita,
            p.id_paciente
            CONCAT(up.nombre, ' ',up.paterno) as paciente_nombre, up.correo as paciente_correo
        FROM citas c
        JOIN cat_cita cat ON c.id_categoria = cat.id_categoria
        JOIN paciente p ON c.id_paciente = p.id_paciente
        JOIN usuario up ON p.id_usuario = up.id_usuario
        WHERE c.id_psicologo =? AND c.fecha_cita =?
        ORDER BY c.hora_cita ASC
        `,
      [psicologo.id_psicologo, fechaConsulta],
    );

    res.json({
      fecha: fechaConsulta,
      total_citas: citas.length,
      citas,
    });
  } catch (error) {
    console.error("Error obteniendo agenda", error);
    res.status(500).json({
      error: "Error obteniendo agenda",
      message: error.message,
    });
  }
});

// GET /api/citas/:id
//Obtener el detalle de una cita en especial
router.get("/:id", authenticate.required, noAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    //Obtenemos la cita con toda la info
    const cita = await db.queryOne(
      `
            SELECT
                c.id_cita,
                c.fecha_cita,
                c.hora_cita,
                c.estado,
                c.observaciones,
                c.created_at,
                cat.id_categoria,
                cat.tipo_cita,
                cat.descripcion as tipo_descripcion,
                p.id_paciente,
                p.matricula
                CONCAT(up.nombre,' ',up.materno, ' ', COALESCE(up.materno,'')) as paciente_nombre, up.correo as paciente_correo,
                ps.id_psicologo,
                ps.cedula_profesional,
                CONCAT(ups.nombre, ' ',ups.paterno,' ',COALESCE(ups.materno,'')) as psicologo_nombre,
                ups.correo as psicologo_correo
            FROM citas c
            JOIN cat_cita cat ON c.id_categoria = cat.id_categoria
            JOIN paciente p ON c.id_paciente = p.id_paciente
            JOIN usuario up ON p.id_usuario = up.id_usuario
            JOIN psicologo ps ON c.id_psicologo = ps.id_psicologo
            JOIN usuario ups ON ps.id_usuario = ups.id_usuario
            WHERE c.id_cita = ?
            `,
      [id],
    );

    if (!cita) {
      return res.status(404).json({
        error: "Cita no encontrada",
      });
    }

    //VERIFICAMOS EL ROL
    if (req.user.rol === "psicologo") {
      const psicologo = await db.queryOne(
        "SELECT id_psicologo FROM psicolog WHERE id_usuario =?",
        [req.user.id],
      );

      if (cita.id_psicologo !== psicologo.id_psicologo) {
        return res.status(403).json({
          error: "No tienes permiso para ver esta cita",
        });
      }
    } else if (req.user.rol === "paciente") {
      const paciente = await db.queryOne(
        "SELECT id_paciente FROM paciente WHERE id_usuario =?",
        [req.user.id],
      );

      if (cita.id_paciente !== paciente.id_paciente) {
        return res.status(403).json({
          error: "No tienes acceso a ver esta cita",
        });
      }
    }

    res.json({ cita });
  } catch (error) {
    console.error("Error obteniendo cita:", error);
    res.status(500).json({
      error: "Error obteniendo cita",
      message: error.message,
    });
  }
});

//POST /api/citas
//Para que el psicologo cree una nueva cita
//Body requerido:
//id_paciente
//fecha_cita
//hora_cita
//id_categoria
//observaciones

router.post(
  "/",
  authenticate.psicologo,
  [
    body("id__paciente").isInt().withMessage("ID de paciente inválido"),
    body("fecha_cita")
      .isDate()
      .withMessage("Fecha incorrecta, usar formado YYYY-MM-DD"),
    body("hora_cita")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Hora inválida, usar formato HH:MM"),
    body("id_categoria").isInt().withMessage("Categoría de cita inválida"),
    body("observaciones").optional().trim(),
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

      const {
        id_paciente,
        fecha_cita,
        hora_cita,
        id_categoria,
        observaciones,
      } = req.body;

      //Obtenemos el id del psicologo para crear una cita
      const psicologo = await db.queryOne(
        "SELECT id_psicologo FROM psicologo WHERE id_usuario =?",
        [req.user.id],
      );

      if (!psicologo) {
        return res.status(404).json({ error: "Psicólogo no encontrado" });
      }

      //Validacion de que el paciente exista
      const paciente = await db.queryOne(
        `SELECT p.id_paciente,u.nombre,u.paterno
        FROM paciente p
        JOIN usuario u ON p.id_usuario = u.id_usuario
        WHERE p.id_paciente =?
        `,
        [id_paciente],
      );

      if (!paciente) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      //Validamos que exista la categoria
      const categoria = await db.queryOne(
        "SELECT id_categoria, tipo_cita FROM cat_cita WHERE id_categoria =?",
        [id_categoria],
      );

      if (!categoria) {
        return res
          .status(404)
          .json({ error: "Categoría de cita no encontrada" });
      }

      //Validamos que la fecha escugida no sea una pasada
      const hoy = new Date().toISOString().split("T")[0];
      if (fecha_cita < hoy) {
        return res.status(400).json({
          error: "Fecha inválida",
          message: "No se pueden crear citas en fechas pasadas",
        });
      }

      //Validamos que no haya un traslapo de citas para el mismo psicologo
      const citaExistente = await db.queryOne(
        `
        SELECT id_cita FROM citas
        WHERE id_psicologo =?
        AND fecha_cita =?
        AND hora_cita =?
        AND estado = 'programada'
        `,
        [psicologo.id_psicologo, fecha_cita, hora_cita],
      );

      if (citaExistente) {
        return res.status(400).json({
          error: "Horario no disponible",
          message: "Ya tienes una cita programada en ese horario",
        });
      }

      //Sino hay una cita en ese mismo horario
      //CREAMOS LA CITA

      const result = await db.query(
        `
        INSERT INTO citas (id_psicologo, id_paciente, fecha_cita,hora_cita,id_categoria, observaciones, estado) VALUES (?,?,?,?,?,?,'programada'),
        `,
        [
          psicologo.id_psicologo,
          id_paciente,
          fecha_cita,
          hora_cita,
          id_categoria,
          observaciones || null,
        ],
      );

      res.status(201).json({
        message: "Cita creada exitosamente",
        cita: {
          id_cita: result.insertId,
          fecha_cita,
          hora_cita,
          tipo_cita: categoria.tipo_cita,
          paciente: `${paciente.nombre} ${paciente.paterno}`,
          estado: "programada",
        },
      });
    } catch (error) {
      console.error("Error creando cita:", error);
      res.status(500).json({
        error: "Error creando cita",
        message: error.message,
      });
    }
  },
);

//PUT /api/citas/:id
//MODIFICAR CITA EXISTENTE
//Solo se modifican citas que esten en estado de programada

router.put(
  "/:id",
  authenticate.psicologo,
  [
    body("fecha_cita").optional().isDate.withMessage("Fecha inválida"),
    body("hora_cita")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Hora inválida"),
    body("id_categoria").optional.isInt().withMessage("Categoria inválida"),
    body("observaciones").optional().trim(),
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

      const { id } = req.params;
      const { fecha_cita, hora_cita, id_categoria, observaciones } = req.body;

      //Obtenemos el psicologo
      const psicologo = await db.queryOne(
        "SELECT id_psicologo FROM psicologo WHERE id_usuario = ?",
        [req.user.id],
      );

      if (!psicologo) {
        return res.status(404).json({ error: "Psicólogo no encontrado" });
      }

      // Verificar que la cita existe y pertenece al psicólogo
      const cita = await db.queryOne(
        "SELECT id_cita, id_psicologo, estado FROM citas WHERE id_cita = ?",
        [id],
      );

      if (!cita) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }

      if (cita.id_psicologo !== psicologo.id_psicologo) {
        return res.status(403).json({
          error: "No tienes permiso para modificar esta cita",
        });
      }

      if (cita.estado !== "programada") {
        return res.status(400).json({
          error: "No se puede modificar",
          message: "Solo se pueden modificar citas con estado 'programada'",
        });
      }

      //Construimos la actualizacion de forma dinamica (solo campos necesarios en la bd)

      const updates = [];
      const params = [];

      if (fecha_cita) {
        //Validamos que no sea una fecha pasada
        const hoy = new Date().toISOString().split("T")[0];
        if (fecha_cita < hoy) {
          return res.status(400).json({
            error: "Fecha inválida",
            message: "No se pueden programar citas en fechas pasadas",
          });
        }

        //sino es una fecha pasada
        updates.push("fecha_cita =?");
        params.push(fecha_cita);
      }

      if (hora_cita) {
        updates.push("hora_cita =?");
        params.push(hora_cita);
      }

      if (id_categoria) {
        //validamos que exista la categoria
        const categoria = await db.queryOne(
          "SELECT id_categoria FROM cat_cita WHERE id_categoria = ?",
          [id_categoria],
        );
        if (!categoria) {
          return res.status(404).json({ error: "Categoría no encontrada" });
        }
        updates.push("id_categoria = ?");
        params.push(id_categoria);
      }
    } catch {}
  },
);
