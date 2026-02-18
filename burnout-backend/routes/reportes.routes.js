// RUTAS DE EXPORTACIÓN A EXCEL
// routes/reportes.routes.js
//
// Genera reportes en formato Excel (.xlsx) para el psicólogo.
//
// Reportes disponibles:
// - Reporte psicológico completo de un paciente

const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");

// FUNCIÓN AUXILIAR: Obtener id_psicologo del usuario autenticado
async function obtenerIdPsicologo(userId) {
  const psicologo = await db.queryOne(
    "SELECT id_psicologo FROM psicologo WHERE id_usuario = ?",
    [userId],
  );
  return psicologo ? psicologo.id_psicologo : null;
}

// FUNCIÓN AUXILIAR: Verificar que el paciente está asignado al psicólogo
async function verificarPacienteAsignado(idPsicologo, idPaciente) {
  const expediente = await db.queryOne(
    `SELECT id_paciente FROM expediente 
     WHERE id_psicologo = ? AND id_paciente = ?`,
    [idPsicologo, idPaciente],
  );
  return expediente !== null;
}

// GET /api/reportes/paciente/:id
// Genera un reporte psicológico completo del paciente en formato Excel
// Incluye:
// - Datos personales del paciente
// - Resultados de tests OLBI (inicial y final)
// - Progreso por módulo y actividades
// - Historial de citas
// - Logros obtenidos
router.get("/paciente/:id", authenticate.psicologo, async (req, res) => {
  try {
    const { id } = req.params;
    const idPsicologo = await obtenerIdPsicologo(req.user.id);

    if (!idPsicologo) {
      return res.status(404).json({ error: "Psicólogo no encontrado" });
    }

    // Verificar que el paciente está asignado
    const asignado = await verificarPacienteAsignado(idPsicologo, id);

    if (!asignado) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Este paciente no está asignado a ti",
      });
    }

    // 1. OBTENER DATOS DEL PACIENTE
    const paciente = await db.queryOne(
      `SELECT
            p.id_paciente,
            u.nombre,
            u.paterno,
            u.materno,
            u.correo,
            p.matricula,
            e.fecha_apertura,
            e.estado as estado_expediente
        FROM paciente p
        JOIN usuario u ON p.id_usuario = u.id_usuario
        JOIN expediente e ON p.id_paciente = e.id_paciente
        WHERE p.id_paciente =?`,
      [id],
    );

    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // 2. OBTENER DATOS DEL PSICÓLOGO
    const psicologo = await db.queryOne(
      `SELECT
            u.nombre,
            u.paterno,
            u.materno,
            ps.cedula_profesional
        FROM psicologo ps
        JOIN usuario u ON ps.id_usuario = u.id_usuario
        WHERE ps.id_psicologo =?`,
      [idPsicologo],
    );

    // 3. OBTENER RESULTADOS DE TESTS OLBI
    const tests = await db.query(
      `SELECT
            tipo_prueba,
            fecha_hora,
            puntaje_agotamiento,
            puntaje_desvinculacion,
            nivel_burnout
        FROM prueba_burnout
        WHERE id_paciente =?
        ORDER BY fecha_hora ASC`,
      [id],
    );

    // 4. OBTENER PROGRESO POR MÓDULO
    const modulos = await db.query(
      `SELECT 
            m.titulo,
            m.orden,
            COALESCE (pm.progreso,0) as porcentaje,
            COALESCE (pm.estado, 'bloqueado') as estado,
            pm.fecha_inicio,
            pm.fecha_fin
        FROM modulo m
        LEFT JOIN progreso_modulo pm ON m.id_modulo = pm.id_modulo AND pm.id_paciente =? ORDER BY m.orden ASC`,
      [id],
    );

    //5. OBTENER ACTIVIDADES COMPLETADAS
    const actividades = await db.query(
      `SELECT 
        a.titulo,
        m.titulo as modulo,
        cat.nombre_tipo as tipo,
        pa.fecha_inicio,
        pa.fecha_terminada,
        pa.estado
       FROM progreso_actividad pa
       JOIN actividad a ON pa.id_actividad = a.id_actividad
       JOIN modulo m ON a.id_modulo = m.id_modulo
       LEFT JOIN cat_actividad cat ON a.id_tipo = cat.id_tipo
       WHERE pa.id_paciente = ?
       ORDER BY pa.fecha_terminada DESC`,
      [id],
    );

    // 6. OBTENER HISTORIAL DE CITAS

    const citas = await db.query(
      `SELECT
            c.fecha_cita,
            c.hora_cita,
            cat.tipo_cita,
            c.estado,
            c.observaciones
        FROM citas c
        JOIN cat_cita cat ON c.id_categoria = cat.id_categoria
        WHERE c.id_paciente =? AND c.id_psicologo =?
        ORDER BY c.fecha_cita DESC, c.hora_cita DESC`,
      [id, idPsicologo],
    );

    // 7. OBTENER LOGROS
    const logros = await db.query(
      `SELECT
            l.nombre,
            l.descripcion,
            c.tipo as categoria,
            pl.fecha_obtencion
        FROM paciente_logro pl
        JOIN logro l ON pl.id_logro = l.id_logro
        JOIN cat_logro c ON l.id_cat_logro = c.id_cat_logro
        WHERE pl.id_paciente =?
        ORDER BY pl.fecha_obtencion DESC`,
      [id],
    );

    // CREAR ARCHIVO EXCEL
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BurnOut App";
    workbook.created = new Date();
    //...............................
    // HOJA 1: Resumen del paciente
    //...............................
    const hojaResumen = workbook.addWorksheet("Resumen", {
      properties: { tabColor: { argb: "4CAF50" } },
    });

    //Titulo
    hojaResumen.mergeCells("A1:E1");
    hojaResumen.getCell("A1").value = "REPORTE PSICOLÓGICO DEL PACIENTE";
    hojaResumen.getCell("A1").font = {
      size: 16,
      bold: true,
      color: { argb: "FFFFFF" },
    };
    hojaResumen.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4CAF50" },
    };
    hojaResumen.getCell("A1").alignment = { horizontal: "center" };

    //fecha del reporte
    hojaResumen.mergeCells("A2:E2");
    hojaResumen.getCell("A2").value =
      `Fecha de generación: ${new Date().toLocaleDateString("es-MX")}`;
    hojaResumen.getCell("A2").alignment = { horizontal: "center" };

    //Datos del paciente
    hojaResumen.getCell("A4").value = "DATOS DEL PACIENTE";
    hojaResumen.getCell("A4").font = { bold: true, size: 12 };

    const nombreCompleto =
      `${paciente.nombre} ${paciente.paterno} ${paciente.materno}`.trim();

    hojaResumen.getCell("A5").value = "Nombre: ";
    hojaResumen.getCell("B5").value = nombreCompleto;
    hojaResumen.getCell("A6").value = "Matricula: ";
    hojaResumen.getCell("B6").value = paciente.matricula;
    hojaResumen.getCell("A7").value = "Correo: ";
    hojaResumen.getCell("B7").value = paciente.correo;
    hojaResumen.getCell("A8").value = "Fecha de registro: ";
    hojaResumen.getCell("B8").value = new Date(
      paciente.fecha_apertura,
    ).toLocaleDateString("es-MX");
    hojaResumen.getCell("A9").value = "Estado: ";
    hojaResumen.getCell("B9").value = paciente.estado_expediente;

    //DATOS DEL PSICOLOGO
    hojaResumen.getCell("A11").value = "PSICÓLOGO RESPONSABLE";
    hojaResumen.getCell("A11").font = { bold: true, size: 12 };

    const nombrePsicologo =
      `${psicologo.nombre} ${psicologo.paterno} ${psicologo.materno || ""}`.trim();
    hojaResumen.getCell("A12").value = "Nombre:";
    hojaResumen.getCell("B12").value = nombrePsicologo;
    hojaResumen.getCell("A13").value = "Cédula Profesional:";
    hojaResumen.getCell("B13").value = psicologo.cedula_profesional;

    // Resumen de progreso
    hojaResumen.getCell("A15").value = "RESUMEN DE PROGRESO";
    hojaResumen.getCell("A15").font = { bold: true, size: 12 };

    const actividadesCompletadas = actividades.filter(
      (a) => a.estado === "completada",
    ).length;
    const totalActividades = await db.queryOne(
      "SELECT COUNT(*) as total FROM actividad",
    );
    const modulosCompletados = modulos.filter(
      (m) => m.estado === "completado",
    ).length;

    hojaResumen.getCell("A16").value = "Actividades completadas:";
    hojaResumen.getCell("B16").value =
      `${actividadesCompletadas} de ${totalActividades.total}`;
    hojaResumen.getCell("A17").value = "Módulos completados:";
    hojaResumen.getCell("B17").value =
      `${modulosCompletados} de ${modulos.length}`;
    hojaResumen.getCell("A18").value = "Logros obtenidos:";
    hojaResumen.getCell("B18").value = logros.length;
    hojaResumen.getCell("A19").value = "Citas realizadas:";
    hojaResumen.getCell("B19").value = citas.filter(
      (c) => c.estado === "completada",
    ).length;

    // Ajustar ancho de columnas
    hojaResumen.getColumn("A").width = 25;
    hojaResumen.getColumn("B").width = 35;

    //...............................
    // HOJA 2: Resultados de test olbi
    //...............................
    const hojaOLBI = workbook.addWorksheet("Test OLBI", {
      properties: { tabColor: { argb: "FF9800" } },
    });

    //Titulo
    hojaOLBI.mergeCells("A1:E1");
    hojaOLBI.getCell("A1").value = "RESULTADOS TEST OLBI";
    hojaOLBI.getCell("A1").font = {
      size: 14,
      bold: true,
      color: { argb: "FFFFFF" },
    };
    hojaOLBI.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF9800" },
    };
    hojaOLBI.getCell("A1").alignment = { horizontal: "center" };

    //Encabezados
    hojaOLBI.getRow(3).values = [
      "Tipo de Prueba",
      "Fecha",
      "Agotamiento",
      "Desvinculación",
      "Nivel Burnout",
    ];
    hojaOLBI.getRow(3).font = { bold: true };
    hojaOLBI.getRow(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E0E0E0" },
    };

    //Datos del test
    tests.forEach((test, index) => {
      const row = hojaOLBI.getRow(4 + index);
      row.values = [
        test.tipo_prueba === "inicial" ? "Test inicial" : "Test final",
        new Date(test.fecha_hora).toLocaleDateString("es-MX"),
        parseFloat(test.puntaje_agotamiento).toFixed(2),
        parseFloat(test.puntaje_desvinculacion).toFixed(2),
        test.nivel_burnout.toUpperCase(),
      ];

      // Color según nivel
      const colorNivel =
        test.nivel_burnout === "alto"
          ? "FFCDD2"
          : test.nivel_burnout === "medio"
            ? "FFE0B2"
            : "C8E6C9";

      row.getCell(5).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colorNivel },
      };
    });

    if (tests.length >= 2) {
      const inicial = tests.find((t) => t.tipo_prueba === "inicial");
      const final = tests.find((t) => t.tipo_prueba === "final");

      if (inicial && final) {
        const filaComparacion = tests.length + 6;

        hojaOLBI.getCell(`A${filaComparacion}`).value = "COMPARACIÓN";
        hojaOLBI.getCell(`A${filaComparacion}`).font = { bold: true };

        const cambioAgot =
          parseFloat(final.puntaje_agotamiento) -
          parseFloat(inicial.puntaje_agotamiento);
        const cambioDesv =
          parseFloat(final.puntaje_desvinculacion) -
          parseFloat(inicial.puntaje_desvinculacion);

        hojaOLBI.getCell(`A${filaComparacion + 1}`).value =
          "Cambio en Agotamiento:";
        hojaOLBI.getCell(`B${filaComparacion + 1}`).value =
          cambioAgot.toFixed(2);
        hojaOLBI.getCell(`C${filaComparacion + 1}`).value =
          cambioAgot < 0
            ? "↓ Mejoró"
            : cambioAgot > 0
              ? "↑ Empeoró"
              : "= Igual";

        hojaOLBI.getCell(`A${filaComparacion + 2}`).value =
          "Cambio en Desvinculación:";
        hojaOLBI.getCell(`B${filaComparacion + 2}`).value =
          cambioDesv.toFixed(2);
        hojaOLBI.getCell(`C${filaComparacion + 2}`).value =
          cambioDesv < 0
            ? "↓ Mejoró"
            : cambioDesv > 0
              ? "↑ Empeoró"
              : "= Igual";
      }
    }

    // Ajustar columnas
    hojaOLBI.columns.forEach((col) => (col.width = 18));

    //..............................
    // HOJA 3: Progreso por Módulos
    //..............................
    const hojaModulos = workbook.addWorksheet("Progreso Módulos", {
      properties: { tabColor: { argb: "2196F3" } },
    });

    // Título
    hojaModulos.mergeCells("A1:E1");
    hojaModulos.getCell("A1").value = "PROGRESO POR MÓDULOS";
    hojaModulos.getCell("A1").font = {
      size: 14,
      bold: true,
      color: { argb: "FFFFFF" },
    };
    hojaModulos.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2196F3" },
    };
    hojaModulos.getCell("A1").alignment = { horizontal: "center" };

    // Encabezados
    hojaModulos.getRow(3).values = [
      "Módulo",
      "Título",
      "Progreso",
      "Estado",
      "Fecha de inicio",
      "Fecha fin",
    ];
    hojaModulos.getRow(3).font = { bold: true };
    hojaModulos.getRow(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E0E0E0" },
    };

    //Datos
    modulos.forEach((modulo, index) => {
      const row = hojaModulos.getRow(4 + index);
      row.values = [
        `Módulo ${modulo.orden}`,
        modulo.titulo,
        `${modulo.porcentaje}%`,
        modulo.estado,
        modulo.fecha_inicio
          ? new Date(modulo.fecha_inicio).toLocaleDateString("es-MX")
          : "-",
        modulo.fecha_fin
          ? new Date(modulo.fecha_fin).toLocaleDateString("es-MX")
          : "-",
      ];

      // Color según estado
      const colorEstado =
        modulo.estado === "completado"
          ? "C8E6C9"
          : modulo.estado === "en_progreso"
            ? "FFE0B2"
            : "E0E0E0";

      row.getCell(4).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colorEstado },
      };
    });

    hojaModulos.columns.forEach((col) => (col.width = 18));

    //..............................
    // HOJA 3: Historial de citas
    //..............................

    const hojaCitas = workbook.addWorksheet("Historial Citas", {
      properties: { tabColor: { argb: "9C27B0" } },
    });

    // Título
    hojaCitas.mergeCells("A1:E1");
    hojaCitas.getCell("A1").value = "HISTORIAL DE CITAS";
    hojaCitas.getCell("A1").font = {
      size: 14,
      bold: true,
      color: { argb: "FFFFFF" },
    };
    hojaCitas.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "9C27B0" },
    };
    hojaCitas.getCell("A1").alignment = { horizontal: "center" };

    // Encabezados en la fila 3
    hojaCitas.getRow(3).values = [
      "Fecha",
      "Hora",
      "Tipo",
      "Estado",
      "Observaciones",
    ];
    hojaCitas.getRow(3).font = { bold: true };
    hojaCitas.getRow(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E0E0E0" },
    };

    // Datos
    citas.forEach((cita, index) => {
      const row = hojaCitas.getRow(4 + index);
      row.values = [
        new Date(cita.fecha_cita).toLocaleDateString("es-MX"),
        cita.hora_cita,
        cita.tipo_cita,
        cita.estado,
        cita.observaciones || "-",
      ];

      // Color según estado
      const colorEstado =
        cita.estado === "completada"
          ? "C8E6C9"
          : cita.estado === "cancelada"
            ? "FFCDD2"
            : cita.estado === "no_asistio"
              ? "FFE0B2"
              : "E3F2FD";

      row.getCell(4).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colorEstado },
      };
    });

    // Espacio
    hojaCitas.getColumn("A").width = 15;
    hojaCitas.getColumn("B").width = 10;
    hojaCitas.getColumn("C").width = 18;
    hojaCitas.getColumn("D").width = 15;
    hojaCitas.getColumn("E").width = 40;

    //..............................
    // HOJA 5: Logros
    //..............................

    const hojaLogros = workbook.addWorksheet("Logros", {
      properties: { tabColor: { argb: "FFC107" } },
    });

    // Título
    hojaLogros.mergeCells("A1:D1");
    hojaLogros.getCell("A1").value = "LOGROS OBTENIDOS";
    hojaLogros.getCell("A1").font = {
      size: 14,
      bold: true,
      color: { argb: "FFFFFF" },
    };
    hojaLogros.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC107" },
    };
    hojaLogros.getCell("A1").alignment = { horizontal: "center" };

    // Encabezados
    hojaLogros.getRow(3).values = [
      "Logro",
      "Descripción",
      "Categoría",
      "Fecha Obtenido",
    ];
    hojaLogros.getRow(3).font = { bold: true };
    hojaLogros.getRow(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E0E0E0" },
    };

    // Datos
    if (logros.length > 0) {
      logros.forEach((logro, index) => {
        const row = hojaLogros.getRow(4 + index);
        row.values = [
          logro.nombre,
          logro.descripcion,
          logro.categoria,
          new Date(logro.fecha_obtencion).toLocaleDateString("es-MX"),
        ];
      });
    } else {
      hojaLogros.getCell("A4").value = "No ha obtenido logros aún";
    }

    hojaLogros.columns.forEach((col) => (col.width = 25));

    // ENVIAR ARCHIVO EXCEL
    const nombreArchivo = `Reporte_${paciente.paterno}_${paciente.nombre}_${new Date().toISOString().split("T")[0]}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch {
    console.error("Error generando reporte:", error);
    res.status(500).json({
      error: "Error generando reporte",
      message: error.message,
    });
  }
});

module.exports = router;
