const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

//GET /api/test-olbi/preguntas
//Obtener todas las preguntas del test OLBI
router.get("/preguntas", authenticate.required, async (req, res) => {
  try {
    const preguntas = await db.query(
      `
      SELECT 
        id_pregunta,
        pregunta,
        categoria,
        orden
      FROM pregunta_burnout
      ORDER BY orden ASC
      `,
    );

    // Opciones de respuesta del OLBI (escala Likert 1-4)
    const opcionesRespuesta = [
      { valor: 1, texto: "Totalmente en desacuerdo" },
      { valor: 2, texto: "En desacuerdo" },
      { valor: 3, texto: "De acuerdo" },
      { valor: 4, texto: "Totalmente de acuerdo" },
    ];

    res.json({
      total_preguntas: preguntas.length,
      instrucciones:
        "Responde cada pregunta según cómo te has sentido en las últimas semanas respecto a tu trabajo/estudios.",
      opciones_respuesta: opcionesRespuesta,
      preguntas,
    });
  } catch (error) {
    console.error("Error obteniendo preguntas:", error);
    res.status(500).json({
      error: "Error obteniendo preguntas",
      message: error.message,
    });
  }
});

//POST /api/test-olbi/responder
//Guarda la respuesta y calcula el resultado

router.post(
  "/responder",
  authenticate.paciente,
  [
    body("tipo_prueba")
      .isIn(["inicial", "final"])
      .withMessage("Error al definir tipo de prueba, final o inicial"),
    body("respuestas")
      .isArray({ min: 16, max: 16 })
      .withMessage("Debe responder las 16 preguntas"),
    body("respuestas.*.id_pregunta")
      .isInt()
      .withMessage("ID de pregunta incorrecto"),
    body("respuestas.*.respuesta")
      .isInt({ min: 1, max: 4 })
      .withMessage("Escoga un valor entre 1 y 4"),
  ],

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos invalidos",
          errors: errors.array(),
        });
      }

      const { tipo_prueba, respuestas } = req.body;

      //obtenemos el id del paciente
      const paciente = await db.queryOne(
        `
        SELECT id_paciente FROM paciente WHERE id_usuario = ?
        `,
        [req.user.id],
      );

      if (!paciente) {
        return res.status(404).json({
          error: "Paciente no encontrado",
        });
      }

      //Verificamos si ya realizo esta prueba(inicial o final)
      const pruebaExistente = await db.queryOne(
        "SELECT id_prueba FROM prueba_burnout WHERE id_paciente =? AND tipo_prueba =?",
        [paciente.id_paciente, tipo_prueba],
      );

      if (pruebaExistente) {
        return res.status(400).json({
          error: "Prueba ya realizada",
          message: `Ya realizaste la prueba ${tipo_prueba}. No puedes repetirla.`,
        });
      }

      //Si es la prueba final, verificamos que haya completado la inicial

      if (tipo_prueba === "final") {
        //hace una busqueda de la prueba inicial en la bd de acuerdo al id del paciente
        const pruebaInicial = await db.queryOne(
          "SELECT id_prueba FROM prueba_burnout WHERE id_paciente =? AND tipo_prueba ='inicial'",
          [paciente.id_paciente],
        );

        if (!pruebaInicial) {
          return res.status(400).json({
            error: "Prueba inicial requerida",
            message: "Debes completar la prueba inicial antes de la final",
          });
        }
      }

      //Obtener informacion de las preguntas para calcular los puntajes
      //hacemos una busqueda de los valores id_pregunta, categoria, es_reversa
      //crea un array de la busqueda
      const preguntasInfo = await db.query(
        "SELECT id_pregunta,categoria, es_reversa FROM pregunta_burnout",
      );

      //El proceso: El código recorre cada objeto p dentro del array y lo guarda dentro de preguntasMap usando el id_pregunta como la llave (key). => diccionario
      //Ejemplo: "1": { "id_pregunta": 1, "categoria": "Agotamiento", "es_reversa": false },
      const preguntasMap = {};
      preguntasInfo.forEach((p) => {
        preguntasMap[p.id_pregunta] = p;
      });

      //Calculamos los puntajes
      let puntajeAgotamiento = 0;
      let puntajeDesvinculacion = 0;
      let countAgotamiento = 0;
      let countDesvinculacion = 0;

      respuestas.forEach((r) => {
        const pregunta = preguntasMap[r.id_pregunta];
        if (!pregunta) return;

        // si es reversa, invertir el puntaje (1->4 , 2->3,3->2,4->1)
        let puntaje = r.respuesta;
        if (pregunta.es_reversa) {
          puntaje = 5 - puntaje;
        }

        if (pregunta.categoria === "agotamiento") {
          puntajeAgotamiento += puntaje;
          countAgotamiento++;
        } else if (pregunta.categoria === "desvinculacion") {
          puntajeDesvinculacion += puntaje;
          countDesvinculacion++;
        }
      });

      //Calcular promedios (escala 1-4)
      const promedioAgotamiento =
        countAgotamiento > 0 ? puntajeAgotamiento / countAgotamiento : 0;
      const promedioDesvinculacion =
        countDesvinculacion > 0
          ? puntajeDesvinculacion / countDesvinculacion
          : 0;
      // Puntaje total (promedio de ambas dimensiones)
      const puntajeTotal =
        Math.round(((promedioAgotamiento + promedioDesvinculacion) / 2) * 100) /
        100;

      //Determinamos el nivel de burnout segun la literatura OLBI

      let nivelBurnout;
      const promedioGeneral =
        (promedioAgotamiento + promedioDesvinculacion) / 2;

      if (promedioGeneral < 2.0) {
        nivelBurnout = "bajo";
      } else if (promedioGeneral < 2.75) {
        nivelBurnout = "medio";
      } else {
        nivelBurnout = "alto";
      }

      //Guardamos en la base de datos usando una transaccion
      //la transaccion asegura que se guarden los datos en la bd de forma segura y confiable, o se guardan o no se guardan(falla)
      const resultado = await db.transaction(async (connection) => {
        //insertamos los datos de la prueba que hizo el paciente en la bd
        const [pruebaResult] = await connection.query(
          `
            INSERT INTO prueba_burnout(id_paciente, tipo_prueba, puntaje, puntaje_agotamiento, puntaje_desvinculacion, nivel_burnout)
            VALUES (?,?,?,?,?,?)
            `,
          [
            paciente.id_paciente,
            tipo_prueba,
            Math.round(puntajeTotal * 100),
            promedioAgotamiento.toFixed(2),
            promedioDesvinculacion.toFixed(2),
            nivelBurnout,
          ],
        );

        const idPrueba = pruebaResult.insertId;

        //insertamos las respuestas idividuales de cada pregunta en la tabla de respuestas_burnout
        for (const r of respuestas) {
          await connection.query(
            "INSERT INTO respuesta_burnout (id_prueba, id_pregunta, respuesta) VALUES (?,?,?)",
            [idPrueba, r.id_pregunta, r.respuesta],
          );
        }

        //actualizar flag del paciente
        if (tipo_prueba === "inicial") {
          await connection.query(
            "UPDATE paciente SET test_olbi_inicial_completado = TRUE WHERE id_paciente =?",
            [paciente.id_paciente],
          );
        } else {
          await connection.query(
            "UPDATE paciente SET test_olbi_final_completado = TRUE WHERE id_paciente =?",
            [paciente.id_paciente],
          );
        }

        return { idPrueba };
      });

      res.status(201).json({
        message: "Test completado exitosamente",
        resultado: {
          id_prueba: resultado.idPrueba,
          tipo_prueba,
          puntaje_agotamiento: promedioAgotamiento.toFixed(2),
          puntaje_desvinculacion: promedioDesvinculacion.toFixed(2),
          nivel_burnout: nivelBurnout,
          interpretacion: obtenerInterpretacion(
            nivelBurnout,
            promedioAgotamiento,
            promedioDesvinculacion,
          ),
        },
      });
    } catch (error) {
      console.error("Error guardando test:", error);
      res.status(500).json({
        error: "Error guardando test",
        message: error.message,
      });
    }
  },
);

