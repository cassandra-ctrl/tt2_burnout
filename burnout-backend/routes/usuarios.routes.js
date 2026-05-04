//RUTAS de gestion de usuarios
//CRUD
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");
const authenticate = require("../middleware/auth.middleware");
const ExcelJS = require("exceljs");

//GET /api/usuarios

router.get("/", authenticate.admin, async (req, res) => {
  try {
    const { rol, activo, search } = req.query;

    let query = `
            SELECT
                u.id_usuario,
                u.nombre,
                u.paterno,
                u.materno,
                u.correo,
                u.rol,
                u.activo,
                CASE
                    WHEN u.rol='paciente' THEN p.id_paciente
                    WHEN u.rol='psicologo' THEN ps.id_psicologo
                    WHEN u.rol='administrador' THEN a.id_administrador
                END as role_id,
                CASE
                    WHEN u.rol = 'paciente' THEN p.matricula
                    WHEN u.rol ='psicologo' THEN ps.cedula_profesional
                    ELSE NULL
                END as identificador
            FROM usuario u
            LEFT JOIN paciente p ON u.id_usuario = p.id_usuario
            LEFT JOIN psicologo ps ON u.id_usuario = ps.id_usuario
            LEFT JOIN administrador a ON u.id_usuario = a.id_usuario
            WHERE 1=1
        `;

    const params = [];

    //filtramos por rol
    if (rol) {
      query += " AND u.rol=?";
      params.push(rol);
    }

    //filtro por estado
    if (activo !== undefined) {
      query += " AND u.activo =?";
      params.push(activo === "true" || activo === "1");
    }

    //busqueda por nombre, correo o matricula/cedula
    if (search) {
      //se usan signos de interrogacion por seguridad, evitamos un SQL Inyection
      query += ` AND (
            u.nombre LIKE ? OR
            u.paterno LIKE ? OR
            u.materno LIKE ? OR
            u.correo LIKE ? OR
            p.matricula LIKE ? OR
            ps.cedula_profesional LIKE ?
        )`;
      //cualquier cosa por la izq o der
      const searchTerm = `%${search}%`;
      //un searchTerm por cada signo ?
      params.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
      );
    }
    //ordenamos por el id de usuario de forma descendiente
    query += " ORDER BY u.id_usuario DESC";

    const usuarios = await db.query(query, params);

    //devolvemos la respuesta en un JSON
    res.json({
      total: usuarios.length,
      usuarios,
    });
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).json({
      error: "Error obteniendo usuarios",
      message: error.message,
    });
  }
});

//GET /api/usuarios/:id
//obtenemos un usuario en espeficio

router.get("/:id", authenticate.admin, async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await db.queryOne(
      `
             SELECT
                u.id_usuario,
                u.nombre,
                u.paterno,
                u.materno,
                u.correo,
                u.rol,
                u.activo,
                CASE
                    WHEN u.rol='paciente' THEN p.id_paciente
                    WHEN u.rol='psicologo' THEN ps.id_psicologo
                    WHEN u.rol='administrador' THEN a.id_administrador
                END as role_id,
                CASE
                    WHEN u.rol = 'paciente' THEN p.matricula
                    WHEN u.rol ='psicologo' THEN ps.cedula_profesional
                    ELSE NULL
                END as identificador,
                p.tutorial_completado,
                p.test_olbi_inicial_completado,
                p.test_olbi_final_completado
            FROM usuario u
            LEFT JOIN paciente p ON u.id_usuario = p.id_usuario
            LEFT JOIN psicologo ps ON u.id_usuario = ps.id_usuario
            LEFT JOIN administrador a ON u.id_usuario = a.id_usuario
            WHERE u.id_usuario =?
            `,
      [id],
    );

    if (!usuario) {
      return res.status(404).json({
        error: "usuario no encontrado",
      });
    }
    res.json({ usuario });
  } catch (error) {
    console.error("Error al obtener usuario", error);
    res.status(500).json({
      error: "Error obteneindo usuario",
      message: error.message,
    });
  }
});

//POST /api/usuarios
//Crear nuevo usuario

