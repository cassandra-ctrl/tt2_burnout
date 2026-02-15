// ============================================================================
// RUTAS DE LOGROS E INSIGNIAS (GAMIFICACIÓN)
// routes/logros.routes.js
//
// Sistema de logros para motivar al paciente en su tratamiento.
//
// Logros disponibles:
// - Bronce: Primer Paso (1 actividad)
// - Plata: Racha 3 días, Primer Módulo, Constante (10 actividades)
// - Oro: Racha 7 días, Mitad del Camino (50%)
// - Diamante: Guerrero del Burnout (100%), Racha Legendaria (14 días)
// ============================================================================

const express = require("express");
const router = express.Router();
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

// ============================================================================
// FUNCIÓN AUXILIAR: Obtener id_paciente del usuario autenticado
// ============================================================================

async function obtenerIdPaciente(userId) {
  const paciente = await db.queryOne(
    "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
    [userId],
  );
  return paciente ? paciente.id_paciente : null;
}

// ============================================================================
// FUNCIÓN AUXILIAR: Verificar y otorgar logros automáticamente
// Esta función revisa todas las condiciones y otorga los logros que correspondan
// ============================================================================

async function verificarYOtorgarLogros(idPaciente) {
  const logrosOtorgados = [];

  // -------------------------------------------------------------------------
  // Obtener estadísticas del paciente
  // -------------------------------------------------------------------------

  // Total de actividades completadas
  const actividadesCompletadas = await db.queryOne(
    `SELECT COUNT(*) as total 
     FROM progreso_actividad 
     WHERE id_paciente = ? AND estado = 'completada'`,
    [idPaciente],
  );

  // Total de módulos completados
  const modulosCompletados = await db.queryOne(
    `SELECT COUNT(*) as total 
     FROM progreso_modulo 
     WHERE id_paciente = ? AND estado = 'completado'`,
    [idPaciente],
  );

  // Total de actividades en el sistema
  const totalActividades = await db.queryOne(
    "SELECT COUNT(*) as total FROM actividad",
  );

  // Calcular porcentaje de progreso
  const porcentajeProgreso =
    totalActividades.total > 0
      ? Math.round(
          (actividadesCompletadas.total / totalActividades.total) * 100,
        )
      : 0;

  // Calcular racha actual (días consecutivos)
  const rachaActual = await calcularRacha(idPaciente);

  // -------------------------------------------------------------------------
  // Obtener logros que el paciente YA tiene
  // -------------------------------------------------------------------------
  const logrosObtenidos = await db.query(
    "SELECT id_logro FROM paciente_logro WHERE id_paciente = ?",
    [idPaciente],
  );
  const idsObtenidos = logrosObtenidos.map((l) => l.id_logro);

  // -------------------------------------------------------------------------
  // Verificar cada logro
  // -------------------------------------------------------------------------

  // BRONCE: Primer Paso (1 actividad)
  if (actividadesCompletadas.total >= 1) {
    const logro = await otorgarLogroPorNombre(
      "Primer Paso",
      idPaciente,
      idsObtenidos,
    );
    if (logro) logrosOtorgados.push(logro);
  }

  // PLATA: Racha de 3 días
  if (rachaActual >= 3) {
    const logro = await otorgarLogroPorNombre(
      "Racha de 3 días",
      idPaciente,
      idsObtenidos,
    );
    if (logro) logrosOtorgados.push(logro);
  }

  // PLATA: Primer Módulo
  if (modulosCompletados.total >= 1) {
    const logro = await otorgarLogroPorNombre(
      "Primer Módulo",
      idPaciente,
      idsObtenidos,
    );
    if (logro) logrosOtorgados.push(logro);
  }

  // PLATA: Constante (10 actividades)
  if (actividadesCompletadas.total >= 10) {
    const logro = await otorgarLogroPorNombre(
      "Constante",
      idPaciente,
      idsObtenidos,
    );
    if (logro) logrosOtorgados.push(logro);
  }

  // ORO: Racha de 7 días
  if (rachaActual >= 7) {
    const logro = await otorgarLogroPorNombre(
      "Racha de 7 días",
      idPaciente,
      idsObtenidos,
    );
    if (logro) logrosOtorgados.push(logro);
  }

  // ORO: Mitad del Camino (50%)
  if (porcentajeProgreso >= 50) {
    const logro = await otorgarLogroPorNombre(
      "Mitad del Camino",
      idPaciente,
      idsObtenidos,
    );
    if (logro) logrosOtorgados.push(logro);
  }

  // DIAMANTE: Guerrero del Burnout (100%)
  if (porcentajeProgreso >= 100) {
    const logro = await otorgarLogroPorNombre(
      "Guerrero del Burnout",
      idPaciente,
      idsObtenidos,
    );
    if (logro) logrosOtorgados.push(logro);
  }

  // DIAMANTE: Racha Legendaria (14 días)
  if (rachaActual >= 14) {
    const logro = await otorgarLogroPorNombre(
      "Racha Legendaria",
      idPaciente,
      idsObtenidos,
    );
    if (logro) logrosOtorgados.push(logro);
  }

  return logrosOtorgados;
}