//GET /api/test-olbi/resultado/:pacienteId
//Obtenemos el resultado mas reciente del paciente

router.get(
  "/resultado/:pacienteId",
  authenticate.required,
  async (req, res) => {
    try {
      const { pacienteId } = req.params;

      //verificamos que sea el paciente que vea esos resultados y no de otros pacientes
      if (req.user.rol === "paciente") {
        const paciente = await db.queryOne(
          "SELECT id_paciente FROM paciente WHERE id_usuario = ?",
          [req.user.id],
        );

        if (!paciente || paciente.id_paciente !== parseInt(pacienteId)) {
          return res.status(403).json({
            error: "No tienes permiso para ver estos resultados",
          });
        }
      }

      //obtenemos las pruebas que ha realizado

      const pruebas = await db.query(
        `
      SELECT
        id_prueba,
        tipo_prueba,
        fecha_hora,
        puntaje,
        puntaje_agotamiento,
        puntaje_desvinculacion,
        nivel_burnout
      FROM prueba_burnout
      WHERE id_paciente = ?
      ORDER BY fecha_hora DESC
      `,
        [pacienteId],
      );

      if (pruebas.length === 0) {
        return res.status(404).json({
          error: "No se encontraron resultados",
          message: "El paciente no ha realizado ninguna prueba",
        });
      }

      //Separamos la prueba inicial y final
      const pruebaInicial = pruebas.find((p) => p.tipo_prueba === "inicial");
      const pruebaFinal = pruebas.find((p) => p.tipo_prueba === "final");

      //calculamos comparacion
      let comparacion = null;
      if (pruebaInicial && pruebaFinal) {
        comparacion = {
          cambio_agotamiento: (
            pruebaFinal.puntaje_agotamiento - pruebaInicial.puntaje_agotamiento
          ).toFixed(2),
          cambio_desvinculacion: (
            pruebaFinal.puntaje_desvinculacion -
            pruebaInicial.puntaje_desvinculacion
          ).toFixed(2),
          mejoria:
            pruebaFinal.puntaje_agotamiento <
              pruebaInicial.puntaje_agotamiento &&
            pruebaFinal.puntaje_desvinculacion <
              pruebaFinal.puntaje_desvinculacion,
        };
      }

      res.json({
        paciente_id: parseInt(pacienteId),
        prueba_inicial: pruebaInicial
          ? {
              ...pruebaInicial,
              interpretacion: obtenerInterpretacion(
                pruebaInicial.nivel_burnout,
                pruebaInicial.puntaje_agotamiento,
                pruebaInicial.puntaje_desvinculacion,
              ),
            }
          : null,
        prueba_final: pruebaFinal
          ? {
              ...pruebaFinal,
              interpretacion: obtenerInterpretacion(
                pruebaFinal.nivel_burnout,
                pruebaFinal.puntaje_agotamiento,
                pruebaFinal.puntaje_desvinculacion,
              ),
            }
          : null,
        comparacion,
      });
    } catch (error) {
      console.error("Error obteniendo resultados:", error);
      res.status(500).json({
        error: "Error obteniendo resultados",
        message: error.message,
      });
    }
  },
);