router.post(
  "/",
  authenticate.admin,
  [
    body("nombre").trim().notEmpty().withMessage("Nombre requerido"),
    body("paterno").trim().notEmpty().withMessage("Apellido paterno requerido"),
    body("materno").trim().notEmpty().withMessage("Apellido materno requerido"),
    body("correo").isEmail().withMessage("Correo requerido"),
    body("contrasena")
      .isLength({ min: 8 })
      .withMessage("La contrasena debe tener al menos 8 caracteres"),
    body("rol")
      .isIn(["administrador", "psicologo", "paciente"])
      .withMessage("Rol invalido"),
    body("matricula")
      .if(body("rol").equals("paciente"))
      .notEmpty()
      .withMessage("Matricula requerida para paciente"),
    body("cedula_profesional")
      .if(body("rol").equals("psicologo"))
      .notEmpty()
      .withMessage("Cedula profesiona requerida para psicologo"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty) {
        return res.status(400).json({
          error: "Datos invalidos",
          errors: errors.array(),
        });
      }

      const {
        nombre,
        paterno,
        materno,
        correo,
        contrasena,
        rol,
        matricula,
        cedula_profesional,
      } = req.body;

      //hacemos la busqueda del correo
      const existingUser = await db.queryOne(
        "select id_usuario FROM usuario WHERE correo = ?",
        [correo],
      );

      //ya existe el correo?
      if (existingUser) {
        return res.status(400).json({
          error: "Ya existe un usuario con ese correo, intenta con otro.",
        });
      }

      // verificar matrícula duplicada
      if (rol === "paciente" && matricula) {
        const existingMatricula = await db.queryOne(
          "SELECT id_paciente FROM paciente WHERE matricula = ?",
          [matricula],
        );
        if (existingMatricula) {
          return res.status(400).json({
            error: `La matrícula ${matricula} ya está registrada, verifica los datos.`,
          });
        }
      }

      // verificar cédula profesional duplicada
      if (rol === "psicologo" && cedula_profesional) {
        const existingCedula = await db.queryOne(
          "SELECT id_psicologo FROM psicologo WHERE cedula_profesional = ?",
          [cedula_profesional],
        );
        if (existingCedula) {
          return res.status(400).json({
            error: `La cédula profesional ${cedula_profesional} ya está registrada, verifica los datos.`,
          });
        }
      }

      //sino existe, hasheamos la password
      const hashedPassword = await bcrypt.hash(contrasena, 10);

      //creamos el user segun el rol
      const result = await db.transaction(async (connection) => {
        //insertamos el usuario con una consulta
        const [userResult] = await connection.query(
          "INSERT INTO usuario (nombre, paterno, materno, correo, contrasena, rol) VALUES (?,?,?,?,?,?)",
          [nombre, paterno, materno, correo, hashedPassword, rol],
        );

        const userId = userResult.insertId;
        let roleId = null;

        // insertamos si es paciente
        if (rol === "paciente") {
          const [pacienteResult] = await connection.query(
            "INSERT INTO paciente (id_usuario, matricula) VALUES (?,?)",
            [userId, matricula],
          );
          roleId = pacienteResult.insertId;
        } else if (rol === "psicologo") {
          const [psicologoResult] = await connection.query(
            "INSERT INTO psicologo (id_usuario, cedula_profesional) VALUES (?,?)",
            [userId, cedula_profesional],
          );
          roleId = psicologoResult.insertId;
        }

        return { userId, roleId };
      });

      res.status(201).json({
        message: "Usuario creado con exito",
        usuario: {
          id: result.userId,
          roleId: result.roleId,
          nombre,
          paterno,
          materno,
          correo,
          rol,
        },
      });
    } catch (error) {
      console.error("Error al crear usuario", error);

      // Error de entrada duplicada en MySQL (matrícula, cédula u otro UNIQUE)
      if (error.code === "ER_DUP_ENTRY") {
        const campo = error.message.includes("matricula")
          ? "matrícula"
          : error.message.includes("cedula_profesional")
            ? "cédula profesional"
            : error.message.includes("correo")
              ? "correo"
              : "identificador";
        return res.status(400).json({
          error: `Ya existe un usuario con ese ${campo}, verifica los datos.`,
        });
      }

      res.status(500).json({
        error: "El usuario no pudo crearse exitosamente",
        message: error.message,
      });
    }
  },
);

