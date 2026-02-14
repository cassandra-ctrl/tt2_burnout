// RUTAS DE VISTA DE PACIENTES PARA PSICÓLOGO
// routes/psicologo.routes.js
//
// Operaciones que el psicólogo puede realizar para ver y monitorear
// a sus pacientes asignados.
// El psicólogo solo puede ver a sus pacientes asignados en la tabla expediente.

const express = require("express");
const router = express.Router();
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");


// FUNCIÓN AUXILIAR: Obtener id_psicologo del usuario autenticado
async function obtenerIdPsicologo(userId) {
  const psicologo = await db.queryOne(
    "SELECT id_psicologo FROM psicologo WHERE id_usuario = ?",
    [userId]
  );
  return psicologo ? psicologo.id_psicologo : null;
}

// FUNCIÓN AUXILIAR: Verificar que el paciente está asignado al psicólogo
async function verificarPacienteAsignado(idPsicologo, idPaciente) {
  const expediente = await db.queryOne(
    `SELECT id_paciente FROM expediente 
     WHERE id_psicologo = ? AND id_paciente = ?`,
    [idPsicologo, idPaciente]
  );
  return expediente !== null;
}

// ============================================================================
// GET /api/psicologo/dashboard
// Resumen general del psicólogo: estadísticas de sus pacientes
//
// Muestra:
// - Total de pacientes asignados
// - Pacientes por nivel de burnout
// - Citas programadas para hoy
// - Pacientes con actividad reciente
// ============================================================================

router.get("/dashboard", authenticate.psicologo, async (req, res) => {
  try {
    // Guardamos el id del psicólogo
    const idPsicologo = await obtenerIdPsicologo(req.user.id);

    // Validamos que se encuentre en la BD
    if (!idPsicologo) {
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    }

    // -------------------------------------------------------------------------
    // Total de pacientes asignados
    // -------------------------------------------------------------------------
    const totalPacientes = await db.queryOne(
      `SELECT COUNT(*) as total 
       FROM expediente 
       WHERE id_psicologo = ? AND estado = 'activo'`,
      [idPsicologo]
    );

    // -------------------------------------------------------------------------
    // Pacientes por nivel de burnout
    // Cuenta cuántas veces aparece cada nivel de burnout
    // Toma en cuenta el último test que hizo el paciente
    // -------------------------------------------------------------------------
    const pacientesPorNivel = await db.query(
      `SELECT
        pb.nivel_burnout,
        COUNT(*) as cantidad
       FROM expediente e
       JOIN paciente p ON e.id_paciente = p.id_paciente
       LEFT JOIN prueba_burnout pb ON p.id_paciente = pb.id_paciente
       WHERE e.id_psicologo = ? AND e.estado = 'activo'
         AND (pb.id_prueba IS NULL OR pb.id_prueba = (
           SELECT MAX(pb2.id_prueba) FROM prueba_burnout pb2
           WHERE pb2.id_paciente = p.id_paciente
         ))
       GROUP BY pb.nivel_burnout`,
      [idPsicologo]
    );

    // -------------------------------------------------------------------------
    // Citas programadas para hoy
    // -------------------------------------------------------------------------
    const hoy = new Date().toISOString().split("T")[0];
    const citasHoy = await db.queryOne(
      `SELECT COUNT(*) as total
       FROM citas
       WHERE id_psicologo = ? AND fecha_cita = ? AND estado = 'programada'`,
      [idPsicologo, hoy]
    );

    // -------------------------------------------------------------------------
    // Citas de la semana
    // -------------------------------------------------------------------------
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);

    const citasSemana = await db.queryOne(
      `SELECT COUNT(*) as total 
       FROM citas
       WHERE id_psicologo = ? 
         AND fecha_cita BETWEEN ? AND ?
         AND estado = 'programada'`,
      [
        idPsicologo,
        inicioSemana.toISOString().split("T")[0],
        finSemana.toISOString().split("T")[0],
      ]
    );

    // -------------------------------------------------------------------------
    // Pacientes que completaron actividades esta semana
    // -------------------------------------------------------------------------
    const pacientesActivos = await db.queryOne(
      `SELECT COUNT(DISTINCT pa.id_paciente) as total
       FROM progreso_actividad pa
       JOIN expediente e ON pa.id_paciente = e.id_paciente
       WHERE e.id_psicologo = ?
         AND pa.fecha_terminada >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         AND pa.estado = 'completada'`,
      [idPsicologo]
    );

    res.json({
      resumen: {
        total_pacientes: totalPacientes.total,
        pacientes_activos_semana: pacientesActivos ? pacientesActivos.total : 0,
        citas_hoy: citasHoy ? citasHoy.total : 0,
        citas_semana: citasSemana ? citasSemana.total : 0,
      },
      pacientes_por_nivel: pacientesPorNivel,
    });
  } catch (error) {
    console.error("Error obteniendo dashboard:", error);
    res.status(500).json({
      error: "Error obteniendo dashboard",
      message: error.message,
    });
  }
});

