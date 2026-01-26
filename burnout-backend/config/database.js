const mysql = require("mysql2");
require("dotenv").config();

//Crear pool de conexiones para mejorar el rendimiento
/* El Pool mantiene un grupo de conexiones abiertas y listas para ser usadas. Cuando alguien necesita datos, "toma prestada" una conexión, la usa y la devuelve al grupo.*/
const pool = mysql.createPool({
  //Donde esta la bd y quien la puede usar
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "burnout",
  //Tiene un limite de 10 conexiones, si se llena, en vez de mandar un error, espera a que alguien se desconecte del pool
  waitForConnections: true,
  //Numero maximo del pool de conexiones
  connectionLimit: 10,
  //Fila infinita, no hay limite de espera
  queueLimit: 0,
  //Evita que la conexion se cierre por inactividad
  enableKeepAlive: true,
  //El envio de paquetes inicia al abrir la conexion
  keepAliveInitialDelay: 0,
});

//creamos una promesa para usar async/await
const promisePool = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error al conectar con MySQL", err.message);
    if (err.code == "ECONNREFUSED") {
      console.error("Verifica que MySQL este corriendo");
      console.error("Comando: sudo service mysql start");
    }
    if (err.code == "ER_ACCESS_DENIED_ERROR") {
      console.error("Verifica usuario y contrasena en .env");
    }
    if (err.code == "ER_BAD_DB_ERROR") {
      console.error("No existe DB");
    }
  } else {
    console.log("Conexion exitosa con MySQL", process.env.DB_NAME);
    connection.release();
  }
});

//funciones helper para queries

const db = {
  //query generica que retorna array de resultados
  query: async (sql, params = []) => {
    try {
      const [rows] = await promisePool.query(sql, params);
      return rows;
    } catch (error) {
      console.error("Error en query", error.message);
      throw error;
    }
  },

  //Obtiene solo el primer resultado
  queryOne: async (sql, params = []) => {
    try {
      const [rows] = await promisePool.query(sql, params);
      return rows[0] || null;
    } catch (error) {
      console.error("Error en queryOne", error.message);
      throw error;
    }
  },

  //Ejecuta varios queries en transaccion (uno despues del otro)

  transaction: async (callback) => {
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Cerrar pool (útil para tests)
  close: () => {
    return pool.end();
  },
};

module.exports = { pool, promisePool, db };