//PUT /api/usuarios/:id
//ACTUALIZAR USUARIO

router.put(
  "/:id",
  authenticate.admin,
  [
    body("nombre").optional().trim().notEmpty(),
    body("paterno").optional().trim().notEmpty(),
    body("materno").optional().trim().notEmpty(),
    body("correo").optional().isEmail(),
    body("activo").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      //no son datos validos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Datos inválidos",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const {
        nombre,
        paterno,
        materno,
        correo,
        activo,
        matricula,
        cedula_profesional,
      } = req.body;

      // Verificar que el usuario existe
      const usuario = await db.queryOne(
        "SELECT * FROM usuario WHERE id_usuario = ?",
        [id],
      );

      if (!usuario) {
        return res.status(404).json({
          error: "Usuario no encontrado",
        });
      }

      //Busqueda de que el correo no pertenezca a otro usuario
      if (correo && correo !== usuario.correo) {
        const existingEmail = await db.queryOne(
          "SELECT id_usuario FROM usuario WHERE correo = ? AND id_usuario != ?",
          [correo, id],
        );

        //ya esta en uso?
        if (existingEmail) {
          return res.status(400).json({
            error: "Correo ya en uso por otro usuario",
          });
        }
      }

        //sino esta en uso, actualizamos los datos

        await db.transaction(async (connection) => {
          const updates = [];
          const params = [];

          if (nombre !== undefined) {
            updates.push("nombre = ?");
            params.push(nombre);
          }
          if (paterno !== undefined) {
            updates.push("paterno = ?");
            params.push(paterno);
          }
          if (materno !== undefined) {
            updates.push("materno = ?");
            params.push(materno);
          }
          if (correo !== undefined) {
            updates.push("correo = ?");
            params.push(correo);
          }
          if (activo !== undefined) {
            updates.push("activo = ?");
            params.push(activo);
          }

          //Si hay actualizaciones, hacemos la modificacion en la bd
          if (updates.length > 0) {
            params.push(id);
            await connection.query(
              `UPDATE usuario SET ${updates.join(", ")} WHERE id_usuario = ?`,
              params,
            );
          }

          // Actualizar datos específicos del rol
          if (usuario.rol === "paciente" && matricula) {
            // verificar que la matrícula no la tenga otro paciente
            const existingMatricula = await connection.query(
              "SELECT id_paciente FROM paciente WHERE matricula = ? AND id_usuario != ?",
              [matricula, id],
            );
            if (existingMatricula[0].length > 0) {
              throw Object.assign(
                new Error(`La matrícula ${matricula} ya está registrada en otro paciente.`),
                { statusCode: 400, esValidacion: true },
              );
            }
            await connection.query(
              "UPDATE paciente SET matricula = ? WHERE id_usuario = ?",
              [matricula, id],
            );
          } else if (usuario.rol === "psicologo" && cedula_profesional) {
            // verificar que la cédula no la tenga otro psicólogo
            const existingCedula = await connection.query(
              "SELECT id_psicologo FROM psicologo WHERE cedula_profesional = ? AND id_usuario != ?",
              [cedula_profesional, id],
            );
            if (existingCedula[0].length > 0) {
              throw Object.assign(
                new Error(`La cédula profesional ${cedula_profesional} ya está registrada en otro psicólogo.`),
                { statusCode: 400, esValidacion: true },
              );
            }
            await connection.query(
              "UPDATE psicologo SET cedula_profesional = ? WHERE id_usuario = ?",
              [cedula_profesional, id],
            );
          }
          res.json({
            message: "Usuario actualizado exitosamente",
          });
        });
      
    } catch (error) {
      console.error("Error actualizando usuario:", error);

      if (error.esValidacion) {
        return res.status(400).json({ error: error.message });
      }

      if (error.code === "ER_DUP_ENTRY") {
        const campo = error.message.includes("matricula")
          ? "matrícula"
          : error.message.includes("cedula_profesional")
            ? "cédula profesional"
            : error.message.includes("correo")
              ? "correo"
              : "identificador";
        return res.status(400).json({
          error: `Ya existe un usuario con ese ${campo}, verifica los datos.`,
        });
      }

      res.status(500).json({
        error: "Error actualizando usuario",
        message: error.message,
      });
    }
  },
);