// ============================================================================
// GET /api/psicologo/pacientes
// Lista todos los pacientes asignados al psicólogo
//
// Query params opcionales:
// - buscar: filtrar por nombre o matrícula
// - nivel: filtrar por nivel de burnout (bajo, medio, alto)
// - orden: ordenar por nombre, progreso, ultimo_acceso
// ============================================================================

router.get("/pacientes", authenticate.psicologo, async (req, res) => {
  try {
    // Cambiado de req.body a req.query para GET requests
    const { buscar, nivel, orden } = req.query;

    // Obtenemos el id del psicólogo
    const idPsicologo = await obtenerIdPsicologo(req.user.id);

    if (!idPsicologo) {
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    }

    // -------------------------------------------------------------------------
    // Consulta principal: obtener pacientes con su información resumida
    // -------------------------------------------------------------------------
    let query = `
      SELECT 
        p.id_paciente,
        u.nombre,
        u.paterno,
        u.materno,
        u.correo,
        p.matricula,
        p.tutorial_completado,
        p.test_olbi_inicial_completado,
        p.test_olbi_final_completado,
        e.fecha_apertura,
        e.estado as estado_expediente,
        
        -- Último test de burnout
        (SELECT nivel_burnout FROM prueba_burnout
         WHERE id_paciente = p.id_paciente
         ORDER BY fecha_hora DESC LIMIT 1) as nivel_burnout,

        -- Progreso general (actividades completadas / total)
        (SELECT COUNT(*) FROM progreso_actividad
         WHERE id_paciente = p.id_paciente AND estado = 'completada') as actividades_completadas,

        -- Total de actividades
        (SELECT COUNT(*) FROM actividad) as total_actividades,

        -- Última actividad realizada
        (SELECT MAX(fecha_terminada) FROM progreso_actividad
         WHERE id_paciente = p.id_paciente AND estado = 'completada') as ultima_actividad,

        -- Citas pendientes
        (SELECT COUNT(*) FROM citas
         WHERE id_paciente = p.id_paciente
           AND id_psicologo = ?
           AND estado = 'programada') as citas_pendientes

      FROM expediente e
      JOIN paciente p ON e.id_paciente = p.id_paciente
      JOIN usuario u ON p.id_usuario = u.id_usuario
      WHERE e.id_psicologo = ? AND e.estado = 'activo'
    `;

    const params = [idPsicologo, idPsicologo];

    // -------------------------------------------------------------------------
    // Filtro por búsqueda (nombre o matrícula)
    // -------------------------------------------------------------------------
    if (buscar) {
      query += ` AND (
        u.nombre LIKE ? OR
        u.paterno LIKE ? OR
        u.materno LIKE ? OR
        p.matricula LIKE ?
      )`;
      const termino = `%${buscar}%`;
      params.push(termino, termino, termino, termino);
    }

    // -------------------------------------------------------------------------
    // Filtro por nivel de burnout
    // -------------------------------------------------------------------------
    if (nivel) {
      query += ` AND (
        SELECT nivel_burnout FROM prueba_burnout
        WHERE id_paciente = p.id_paciente
        ORDER BY fecha_hora DESC LIMIT 1
      ) = ?`;
      params.push(nivel);
    }

    // -------------------------------------------------------------------------
    // Ordenamiento
    // -------------------------------------------------------------------------
    switch (orden) {
      case "progreso":
        query += " ORDER BY actividades_completadas DESC";
        break;
      case "ultimo_acceso":
        query += " ORDER BY ultima_actividad DESC";
        break;
      case "nombre":
      default:
        query += " ORDER BY u.paterno ASC, u.nombre ASC";
    }

    const pacientes = await db.query(query, params);

    // -------------------------------------------------------------------------
    // Calcular porcentaje de progreso para cada paciente
    // -------------------------------------------------------------------------
    const pacientesConProgreso = pacientes.map((p) => ({
      id_paciente: p.id_paciente,
      nombre_completo: `${p.nombre} ${p.paterno} ${p.materno || ""}`.trim(),
      nombre: p.nombre,
      paterno: p.paterno,
      materno: p.materno,
      correo: p.correo,
      matricula: p.matricula,
      fecha_registro: p.fecha_apertura,
      estado_expediente: p.estado_expediente,

      // Estado del tratamiento
      tutorial_completado: p.tutorial_completado === 1,
      test_inicial_completado: p.test_olbi_inicial_completado === 1,
      test_final_completado: p.test_olbi_final_completado === 1,

      // Progreso
      progreso: {
        actividades_completadas: p.actividades_completadas,
        total_actividades: p.total_actividades,
        porcentaje:
          p.total_actividades > 0
            ? Math.round((p.actividades_completadas / p.total_actividades) * 100)
            : 0,
      },

      nivel_burnout: p.nivel_burnout || "sin evaluar",
      ultima_actividad: p.ultima_actividad,
      citas_pendientes: p.citas_pendientes,
    }));

    res.json({
      total: pacientesConProgreso.length,
      pacientes: pacientesConProgreso,
    });
  } catch (error) {
    console.error("Error obteniendo pacientes:", error);
    res.status(500).json({
      error: "Error obteniendo pacientes",
      message: error.message,
    });
  }
});

