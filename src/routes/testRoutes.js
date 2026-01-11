const express = require("express");
const router = express.Router();
const { query, testConnection } = require("../config/database");

router.get("/connection", async (req, res, next) => {
  try {
    const connected = await testConnection();
    if (connected) {
      res.json({ success: true, message: "Conexión exitosa a PostgreSQL" });
    } else {
      res.status(500).json({ success: false, message: "Error de conexión" });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/tables", async (req, res, next) => {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    res.json({ success: true, tables: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post("/setup", async (req, res, next) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS producto (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        unit VARCHAR(30) NOT NULL,
        qty INTEGER DEFAULT 0,
        price DECIMAL(10, 2) DEFAULT 0,
        estado VARCHAR(20) DEFAULT 'Activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        tipoCliente VARCHAR(20) NOT NULL CHECK (tipoCliente IN ('Natural', 'Jurídico')),
        nombres VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100),
        email VARCHAR(100) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        direccion VARCHAR(200) NOT NULL,
        ciudad VARCHAR(50) NOT NULL,
        nit VARCHAR(20),
        documento VARCHAR(20),
        totalCompras DECIMAL(15, 2) DEFAULT 0,
        estado VARCHAR(20) DEFAULT 'Activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    res.json({ success: true, message: "Tablas creadas exitosamente" });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const productos = await query("SELECT * FROM productos");
    const clientes = await query("SELECT * FROM clientes");
    res.json({
      success: true,
      data: {
        productos: productos.rows,
        clientes: clientes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