//DELETE /api/usuarios/:id

router.delete("/:id", authenticate.admin, async (req, res) => {
  try {
    const { id } = req.params;

    //el usuario existe?
    const usuario = await db.queryOne(
      "SELECT * FROM usuario WHERE id_usuario =? ",
      [id],
    );

    //sino existe
    if (!usuario) {
      return res.status(404).json({
        error: "El usuario no existe en la bd",
      });
    }

    //Para no desactivar al admin
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        error: "No puedes desactivar tu propia cuenta",
      });
    }

    /// Eliminar usuario (las tablas relacionadas se eliminan automáticamente por ON DELETE CASCADE)
    await db.query("DELETE FROM usuario WHERE id_usuario = ?", [id]);

    res.json({
      message: "Usuario eliminado permanentemente",
      usuario_eliminado: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({
      error: "Error eliminando usuario",
      message: error.message,
    });
  }
});



// GET /api/usuarios/exportar/pacientes-excel
// Descarga la base de datos de pacientes en formato Excel (RF20)
router.get("/exportar/pacientes-excel", authenticate.admin, async (req, res) => {
  try {
    // Query con todos los datos requeridos por el RF20
    const pacientes = await db.query(`
      SELECT
        p.id_paciente,
        p.matricula,
        u.nombre,
        u.paterno,
        u.materno,
        u.correo,
        u.created_at,
        u.activo,
        p.ultimo_dia_actividad,
        p.racha_maxima,
        e.estado AS estado_tratamiento
      FROM paciente p
      INNER JOIN usuario u ON p.id_usuario = u.id_usuario
      LEFT JOIN expediente e ON p.id_paciente = e.id_paciente
      ORDER BY p.id_paciente ASC
    `);

    // Crear el workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BurnOut App - Sistema Administrativo";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Pacientes");

    // Definir columnas con anchos
    worksheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Boleta", key: "boleta", width: 14 },
      { header: "Nombre completo", key: "nombre", width: 35 },
      { header: "Correo", key: "correo", width: 30 },
      { header: "Fecha de registro", key: "fecha_registro", width: 18 },
      { header: "Estado del tratamiento", key: "estado_tratamiento", width: 22 },
      { header: "Ultima actividad", key: "ultima_actividad", width: 18 },
      { header: "Racha maxima (dias)", key: "racha_maxima", width: 20 },
      { header: "Estado", key: "estado", width: 12 },
    ];

    // Estilo del header (fondo azul, texto blanco)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 24;

    // Agregar filas de datos
    pacientes.forEach((p) => {
      const nombreCompleto = [p.nombre, p.paterno, p.materno]
        .filter(Boolean)
        .join(" ");

      const fechaRegistro = p.created_at
        ? new Date(p.created_at).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "";

      const ultimaActividad = p.ultimo_dia_actividad
        ? new Date(p.ultimo_dia_actividad).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "Sin actividad";

      worksheet.addRow({
        id: p.id_paciente,
        boleta: p.matricula,
        nombre: nombreCompleto,
        correo: p.correo,
        fecha_registro: fechaRegistro,
        estado_tratamiento: p.estado_tratamiento || "Sin expediente",
        ultima_actividad: ultimaActividad,
        racha_maxima: p.racha_maxima || 0,
        estado: p.activo ? "Activo" : "Inactivo",
      });
    });

    // Aplicar bordes a todas las celdas con datos
    const filasConDatos = pacientes.length + 1;
    for (let row = 1; row <= filasConDatos; row++) {
      for (let col = 1; col <= 9; col++) {
        const cell = worksheet.getCell(row, col);
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      }
    }

    // Generar nombre del archivo con la fecha actual
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const anio = hoy.getFullYear();
    const filename = `Pacientes_${dia}-${mes}-${anio}.xlsx`;

    // Configurar respuesta como descarga
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    // Escribir el archivo a la respuesta
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exportando pacientes a Excel:", error);
    res.status(500).json({
      error: "Error generando el archivo Excel",
      message: error.message,
    });
  }
});

module.exports = router;