// ============================================================================
// GET /api/psicologo/pacientes/:id
// Perfil completo de un paciente específico
//
// Incluye:
// - Información personal
// - Resultados de tests
// - Progreso por módulo
// - Historial de citas
// ============================================================================

router.get("/pacientes/:id", authenticate.psicologo, async (req, res) => {
  try {
    const { id } = req.params;
    const idPsicologo = await obtenerIdPsicologo(req.user.id);

    if (!idPsicologo) {
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    }

    // Verificar que el paciente está asignado a este psicólogo
    const asignado = await verificarPacienteAsignado(idPsicologo, id);
    if (!asignado) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Este paciente no está asignado a ti",
      });
    }

    // -------------------------------------------------------------------------
    // Información básica del paciente
    // -------------------------------------------------------------------------
    const paciente = await db.queryOne(
      `SELECT
        p.id_paciente,
        u.nombre,
        u.paterno,
        u.materno,
        u.correo,
        p.matricula,
        p.tutorial_completado,
        p.test_olbi_inicial_completado,
        p.test_olbi_final_completado,
        e.fecha_apertura,
        e.estado as estado_expediente
       FROM paciente p
       JOIN usuario u ON p.id_usuario = u.id_usuario
       JOIN expediente e ON p.id_paciente = e.id_paciente
       WHERE p.id_paciente = ? AND e.id_psicologo = ?`,
      [id, idPsicologo]
    );

    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // -------------------------------------------------------------------------
    // Resultados de tests OLBI
    // -------------------------------------------------------------------------
    const tests = await db.query(
      `SELECT 
        id_prueba,
        tipo_prueba,
        fecha_hora,
        puntaje_agotamiento,
        puntaje_desvinculacion,
        nivel_burnout
       FROM prueba_burnout
       WHERE id_paciente = ?
       ORDER BY fecha_hora ASC`,
      [id]
    );

    // -------------------------------------------------------------------------
    // Progreso por módulo
    // -------------------------------------------------------------------------
    const progresoModulos = await db.query(
      `SELECT 
        m.id_modulo,
        m.titulo,
        m.orden,
        COALESCE(pm.progreso, 0) as porcentaje,
        COALESCE(pm.estado, 'bloqueado') as estado,
        pm.fecha_inicio,
        pm.fecha_fin
       FROM modulo m
       LEFT JOIN progreso_modulo pm ON m.id_modulo = pm.id_modulo AND pm.id_paciente = ?
       ORDER BY m.orden ASC`,
      [id]
    );

    // -------------------------------------------------------------------------
    // Resumen de actividades
    // -------------------------------------------------------------------------
    const actividadesResumen = await db.queryOne(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN pa.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN pa.estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso
       FROM actividad a
       LEFT JOIN progreso_actividad pa ON a.id_actividad = pa.id_actividad AND pa.id_paciente = ?`,
      [id]
    );

    // -------------------------------------------------------------------------
    // Historial de citas (últimas 10)
    // -------------------------------------------------------------------------
    const citas = await db.query(
      `SELECT
        c.id_cita,
        c.fecha_cita,
        c.hora_cita,
        c.estado,
        c.observaciones,
        cat.tipo_cita
       FROM citas c
       JOIN cat_cita cat ON c.id_categoria = cat.id_categoria
       WHERE c.id_paciente = ? AND c.id_psicologo = ?
       ORDER BY c.fecha_cita DESC, c.hora_cita DESC
       LIMIT 10`,
      [id, idPsicologo]
    );

    // -------------------------------------------------------------------------
    // Documentos legales aceptados
    // -------------------------------------------------------------------------
    const documentos = await db.query(
      `SELECT 
        dl.titulo,
        cd.tipo,
        dp.fecha_aceptacion
       FROM documento_paciente dp
       JOIN documento_legal dl ON dp.id_documento = dl.id_documento
       JOIN cat_documento cd ON dl.id_cat_documento = cd.id_cat_documento
       WHERE dp.id_paciente = ?`,
      [id]
    );

    res.json({
      paciente: {
        id_paciente: paciente.id_paciente,
        nombre_completo: `${paciente.nombre} ${paciente.paterno} ${paciente.materno || ""}`.trim(),
        nombre: paciente.nombre,
        paterno: paciente.paterno,
        materno: paciente.materno,
        correo: paciente.correo,
        matricula: paciente.matricula,
        fecha_registro: paciente.fecha_apertura,
        estado_expediente: paciente.estado_expediente,
        tutorial_completado: paciente.tutorial_completado === 1,
        test_inicial_completado: paciente.test_olbi_inicial_completado === 1,
        test_final_completado: paciente.test_olbi_final_completado === 1,
      },
      tests_burnout: {
        total: tests.length,
        resultados: tests,
        comparacion:
          tests.length >= 2
            ? {
                inicial: tests.find((t) => t.tipo_prueba === "inicial"),
                final: tests.find((t) => t.tipo_prueba === "final"),
              }
            : null,
      },
      progreso: {
        modulos: progresoModulos,
        actividades: {
          total: actividadesResumen ? actividadesResumen.total : 0,
          completadas: actividadesResumen ? actividadesResumen.completadas || 0 : 0,
          en_progreso: actividadesResumen ? actividadesResumen.en_progreso || 0 : 0,
          porcentaje:
            actividadesResumen && actividadesResumen.total > 0
              ? Math.round((actividadesResumen.completadas / actividadesResumen.total) * 100)
              : 0,
        },
      },
      citas: {
        total: citas.length,
        historial: citas,
      },
      documentos_legales: documentos,
    });
  } catch (error) {
    console.error("Error obteniendo perfil del paciente:", error);
    res.status(500).json({
      error: "Error obteniendo perfil",
      message: error.message,
    });
  }
});

// ============================================================================
// GET /api/psicologo/pacientes/:id/progreso
// Progreso detallado de un paciente (actividades por módulo)
// ============================================================================

router.get("/pacientes/:id/progreso", authenticate.psicologo, async (req, res) => {
  try {
    const { id } = req.params;
    const idPsicologo = await obtenerIdPsicologo(req.user.id);

    if (!idPsicologo) {
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    }

    // Verificar asignación
    const asignado = await verificarPacienteAsignado(idPsicologo, id);
    if (!asignado) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Este paciente no está asignado a ti",
      });
    }

    // -------------------------------------------------------------------------
    // Obtener progreso detallado por módulo y actividad
    // -------------------------------------------------------------------------
    const modulos = await db.query(
      `SELECT
        m.id_modulo,
        m.titulo as modulo_titulo,
        m.orden,
        COALESCE(pm.progreso, 0) as porcentaje_modulo,
        COALESCE(pm.estado, 'bloqueado') as estado_modulo
       FROM modulo m
       LEFT JOIN progreso_modulo pm ON m.id_modulo = pm.id_modulo AND pm.id_paciente = ?
       ORDER BY m.orden ASC`,
      [id]
    );

    // Para cada módulo, obtener sus actividades con progreso
    const modulosConActividades = await Promise.all(
      modulos.map(async (modulo) => {
        const actividades = await db.query(
          `SELECT 
            a.id_actividad,
            a.titulo,
            a.orden,
            a.duracion_minutos,
            cat.nombre_tipo as tipo,
            COALESCE(pa.estado, 'pendiente') as estado,
            pa.fecha_inicio,
            pa.fecha_terminada
           FROM actividad a
           LEFT JOIN cat_actividad cat ON a.id_tipo = cat.id_tipo
           LEFT JOIN progreso_actividad pa ON a.id_actividad = pa.id_actividad AND pa.id_paciente = ?
           WHERE a.id_modulo = ?
           ORDER BY a.orden ASC`,
          [id, modulo.id_modulo]
        );

        return {
          ...modulo,
          actividades,
        };
      })
    );

    res.json({
      id_paciente: parseInt(id),
      modulos: modulosConActividades,
    });
  } catch (error) {
    console.error("Error obteniendo progreso detallado:", error);
    res.status(500).json({
      error: "Error obteniendo progreso",
      message: error.message,
    });
  }
});

// ============================================================================
// GET /api/psicologo/pacientes/:id/tests
// Historial completo de tests OLBI del paciente
// ============================================================================

router.get("/pacientes/:id/tests", authenticate.psicologo, async (req, res) => {
  try {
    const { id } = req.params;
    const idPsicologo = await obtenerIdPsicologo(req.user.id);

    if (!idPsicologo) {
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    }

    // Verificar asignación
    const asignado = await verificarPacienteAsignado(idPsicologo, id);
    if (!asignado) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Este paciente no está asignado a ti",
      });
    }

    // -------------------------------------------------------------------------
    // Obtener todos los tests
    // -------------------------------------------------------------------------
    const tests = await db.query(
      `SELECT 
        pb.id_prueba,
        pb.tipo_prueba,
        pb.fecha_hora,
        pb.puntaje,
        pb.puntaje_agotamiento,
        pb.puntaje_desvinculacion,
        pb.nivel_burnout
       FROM prueba_burnout pb
       WHERE pb.id_paciente = ?
       ORDER BY pb.fecha_hora ASC`,
      [id]
    );

    // Si hay test inicial y final, calcular comparación
    let comparacion = null;
    const testInicial = tests.find((t) => t.tipo_prueba === "inicial");
    const testFinal = tests.find((t) => t.tipo_prueba === "final");

    if (testInicial && testFinal) {
      const cambioAgot = parseFloat(testFinal.puntaje_agotamiento) - parseFloat(testInicial.puntaje_agotamiento);
      const cambioDesv = parseFloat(testFinal.puntaje_desvinculacion) - parseFloat(testInicial.puntaje_desvinculacion);

      comparacion = {
        cambio_agotamiento: cambioAgot.toFixed(2),
        cambio_desvinculacion: cambioDesv.toFixed(2),
        mejoria: cambioAgot < 0 || cambioDesv < 0,
        interpretacion: generarInterpretacion(testInicial, testFinal),
      };
    }

    res.json({
      id_paciente: parseInt(id),
      total_tests: tests.length,
      tests,
      comparacion,
    });
  } catch (error) {
    console.error("Error obteniendo tests:", error);
    res.status(500).json({
      error: "Error obteniendo tests",
      message: error.message,
    });
  }
});

// ============================================================================
// GET /api/psicologo/pacientes-sin-asignar
// Lista pacientes que no tienen psicólogo asignado
// ============================================================================

router.get("/pacientes-sin-asignar", authenticate.psicologo, async (req, res) => {
  try {
    const pacientes = await db.query(
      `SELECT 
        p.id_paciente,
        u.nombre,
        u.paterno,
        u.materno,
        p.matricula,
        u.correo,
        p.test_olbi_inicial_completado
       FROM paciente p
       JOIN usuario u ON p.id_usuario = u.id_usuario
       LEFT JOIN expediente e ON p.id_paciente = e.id_paciente
       WHERE e.id_paciente IS NULL AND u.activo = TRUE
       ORDER BY u.paterno ASC, u.nombre ASC`
    );

    res.json({
      total: pacientes.length,
      pacientes: pacientes.map((p) => ({
        id_paciente: p.id_paciente,
        nombre_completo: `${p.nombre} ${p.paterno} ${p.materno || ""}`.trim(),
        matricula: p.matricula,
        correo: p.correo,
        test_inicial_completado: p.test_olbi_inicial_completado === 1,
      })),
    });
  } catch (error) {
    console.error("Error obteniendo pacientes sin asignar:", error);
    res.status(500).json({
      error: "Error obteniendo pacientes",
      message: error.message,
    });
  }
});

// ============================================================================
// POST /api/psicologo/pacientes/:id/asignar
// Asignar un paciente al psicólogo (crear expediente)
// ============================================================================

router.post("/pacientes/:id/asignar", authenticate.psicologo, async (req, res) => {
  try {
    const { id } = req.params;
    const idPsicologo = await obtenerIdPsicologo(req.user.id);

    if (!idPsicologo) {
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    }

    // Verificar que el paciente existe
    const paciente = await db.queryOne(
      `SELECT p.id_paciente, u.nombre, u.paterno
       FROM paciente p
       JOIN usuario u ON p.id_usuario = u.id_usuario
       WHERE p.id_paciente = ?`,
      [id]
    );

    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // Verificar que no esté ya asignado
    const expedienteExistente = await db.queryOne(
      "SELECT id_paciente FROM expediente WHERE id_paciente = ?",
      [id]
    );

    if (expedienteExistente) {
      return res.status(400).json({
        error: "Paciente ya asignado",
        message: "Este paciente ya tiene un psicólogo asignado",
      });
    }

    // Crear expediente
    await db.query(
      `INSERT INTO expediente (id_paciente, id_psicologo, fecha_apertura, estado)
       VALUES (?, ?, NOW(), 'activo')`,
      [id, idPsicologo]
    );

    res.status(201).json({
      message: "Paciente asignado exitosamente",
      paciente: {
        id_paciente: paciente.id_paciente,
        nombre: `${paciente.nombre} ${paciente.paterno}`,
      },
    });
  } catch (error) {
    console.error("Error asignando paciente:", error);
    res.status(500).json({
      error: "Error asignando paciente",
      message: error.message,
    });
  }
});

// ============================================================================
// FUNCIÓN AUXILIAR: Generar interpretación de comparación de tests
// ============================================================================

function generarInterpretacion(testInicial, testFinal) {
  const cambioAgotamiento = parseFloat(testFinal.puntaje_agotamiento) - parseFloat(testInicial.puntaje_agotamiento);
  const cambioDesvinculacion = parseFloat(testFinal.puntaje_desvinculacion) - parseFloat(testInicial.puntaje_desvinculacion);

  let mensaje = "";

  // Evaluar agotamiento
  if (cambioAgotamiento < -0.5) {
    mensaje += "El paciente muestra una mejora significativa en los niveles de agotamiento. ";
  } else if (cambioAgotamiento < 0) {
    mensaje += "El paciente muestra una leve mejora en los niveles de agotamiento. ";
  } else if (cambioAgotamiento > 0.5) {
    mensaje += "El paciente muestra un aumento preocupante en los niveles de agotamiento. ";
  } else if (cambioAgotamiento > 0) {
    mensaje += "El paciente muestra un leve aumento en los niveles de agotamiento. ";
  } else {
    mensaje += "Los niveles de agotamiento se mantienen estables. ";
  }

  // Evaluar desvinculación
  if (cambioDesvinculacion < -0.5) {
    mensaje += "Se observa una mejora significativa en el compromiso con sus actividades.";
  } else if (cambioDesvinculacion < 0) {
    mensaje += "Se observa una leve mejora en el compromiso con sus actividades.";
  } else if (cambioDesvinculacion > 0.5) {
    mensaje += "Se observa un aumento preocupante en la desvinculación.";
  } else if (cambioDesvinculacion > 0) {
    mensaje += "Se observa un leve aumento en la desvinculación.";
  } else {
    mensaje += "Los niveles de compromiso se mantienen estables.";
  }

  return mensaje;
}

module.exports = router;
