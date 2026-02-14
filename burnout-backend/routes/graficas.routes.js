// ============================================================================
// RUTAS DE GRÁFICAS DEL PACIENTE
// routes/graficas.routes.js
//
// Gráficas disponibles:
// 1. Desempeño del paciente (módulo actual)
// 2. Comparación nivel de burnout (test inicial vs final)
// 3. Nivel de burnout general (todos los pacientes) - Solo psicólogo
// ============================================================================

const express = require("express");
const router = express.Router();
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

// Obtener id_psicologo del usuario autenticado
async function obtenerIdPsicologo(userId) {
  const psicologo = await db.queryOne(
    "SELECT id_psicologo FROM psicologo WHERE id_usuario = ?",
    [userId],
  );
  return psicologo ? psicologo.id_psicologo : null;
}

// Verificar que el paciente está asignado al psicólogo
async function verificarPacienteAsignado(idPsicologo, idPaciente) {
  const expediente = await db.queryOne(
    `SELECT id_paciente FROM expediente 
     WHERE id_psicologo = ? AND id_paciente = ?`,
    [idPsicologo, idPaciente],
  );
  return expediente !== null;
}

// Verificar que el paciente accede a sus propios datos
async function verificarAccesoPaciente(userId, idPaciente) {
  const paciente = await db.queryOne(
    "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
    [userId],
  );
  return paciente && paciente.id_paciente === parseInt(idPaciente);
}