// ============================================================================
// FUNCIÓN AUXILIAR: Otorgar logro por nombre si no lo tiene
// ============================================================================

async function otorgarLogroPorNombre(nombreLogro, idPaciente, idsObtenidos) {
  // Buscar el logro por nombre
  const logro = await db.queryOne(
    `SELECT l.id_logro, l.nombre, l.descripcion, l.imagen, c.tipo as categoria
     FROM logro l
     JOIN cat_logro c ON l.id_cat_logro = c.id_cat_logro
     WHERE l.nombre = ?`,
    [nombreLogro],
  );

  if (!logro) return null;

  // Si ya lo tiene, no hacer nada
  if (idsObtenidos.includes(logro.id_logro)) return null;

  // Otorgar el logro
  await db.query(
    "INSERT INTO paciente_logro (id_paciente, id_logro) VALUES (?, ?)",
    [idPaciente, logro.id_logro],
  );

  return {
    id_logro: logro.id_logro,
    nombre: logro.nombre,
    descripcion: logro.descripcion,
    imagen: logro.imagen,
    categoria: logro.categoria,
    fecha_obtenido: new Date().toISOString(),
    nuevo: true,
  };
}

// ============================================================================
// FUNCIÓN AUXILIAR: Calcular racha de días consecutivos
// ============================================================================

async function calcularRacha(idPaciente) {
  // Obtener fechas únicas de actividades completadas, ordenadas de más reciente a más antigua
  const fechas = await db.query(
    `SELECT DISTINCT DATE(fecha_terminada) as fecha
     FROM progreso_actividad
     WHERE id_paciente = ? AND estado = 'completada'
     ORDER BY fecha DESC`,
    [idPaciente],
  );

  if (fechas.length === 0) return 0;

  let racha = 0;
  let fechaEsperada = new Date();
  fechaEsperada.setHours(0, 0, 0, 0);

  for (const registro of fechas) {
    const fechaActividad = new Date(registro.fecha);
    fechaActividad.setHours(0, 0, 0, 0);

    // Calcular diferencia en días
    const diffDias = Math.floor(
      (fechaEsperada - fechaActividad) / (1000 * 60 * 60 * 24),
    );

    if (diffDias === 0 || diffDias === 1) {
      // Es hoy o ayer (consecutivo)
      racha++;
      fechaEsperada = new Date(fechaActividad);
      fechaEsperada.setDate(fechaEsperada.getDate() - 1);
    } else if (diffDias > 1) {
      // Se rompió la racha
      break;
    }
  }

  return racha;
}

// ============================================================================
// GET /api/logros
// Obtener todos los logros disponibles con el estado del paciente
//
// Acceso: Solo pacientes
// ============================================================================

