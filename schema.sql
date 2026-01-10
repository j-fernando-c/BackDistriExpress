-- Script para crear las tablas de DistriExpress
-- Ejecutar en PostgreSQL

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    qty INTEGER DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'Activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
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
);

-- Insertar datos de prueba
INSERT INTO productos (name, category, unit, qty, price, estado) VALUES
('Arroz Integral', 'Granos y Cereales', 'Kilos', 10, 4800, 'Activo'),
('Aceite de Oliva', 'Aceites y Vinagres', 'Mililitros', 500, 12900, 'Activo'),
('Harina de Trigo', 'Harinas', 'Libras', 2, 6200, 'Inactivo');

INSERT INTO clientes (tipoCliente, nombres, apellidos, email, telefono, direccion, ciudad, nit, documento, estado) VALUES
('Natural', 'Juan Carlos', 'Pérez García', 'juan.perez@email.com', '3001234567', 'Cra 10 #20-30', 'Medellín', NULL, '1030123456', 'Activo'),
('Jurídico', 'Distribuidora La Central', '', 'contacto@central.com', '3019876543', 'Av. 80 #45-10', 'Bogotá', '900123456-1', NULL, 'Activo');

-- Verificar datos
SELECT * FROM productos;
SELECT * FROM clientes;