// GET /api/graficas/paciente/:id/desempeno
// GRÁFICA 1: Desempeño del paciente en el módulo actual
// Acceso: Psicólogo (paciente asignado) o Paciente (sus propios datos)
router.get(
  "/paciente/:id/desempeno",
  authenticate.required,
  async (req, res) => {
    try {
      const { id } = req.params;
      // Verificar permisos
      if (req.user.rol === "psicologo") {
        const idPsicologo = await obtenerIdPsicologo(req.user.id);
        if (!idPsicologo) {
          return res.status(404).json({ error: "Psicólogo no encontrado" });
        }
        const asignado = await verificarPacienteAsignado(idPsicologo, id);
        if (!asignado) {
          return res.status(403).json({
            error: "Acceso denegado",
            message: "Este paciente no está asignado a ti",
          });
        }
      } else if (req.user.rol === "paciente") {
        const esPropio = await verificarAccesoPaciente(req.user.id, id);
        if (!esPropio) {
          return res.status(403).json({
            error: "Acceso denegado",
            message: "Solo puedes ver tus propios datos",
          });
        }
      } else {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      // Obtener el módulo actual
      const moduloActual = await db.queryOne(
        `SELECT 
        m.id_modulo,
        m.titulo,
        m.orden,
        COALESCE(pm.progreso, 0) as progreso,
        COALESCE(pm.estado, 'bloqueado') as estado
       FROM modulo m
       LEFT JOIN progreso_modulo pm ON m.id_modulo = pm.id_modulo AND pm.id_paciente = ?
       WHERE pm.estado = 'en_progreso' 
          OR (pm.estado IS NULL AND m.orden = 1)
          OR pm.estado = 'desbloqueado'
       ORDER BY m.orden ASC
       LIMIT 1`,
        [id],
      );

      // Si no hay módulo en progreso, buscar el primero
      let modulo = moduloActual;
      if (!modulo) {
        modulo = await db.queryOne(
          `SELECT 
          m.id_modulo,
          m.titulo,
          m.orden,
          0 as progreso,
          'pendiente' as estado
         FROM modulo m
         ORDER BY m.orden ASC
         LIMIT 1`,
        );
      }

      if (!modulo) {
        return res.status(404).json({ error: "No hay módulos disponibles" });
      }

      // Obtener actividades del módulo actual con su estado
      const actividades = await db.query(
        `SELECT 
        a.id_actividad,
        a.titulo,
        a.orden,
        COALESCE(pa.estado, 'pendiente') as estado
       FROM actividad a
       LEFT JOIN progreso_actividad pa ON a.id_actividad = pa.id_actividad AND pa.id_paciente = ?
       WHERE a.id_modulo = ?
       ORDER BY a.orden ASC`,
        [id, modulo.id_modulo],
      );

      // Contar actividades por estado
      const completadas = actividades.filter(
        (a) => a.estado === "completada",
      ).length;
      const enProgreso = actividades.filter(
        (a) => a.estado === "en_progreso",
      ).length;
      const pendientes = actividades.filter(
        (a) => a.estado === "pendiente",
      ).length;
      const total = actividades.length;

      // Respuesta con datos para la gráfica
      res.json({
        id_paciente: parseInt(id),
        modulo_actual: {
          id: modulo.id_modulo,
          titulo: modulo.titulo,
          orden: modulo.orden,
          progreso: modulo.progreso,
          estado: modulo.estado,
        },
        actividades: {
          total,
          completadas,
          en_progreso: enProgreso,
          pendientes,
          porcentaje_completado:
            total > 0 ? Math.round((completadas / total) * 100) : 0,
        },
        // Datos listos para Chart.js (gráfica de dona/pastel)
        grafica: {
          tipo: "dona",
          titulo: `Desempeño - ${modulo.titulo}`,
          labels: ["Completadas", "En progreso", "Pendientes"],
          datasets: [
            {
              data: [completadas, enProgreso, pendientes],
              backgroundColor: ["#4CAF50", "#FF9800", "#9E9E9E"],
              borderWidth: 1,
            },
          ],
        },
        // Lista detallada de actividades
        detalle_actividades: actividades,
      });
    } catch (error) {
      console.error("Error obteniendo desempeño:", error);
      res.status(500).json({
        error: "Error obteniendo desempeño",
        message: error.message,
      });
    }
  },
);

// GET /api/graficas/paciente/:id/comparacion-burnout
// GRÁFICA 2: Comparación del nivel de burnout (test inicial vs final)
// Acceso: Psicólogo (paciente asignado) o Paciente

router.get(
  "/paciente/:id/comparacion-burnout",
  authenticate.required,
  async (req, res) => {
    try {
      const { id } = req.params;
      // Verificar permisos
    
      if (req.user.rol === "psicologo") {
        const idPsicologo = await obtenerIdPsicologo(req.user.id);
        if (!idPsicologo) {
          return res.status(404).json({ error: "Psicólogo no encontrado" });
        }
        const asignado = await verificarPacienteAsignado(idPsicologo, id);
        if (!asignado) {
          return res.status(403).json({
            error: "Acceso denegado",
            message: "Este paciente no está asignado a ti",
          });
        }
      } else if (req.user.rol === "paciente") {
        const esPropio = await verificarAccesoPaciente(req.user.id, id);
        if (!esPropio) {
          return res.status(403).json({
            error: "Acceso denegado",
            message: "Solo puedes ver tus propios datos",
          });
        }
      } else {
        return res.status(403).json({ error: "Acceso denegado" });
      }

 
      // Obtener tests del paciente

      const tests = await db.query(
        `SELECT 
        tipo_prueba,
        fecha_hora,
        puntaje_agotamiento,
        puntaje_desvinculacion,
        nivel_burnout
       FROM prueba_burnout
       WHERE id_paciente = ?
       ORDER BY fecha_hora ASC`,
        [id],
      );

      // Separar test inicial y final
      const testInicial = tests.find((t) => t.tipo_prueba === "inicial");
      const testFinal = tests.find((t) => t.tipo_prueba === "final");

      // Calcular interpretación si hay ambos tests
  
      let interpretacion = null;
      let mejoria = null;

      if (testInicial && testFinal) {
        const cambioAgotamiento =
          parseFloat(testFinal.puntaje_agotamiento) -
          parseFloat(testInicial.puntaje_agotamiento);
        const cambioDesvinculacion =
          parseFloat(testFinal.puntaje_desvinculacion) -
          parseFloat(testInicial.puntaje_desvinculacion);

        mejoria = {
          agotamiento: cambioAgotamiento < 0,
          desvinculacion: cambioDesvinculacion < 0,
          general: cambioAgotamiento < 0 || cambioDesvinculacion < 0,
        };

        // Generar mensaje de interpretación
        let mensaje = "";
        if (cambioAgotamiento < -0.5) {
          mensaje += "Mejora significativa en agotamiento. ";
        } else if (cambioAgotamiento < 0) {
          mensaje += "Leve mejora en agotamiento. ";
        } else if (cambioAgotamiento > 0.5) {
          mensaje += "Aumento preocupante en agotamiento. ";
        } else if (cambioAgotamiento > 0) {
          mensaje += "Leve aumento en agotamiento. ";
        }

        if (cambioDesvinculacion < -0.5) {
          mensaje += "Mejora significativa en compromiso.";
        } else if (cambioDesvinculacion < 0) {
          mensaje += "Leve mejora en compromiso.";
        } else if (cambioDesvinculacion > 0.5) {
          mensaje += "Aumento preocupante en desvinculación.";
        } else if (cambioDesvinculacion > 0) {
          mensaje += "Leve aumento en desvinculación.";
        }

        interpretacion = {
          mensaje: mensaje || "Los niveles se mantienen estables.",
          cambio_agotamiento: cambioAgotamiento.toFixed(2),
          cambio_desvinculacion: cambioDesvinculacion.toFixed(2),
          recomendacion:
            mejoria.agotamiento && mejoria.desvinculacion
              ? "Excelente progreso. El tratamiento está siendo efectivo."
              : mejoria.agotamiento || mejoria.desvinculacion
                ? "Progreso parcial. Continuar con el tratamiento."
                : "Revisar estrategias de intervención.",
        };
      }
      // Respuesta con datos para la gráfica
      res.json({
        id_paciente: parseInt(id),
        tiene_test_inicial: !!testInicial,
        tiene_test_final: !!testFinal,
        test_inicial: testInicial
          ? {
              fecha: testInicial.fecha_hora,
              agotamiento: parseFloat(testInicial.puntaje_agotamiento),
              desvinculacion: parseFloat(testInicial.puntaje_desvinculacion),
              nivel: testInicial.nivel_burnout,
            }
          : null,
        test_final: testFinal
          ? {
              fecha: testFinal.fecha_hora,
              agotamiento: parseFloat(testFinal.puntaje_agotamiento),
              desvinculacion: parseFloat(testFinal.puntaje_desvinculacion),
              nivel: testFinal.nivel_burnout,
            }
          : null,
        mejoria,
        interpretacion,
        // Datos listos para Chart.js (gráfica de barras agrupadas)
        grafica: {
          tipo: "barras",
          titulo: "Comparación Test OLBI",
          labels: ["Agotamiento", "Desvinculación"],
          datasets: [
            {
              label: "Test Inicial",
              data: testInicial
                ? [
                    parseFloat(testInicial.puntaje_agotamiento),
                    parseFloat(testInicial.puntaje_desvinculacion),
                  ]
                : [0, 0],
              backgroundColor: "rgba(255, 99, 132, 0.7)",
              borderColor: "rgb(255, 99, 132)",
              borderWidth: 1,
            },
            {
              label: "Test Final",
              data: testFinal
                ? [
                    parseFloat(testFinal.puntaje_agotamiento),
                    parseFloat(testFinal.puntaje_desvinculacion),
                  ]
                : [0, 0],
              backgroundColor: "rgba(75, 192, 192, 0.7)",
              borderColor: "rgb(75, 192, 192)",
              borderWidth: 1,
            },
          ],
          // Escala del eje Y (OLBI va de 1 a 4)
          opciones: {
            scales: {
              y: {
                min: 1,
                max: 4,
                title: "Puntaje OLBI",
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error obteniendo comparación burnout:", error);
      res.status(500).json({
        error: "Error obteniendo comparación",
        message: error.message,
      });
    }
  },
);

/ GET /api/graficas/burnout-general

// GRÁFICA 3: Nivel de burnout general de todos los pacientes
// Acceso: Solo Psicólogo


router.get("/burnout-general", authenticate.psicologo, async (req, res) => {
  try {
    const idPsicologo = await obtenerIdPsicologo(req.user.id);

    if (!idPsicologo) {
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    }

    // Obtener distribución de pacientes por nivel de burnout
    // Considera el último test de cada paciente
    const distribucion = await db.query(
      `SELECT 
        COALESCE(pb.nivel_burnout, 'sin_evaluar') as nivel,
        COUNT(*) as cantidad
       FROM expediente e
       JOIN paciente p ON e.id_paciente = p.id_paciente
       LEFT JOIN prueba_burnout pb ON p.id_paciente = pb.id_paciente
         AND pb.id_prueba = (
           SELECT MAX(pb2.id_prueba) 
           FROM prueba_burnout pb2 
           WHERE pb2.id_paciente = p.id_paciente
         )
       WHERE e.id_psicologo = ? AND e.estado = 'activo'
       GROUP BY COALESCE(pb.nivel_burnout, 'sin_evaluar')`,
      [idPsicologo]
    );

    // Organizar datos
    const niveles = {
      bajo: 0,
      medio: 0,
      alto: 0,
      sin_evaluar: 0,
    };

    distribucion.forEach((d) => {
      niveles[d.nivel] = d.cantidad;
    });

    const totalPacientes = Object.values(niveles).reduce((sum, val) => sum + val, 0);


    // Obtener lista de pacientes por nivel (para detalle)
    const pacientesPorNivel = await db.query(
      `SELECT 
        p.id_paciente,
        CONCAT(u.nombre, ' ', u.paterno) as nombre,
        COALESCE(pb.nivel_burnout, 'sin_evaluar') as nivel,
        pb.puntaje_agotamiento,
        pb.puntaje_desvinculacion,
        pb.fecha_hora as fecha_ultimo_test
       FROM expediente e
       JOIN paciente p ON e.id_paciente = p.id_paciente
       JOIN usuario u ON p.id_usuario = u.id_usuario
       LEFT JOIN prueba_burnout pb ON p.id_paciente = pb.id_paciente
         AND pb.id_prueba = (
           SELECT MAX(pb2.id_prueba) 
           FROM prueba_burnout pb2 
           WHERE pb2.id_paciente = p.id_paciente
         )
       WHERE e.id_psicologo = ? AND e.estado = 'activo'
       ORDER BY 
         CASE COALESCE(pb.nivel_burnout, 'sin_evaluar')
           WHEN 'alto' THEN 1
           WHEN 'medio' THEN 2
           WHEN 'bajo' THEN 3
           ELSE 4
         END`,
      [idPsicologo]
    );

    // Respuesta con datos para la gráfica
    res.json({
      total_pacientes: totalPacientes,
      distribucion: {
        bajo: {
          cantidad: niveles.bajo,
          porcentaje: totalPacientes > 0 ? Math.round((niveles.bajo / totalPacientes) * 100) : 0,
        },
        medio: {
          cantidad: niveles.medio,
          porcentaje: totalPacientes > 0 ? Math.round((niveles.medio / totalPacientes) * 100) : 0,
        },
        alto: {
          cantidad: niveles.alto,
          porcentaje: totalPacientes > 0 ? Math.round((niveles.alto / totalPacientes) * 100) : 0,
        },
        sin_evaluar: {
          cantidad: niveles.sin_evaluar,
          porcentaje: totalPacientes > 0 ? Math.round((niveles.sin_evaluar / totalPacientes) * 100) : 0,
        },
      },
      // Datos listos para Chart.js (gráfica de pastel/dona)
      grafica: {
        tipo: "pastel",
        titulo: "Distribución de Pacientes por Nivel de Burnout",
        labels: ["Bajo", "Medio", "Alto", "Sin evaluar"],
        datasets: [
          {
            data: [niveles.bajo, niveles.medio, niveles.alto, niveles.sin_evaluar],
            backgroundColor: ["#4CAF50", "#FF9800", "#f44336", "#9E9E9E"],
            borderWidth: 1,
          },
        ],
      },
      // Lista detallada de pacientes
      pacientes: pacientesPorNivel,
    });
  } catch (error) {
    console.error("Error obteniendo burnout general:", error);
    res.status(500).json({
      error: "Error obteniendo datos",
      message: error.message,
    });
  }
});

module.exports = router;