router.get("/", authenticate.paciente, async (req, res) => {
  try {
    const idPaciente = await obtenerIdPaciente(req.user.id);

    if (!idPaciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // Verificar y otorgar nuevos logros
    const nuevosLogros = await verificarYOtorgarLogros(idPaciente);

    // Obtener todos los logros con estado
    const logros = await db.query(
      `SELECT 
        l.id_logro,
        l.nombre,
        l.descripcion,
        l.imagen,
        c.tipo as categoria,
        c.id_cat_logro,
        pl.fecha_obtencion,
        CASE WHEN pl.id_paciente IS NOT NULL THEN TRUE ELSE FALSE END as obtenido
       FROM logro l
       JOIN cat_logro c ON l.id_cat_logro = c.id_cat_logro
       LEFT JOIN paciente_logro pl ON l.id_logro = pl.id_logro AND pl.id_paciente = ?
       ORDER BY c.id_cat_logro ASC, l.id_logro ASC`,
      [idPaciente],
    );

    // Agrupar por categoría
    const logrosPorCategoria = {
      Bronce: [],
      Plata: [],
      Oro: [],
      Diamante: [],
    };

    logros.forEach((logro) => {
      if (logrosPorCategoria[logro.categoria]) {
        logrosPorCategoria[logro.categoria].push({
          id_logro: logro.id_logro,
          nombre: logro.nombre,
          descripcion: logro.descripcion,
          imagen: logro.imagen,
          obtenido: logro.obtenido === 1,
          fecha_obtencion: logro.fecha_obtencion,
        });
      }
    });

    // Contar logros obtenidos
    const totalLogros = logros.length;
    const logrosObtenidos = logros.filter((l) => l.obtenido === 1).length;

    res.json({
      total: totalLogros,
      obtenidos: logrosObtenidos,
      porcentaje:
        totalLogros > 0 ? Math.round((logrosObtenidos / totalLogros) * 100) : 0,
      nuevos_logros: nuevosLogros,
      logros_por_categoria: logrosPorCategoria,
    });
  } catch (error) {
    console.error("Error obteniendo logros:", error);
    res.status(500).json({
      error: "Error obteniendo logros",
      message: error.message,
    });
  }
});

// ============================================================================
// GET /api/logros/mis-logros
// Obtener solo los logros que el paciente ha obtenido
//
// Acceso: Solo pacientes
// ============================================================================

router.get("/mis-logros", authenticate.paciente, async (req, res) => {
  try {
    const idPaciente = await obtenerIdPaciente(req.user.id);

    if (!idPaciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // Verificar y otorgar nuevos logros primero
    const nuevosLogros = await verificarYOtorgarLogros(idPaciente);

    // Obtener logros obtenidos
    const logros = await db.query(
      `SELECT 
        l.id_logro,
        l.nombre,
        l.descripcion,
        l.imagen,
        c.tipo as categoria,
        pl.fecha_obtencion
       FROM paciente_logro pl
       JOIN logro l ON pl.id_logro = l.id_logro
       JOIN cat_logro c ON l.id_cat_logro = c.id_cat_logro
       WHERE pl.id_paciente = ?
       ORDER BY pl.fecha_obtencion DESC`,
      [idPaciente],
    );

    res.json({
      total: logros.length,
      nuevos_logros: nuevosLogros,
      logros,
    });
  } catch (error) {
    console.error("Error obteniendo mis logros:", error);
    res.status(500).json({
      error: "Error obteniendo logros",
      message: error.message,
    });
  }
});

// ============================================================================
// GET /api/logros/estadisticas
// Obtener estadísticas del paciente relacionadas con logros
//
// Acceso: Solo pacientes
// ============================================================================

router.get("/estadisticas", authenticate.paciente, async (req, res) => {
  try {
    const idPaciente = await obtenerIdPaciente(req.user.id);

    if (!idPaciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // Actividades completadas
    const actividadesCompletadas = await db.queryOne(
      `SELECT COUNT(*) as total 
       FROM progreso_actividad 
       WHERE id_paciente = ? AND estado = 'completada'`,
      [idPaciente],
    );

    // Total actividades
    const totalActividades = await db.queryOne(
      "SELECT COUNT(*) as total FROM actividad",
    );

    // Módulos completados
    const modulosCompletados = await db.queryOne(
      `SELECT COUNT(*) as total 
       FROM progreso_modulo 
       WHERE id_paciente = ? AND estado = 'completado'`,
      [idPaciente],
    );

    // Total módulos
    const totalModulos = await db.queryOne(
      "SELECT COUNT(*) as total FROM modulo",
    );

    // Racha actual
    const rachaActual = await calcularRacha(idPaciente);

    // Logros obtenidos
    const logrosObtenidos = await db.queryOne(
      "SELECT COUNT(*) as total FROM paciente_logro WHERE id_paciente = ?",
      [idPaciente],
    );

    // Total logros
    const totalLogros = await db.queryOne(
      "SELECT COUNT(*) as total FROM logro",
    );

    // Validar que todas las consultas retornaron datos
    const actCompletadas = actividadesCompletadas
      ? actividadesCompletadas.total
      : 0;
    const actTotal = totalActividades ? totalActividades.total : 0;
    const modCompletados = modulosCompletados ? modulosCompletados.total : 0;
    const modTotal = totalModulos ? totalModulos.total : 0;
    const logObtenidos = logrosObtenidos ? logrosObtenidos.total : 0;
    const logTotal = totalLogros ? totalLogros.total : 0;

    res.json({
      actividades: {
        completadas: actCompletadas,
        total: actTotal,
        porcentaje:
          actTotal > 0 ? Math.round((actCompletadas / actTotal) * 100) : 0,
      },
      modulos: {
        completados: modCompletados,
        total: modTotal,
      },
      racha_actual: rachaActual,
      logros: {
        obtenidos: logObtenidos,
        total: logTotal,
        porcentaje:
          logTotal > 0 ? Math.round((logObtenidos / logTotal) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({
      error: "Error obteniendo estadísticas",
      message: error.message,
    });
  }
});

// ============================================================================
// GET /api/logros/verificar
// Verificar si hay nuevos logros disponibles (llamar después de completar actividad)
//
// Acceso: Solo pacientes
// ============================================================================

router.get("/verificar", authenticate.paciente, async (req, res) => {
  try {
    const idPaciente = await obtenerIdPaciente(req.user.id);

    if (!idPaciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // Verificar y otorgar nuevos logros
    const nuevosLogros = await verificarYOtorgarLogros(idPaciente);

    res.json({
      nuevos_logros: nuevosLogros,
      cantidad: nuevosLogros.length,
      mensaje:
        nuevosLogros.length > 0
          ? `¡Felicidades! Has desbloqueado ${nuevosLogros.length} nuevo(s) logro(s)`
          : "No hay nuevos logros por ahora. ¡Sigue así!",
    });
  } catch (error) {
    console.error("Error verificando logros:", error);
    res.status(500).json({
      error: "Error verificando logros",
      message: error.message,
    });
  }
});

// ============================================================================
// GET /api/logros/paciente/:id
// Obtener logros de un paciente específico (para el psicólogo)
//
// Acceso: Solo psicólogo
// ============================================================================

router.get("/paciente/:id", authenticate.psicologo, async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener logros del paciente
    const logros = await db.query(
      `SELECT 
        l.id_logro,
        l.nombre,
        l.descripcion,
        l.imagen,
        c.tipo as categoria,
        pl.fecha_obtencion
       FROM paciente_logro pl
       JOIN logro l ON pl.id_logro = l.id_logro
       JOIN cat_logro c ON l.id_cat_logro = c.id_cat_logro
       WHERE pl.id_paciente = ?
       ORDER BY pl.fecha_obtencion DESC`,
      [id],
    );

    // Total de logros disponibles
    const totalLogros = await db.queryOne(
      "SELECT COUNT(*) as total FROM logro",
    );

    res.json({
      id_paciente: parseInt(id),
      obtenidos: logros.length,
      total: totalLogros.total,
      porcentaje:
        totalLogros.total > 0
          ? Math.round((logros.length / totalLogros.total) * 100)
          : 0,
      logros,
    });
  } catch (error) {
    console.error("Error obteniendo logros del paciente:", error);
    res.status(500).json({
      error: "Error obteniendo logros",
      message: error.message,
    });
  }
});

module.exports = router;
