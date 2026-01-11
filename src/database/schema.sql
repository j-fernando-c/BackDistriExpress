-- =====================================================
-- 1. CREAR BASE DE DATOS
-- =====================================================

CREATE DATABASE sistema_ventas;

-- Conectarse a la base de datos
\c sistema_ventas;

-- =====================================================
-- 2. EXTENSIÓN UUID
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 3. TABLAS MAESTRAS
-- =====================================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(30) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    estado VARCHAR(20) NOT NULL
);

CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    documento VARCHAR(30) NOT NULL,
    contacto VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    estado VARCHAR(20) NOT NULL
);

CREATE TABLE categoria_productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_rol VARCHAR(50) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL
);

CREATE TABLE permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_permisos VARCHAR(100) NOT NULL,
    url VARCHAR(150) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL
);

-- =====================================================
-- 4. TABLAS DEPENDIENTES
-- =====================================================

CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    categoria_id UUID NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL CHECK (precio > 0),
    cantidad INT NOT NULL DEFAULT 0,
    stock_min INT NOT NULL,
    stock_max INT NOT NULL,
    estado VARCHAR(20) NOT NULL,
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (categoria_id) REFERENCES categoria_productos(id),
    CONSTRAINT chk_stock CHECK (stock_min <= stock_max)
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    rol_id UUID NOT NULL,
    contrasena TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL,
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE detalle_permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permiso_id UUID NOT NULL,
    rol_id UUID NOT NULL,
    CONSTRAINT fk_detalle_permiso_permiso
        FOREIGN KEY (permiso_id) REFERENCES permisos(id),
    CONSTRAINT fk_detalle_permiso_rol
        FOREIGN KEY (rol_id) REFERENCES roles(id),
    CONSTRAINT uq_permiso_rol UNIQUE (permiso_id, rol_id)
);

-- =====================================================
-- 5. COMPRAS
-- =====================================================

CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proveedor_id UUID NOT NULL,
    estado VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    factura_proveedor VARCHAR(50),
    total_compra NUMERIC(10,2) NOT NULL CHECK (total_compra >= 0),
    CONSTRAINT fk_compra_proveedor
        FOREIGN KEY (proveedor_id) REFERENCES proveedor(id)
);

CREATE TABLE detalle_compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario > 0),
    CONSTRAINT fk_detalle_compra_compra
        FOREIGN KEY (compra_id) REFERENCES compra(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_compra_producto
        FOREIGN KEY (producto_id) REFERENCES producto(id)
);

-- =====================================================
-- 6. VENTAS
-- =====================================================

CREATE TABLE estado_ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estado VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL,
    fecha DATE NOT NULL,
    total_venta NUMERIC(10,2) NOT NULL CHECK (total_venta >= 0),
    domicilio_id UUID,
    estado_id UUID NOT NULL,
    estado VARCHAR(20) NOT NULL,
    CONSTRAINT fk_venta_cliente
        FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT fk_venta_estado
        FOREIGN KEY (estado_id) REFERENCES estado_venta(id)
);

CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL,
    estado VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    cantidad_productos INT NOT NULL CHECK (cantidad_productos > 0),
    total_pedido NUMERIC(10,2) NOT NULL CHECK (total_pedido >= 0),
    CONSTRAINT fk_pedido_producto
        FOREIGN KEY (producto_id) REFERENCES producto(id)
);

-- =====================================================
-- 7. RUTAS, ZONAS Y CRONOGRAMAS
-- =====================================================

CREATE TABLE rutas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_ruta VARCHAR(100) NOT NULL,
    origen VARCHAR(100) NOT NULL,
    destino VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    cliente_id UUID NOT NULL,
    CONSTRAINT fk_ruta_cliente
        FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

CREATE TABLE zonas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL,
    ruta_id UUID NOT NULL,
    CONSTRAINT fk_zona_cliente
        FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    CONSTRAINT fk_zona_ruta
        FOREIGN KEY (ruta_id) REFERENCES rutas(id)
);

CREATE TABLE cronogramas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruta_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(20) NOT NULL,
    CONSTRAINT fk_cronograma_ruta
        FOREIGN KEY (ruta_id) REFERENCES rutas(id),
    CONSTRAINT fk_cronograma_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