//GET /api/test-olbi/estado
//verificar si el paciente ya realizo las pruebas

router.get("/estado", authenticate.paciente, async (req, res) => {
  try {
    const paciente = await db.queryOne(
      `
      SELECT 
        id_paciente,
        test_olbi_inicial_completado,
        test_olbi_final_completado
      FROM paciente
      WHERE id_usuario = ?
      `,
      [req.user.id],
    );

    if (!paciente) {
      return res.status(404).json({
        error: "Paciente no encontrado",
      });
    }

    // Obtener fechas de las pruebas si existen
    const pruebas = await db.query(
      `
      SELECT tipo_prueba, fecha_hora, nivel_burnout
      FROM prueba_burnout
      WHERE id_paciente = ?
      `,
      [paciente.id_paciente],
    );

    const pruebaInicial = pruebas.find((p) => p.tipo_prueba === "inicial");
    const pruebaFinal = pruebas.find((p) => p.tipo_prueba === "final");

    res.json({
      prueba_inicial: {
        completada: paciente.test_olbi_inicial_completado === 1,
        fecha: pruebaInicial ? pruebaInicial.fecha_hora : null,
        nivel_burnout: pruebaInicial ? pruebaInicial.nivel_burnout : null,
      },
      prueba_final: {
        completada: paciente.test_olbi_final_completado === 1,
        fecha: pruebaFinal ? pruebaFinal.fecha_hora : null,
        nivel_burnout: pruebaFinal ? pruebaFinal.nivel_burnout : null,
        disponible: paciente.test_olbi_inicial_completado === 1,
      },
    });
  } catch (error) {
    console.error("Error obteniendo estado:", error);
    res.status(500).json({
      error: "Error obteniendo estado",
      message: error.message,
    });
  }
});

//Funcion para obtener la interpretacion del resultado del test de burnout

function obtenerInterpretacion(nivel, agotamiento, desvinculacion) {
  const interpretaciones = {
    bajo: {
      general:
        "Tus niveles de burnout son bajos. Continúa manteniendo un equilibrio saludable entre tus actividades y tu bienestar personal.",
      recomendacion:
        "Sigue practicando técnicas de autocuidado y mantén límites saludables.",
    },
    medio: {
      general:
        "Presentas niveles moderados de burnout. Es importante que tomes medidas preventivas para evitar que aumente.",
      recomendacion:
        "Te recomendamos realizar las actividades del programa y considerar hablar con un profesional si los síntomas persisten.",
    },
    alto: {
      general:
        "Tus niveles de burnout son elevados. Es fundamental que busques apoyo y tomes acciones para mejorar tu bienestar.",
      recomendacion:
        "Te recomendamos completar el programa de actividades y agendar una cita con el psicólogo asignado.",
    },
  };

  const interp = interpretaciones[nivel] || interpretaciones.medio;

  // Agregar detalles específicos
  let detalles = [];
  if (parseFloat(agotamiento) >= 2.5) {
    detalles.push(
      "Muestras signos significativos de agotamiento emocional y físico.",
    );
  }
  if (parseFloat(desvinculacion) >= 2.5) {
    detalles.push(
      "Presentas señales de desvinculación o distanciamiento de tus actividades.",
    );
  }

  return {
    nivel,
    mensaje: interp.general,
    recomendacion: interp.recomendacion,
    detalles:
      detalles.length > 0
        ? detalles
        : ["Tus indicadores están dentro de rangos manejables."],
  };
}

module.exports = router;
