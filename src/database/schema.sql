-- =====================================================
-- SCRIPT CORREGIDO - SISTEMA DE DISTRIBUCIÓN
-- Base de datos: sistema_distribucion
-- PostgreSQL 14+
-- =====================================================
-- =====================================================
-- EXTENSIONES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TIPOS ENUMERADOS (ENUM)
-- =====================================================

CREATE TYPE tipo_estado_general AS ENUM (
    'activo',
    'inactivo'
);

CREATE TYPE tipo_estado_compra AS ENUM (
    'pendiente',
    'completada',
    'cancelada'
);

CREATE TYPE tipo_estado_cliente AS ENUM (
    'activo',
    'inactivo'
);

CREATE TYPE tipo_estado_proveedor AS ENUM (
    'activo',
    'inactivo'
);

CREATE TYPE tipo_estado_domiciliario AS ENUM (
    'disponible',
    'ocupado',
    'inactivo'
);

CREATE TYPE tipo_estado_venta AS ENUM (
    'pendiente',
    'pagada',
    'cancelada',
    'entregada'
);

CREATE TYPE tipo_estado_venta_catalogo AS ENUM (
    'toma_de_pedido',
    'en_proceso',
    'editar',
    'cancelado',
    'terminado',
    'domicilio'
);

CREATE TYPE tipo_estado_ruta AS ENUM (
    'activa',
    'inactiva'
);

CREATE TYPE tipo_estado_cronograma AS ENUM (
    'programado',
    'en_proceso',
    'completado',
    'cancelado'
);

CREATE TYPE tipo_estado_pedido AS ENUM (
    'pendiente',
    'confirmado',
    'en_preparacion',
    'enviado',
    'entregado',
    'cancelado'
);

CREATE TYPE tipo_entrada_salida AS ENUM (
    'entrada',
    'salida'
);

-- =====================================================
-- TABLAS MAESTRAS
-- =====================================================

-- Tabla: categoria_producto
CREATE TABLE categoria_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado tipo_estado_general NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_rol VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado tipo_estado_general NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: permisos
CREATE TABLE permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_permiso VARCHAR(100) NOT NULL,
    url VARCHAR(200),
    descripcion TEXT,
    estado tipo_estado_general NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: detalle_permisos (relación muchos a muchos)
CREATE TABLE detalle_permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permiso_id UUID NOT NULL,
    rol_id UUID NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_permiso_permiso
        FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_permiso_rol
        FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT uq_permiso_rol UNIQUE (permiso_id, rol_id)
);

-- Tabla: clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento VARCHAR(30),
    documento VARCHAR(30) UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(30),
    direccion TEXT,
    estado tipo_estado_cliente NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(80),
    tipo_documento VARCHAR(30),
    documento VARCHAR(30) UNIQUE,
    nombre_o_razon_social VARCHAR(200) NOT NULL,
    contacto VARCHAR(150),
    email VARCHAR(255),
    telefono VARCHAR(30),
    estado tipo_estado_proveedor NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: domiciliarios
CREATE TABLE domiciliarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento VARCHAR(30),
    documento VARCHAR(100) UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(255),
    estado tipo_estado_domiciliario NOT NULL DEFAULT 'disponible',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento VARCHAR(30),
    documento VARCHAR(100) UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    rol_id UUID NOT NULL,
    contrasena TEXT NOT NULL,
    estado tipo_estado_general NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- =====================================================
-- TABLAS DE PRODUCTOS
-- =====================================================

-- Tabla: productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    stock_min INTEGER NOT NULL DEFAULT 0 CHECK (stock_min >= 0),
    stock_max INTEGER NOT NULL DEFAULT 0 CHECK (stock_max >= 0),
    estado tipo_estado_general NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (categoria_id) REFERENCES categoria_producto(id),
    CONSTRAINT chk_stock CHECK (stock_min <= stock_max)
);

-- Tabla: perdidas (opcional - para registrar mermas)
CREATE TABLE perdidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    motivo TEXT,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registrado_por UUID,
    CONSTRAINT fk_perdida_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id),
    CONSTRAINT fk_perdida_usuario
        FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- Tabla: entradas_salidas
CREATE TABLE entradas_salidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL,
    tipo tipo_entrada_salida NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado tipo_estado_general NOT NULL DEFAULT 'activo',
    observaciones TEXT,
    CONSTRAINT fk_entrada_salida_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =====================================================
-- TABLAS DE COMPRAS
-- =====================================================

-- Tabla: compras
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proveedor_id UUID NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comprobante_factura_proveedor VARCHAR(50),
    total_compra NUMERIC(10,2) NOT NULL CHECK (total_compra >= 0),
    estado tipo_estado_compra NOT NULL DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compra_proveedor
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

-- Tabla: detalle_compras
CREATE TABLE detalle_compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_compra_compra
        FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_compra_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =====================================================
-- TABLAS DE VENTAS
-- =====================================================

-- Tabla: estado_ventas (catálogo de estados)
CREATE TABLE estado_ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estado tipo_estado_venta_catalogo NOT NULL UNIQUE
);

-- Tabla: ventas
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_venta NUMERIC(10,2) NOT NULL CHECK (total_venta >= 0),
    estado_id UUID,
    domiciliario_id UUID,
    estado tipo_estado_venta NOT NULL DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_venta_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_venta_estado
        FOREIGN KEY (estado_id) REFERENCES estado_ventas(id),
    CONSTRAINT fk_venta_domiciliario
        FOREIGN KEY (domiciliario_id) REFERENCES domiciliarios(id)
);

-- Tabla: detalle_ventas
CREATE TABLE detalle_ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_venta NUMERIC(10,2) NOT NULL CHECK (precio_venta >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_venta_venta
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_venta_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =====================================================
-- TABLAS DE PEDIDOS
-- =====================================================

-- Tabla: pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado tipo_estado_pedido NOT NULL DEFAULT 'pendiente',
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    domiciliario_id UUID,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_pedido_domiciliario
        FOREIGN KEY (domiciliario_id) REFERENCES domiciliarios(id)
);

-- Tabla: detalle_pedidos
CREATE TABLE detalle_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_pedido_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_pedido_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =====================================================
-- TABLAS DE RUTAS Y ZONAS
-- =====================================================

-- Tabla: rutas
CREATE TABLE rutas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_ruta VARCHAR(150) NOT NULL,
    origen VARCHAR(200),
    destino VARCHAR(200),
    estado tipo_estado_ruta NOT NULL DEFAULT 'activa',
    cliente_id UUID,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ruta_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla: zonas (relación cliente-ruta)
CREATE TABLE zonas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL,
    ruta_id UUID NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_zona_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_zona_ruta
        FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE,
    CONSTRAINT uq_cliente_ruta UNIQUE (cliente_id, ruta_id)
);

-- Tabla: cronogramas
CREATE TABLE cronogramas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruta_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado tipo_estado_cronograma NOT NULL DEFAULT 'programado',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cronograma_ruta
        FOREIGN KEY (ruta_id) REFERENCES rutas(id),
    CONSTRAINT fk_cronograma_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índices en productos
CREATE INDEX idx_producto_categoria ON productos(categoria_id);
CREATE INDEX idx_producto_estado ON productos(estado);
CREATE INDEX idx_producto_nombre ON productos(nombre);

-- Índices en compras
CREATE INDEX idx_compra_proveedor ON compras(proveedor_id);
CREATE INDEX idx_compra_fecha ON compras(fecha);
CREATE INDEX idx_detalle_compra_compra ON detalle_compras(compra_id);

-- Índices en ventas
CREATE INDEX idx_venta_cliente ON ventas(cliente_id);
CREATE INDEX idx_venta_fecha ON ventas(fecha);
CREATE INDEX idx_detalle_venta_venta ON detalle_ventas(venta_id);

-- Índices en pedidos
CREATE INDEX idx_pedido_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedido_fecha ON pedidos(fecha);
CREATE INDEX idx_detalle_pedido_pedido ON detalle_pedidos(pedido_id);

-- Tabla: abonos (pagos parciales a ventas)
CREATE TABLE abonos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL,
    monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(100) NOT NULL,
    referencia_pago VARCHAR(100),
    descripcion TEXT,
    usuario_id UUID,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_abono_venta
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    CONSTRAINT fk_abono_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices en abonos
CREATE INDEX idx_abono_venta ON abonos(venta_id);
CREATE INDEX idx_abono_fecha ON abonos(fecha);

-- Índices en usuarios
CREATE INDEX idx_usuario_rol ON usuarios(rol_id);
CREATE INDEX idx_usuario_email ON usuarios(email);

-- Índices en rutas
CREATE INDEX idx_ruta_cliente ON rutas(cliente_id);
CREATE INDEX idx_zona_cliente ON zonas(cliente_id);
CREATE INDEX idx_zona_ruta ON zonas(ruta_id);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER trigger_actualizar_categoria
    BEFORE UPDATE ON categoria_producto
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_producto
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_cliente
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_proveedor
    BEFORE UPDATE ON proveedores
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================
-- DATOS INICIALES (SEEDS)
-- =====================================================

-- Insertar roles por defecto
INSERT INTO roles (nombre_rol, descripcion, estado) VALUES
    ('Administrador', 'Administrador del sistema con acceso completo', 'activo'),
    ('Empleado', 'Empleado de distribución', 'activo'),
    ('Domiciliario', 'Repartidor de productos', 'activo'),
    ('Vendedor', 'Vendedor de productos', 'activo');

-- Insertar permisos básicos
INSERT INTO permisos (nombre_permiso, url, descripcion, estado) VALUES
    ('Ver Dashboard', '/dashboard', 'Acceso al dashboard principal', 'activo'),
    ('Gestionar Productos', '/productos', 'Crear, editar y eliminar productos', 'activo'),
    ('Gestionar Clientes', '/clientes', 'Administrar clientes', 'activo'),
    ('Gestionar Proveedores', '/proveedores', 'Administrar proveedores', 'activo'),
    ('Gestionar Ventas', '/ventas', 'Realizar y consultar ventas', 'activo'),
    ('Gestionar Compras', '/compras', 'Realizar y consultar compras', 'activo'),
    ('Gestionar Pedidos', '/pedidos', 'Administrar pedidos', 'activo'),
    ('Gestionar Rutas', '/rutas', 'Administrar rutas de distribución', 'activo'),
    ('Gestionar Usuarios', '/usuarios', 'Administrar usuarios del sistema', 'activo');

-- Insertar categorías de productos
INSERT INTO categoria_producto (nombre_categoria, descripcion, estado) VALUES
    ('Granos', 'Arroz, frijoles, lentejas, etc.', 'activo'),
    ('Aceites', 'Aceites vegetales, mantequilla', 'activo'),
    ('Lácteos', 'Leche, queso, yogurt, etc.', 'activo'),
    ('Enlatados', 'Conservas enlatadas', 'activo'),
    ('Endulzantes', 'Azúcar, panela, miel', 'activo'),
    ('Bebidas', 'Café, chocolate, jugos', 'activo'),
    ('Snacks', 'Galletas, pasabocas', 'activo'),
    ('Pastas', 'Pastas para sopa', 'activo'),
    ('Aseo', 'Productos de limpieza', 'activo'),
    ('Higiene Personal', 'Productos de cuidado personal', 'activo');

-- Insertar estados de venta en catálogo
INSERT INTO estado_ventas (estado) VALUES
    ('toma_de_pedido'),
    ('en_proceso'),
    ('editar'),
    ('cancelado'),
    ('terminado'),
    ('domicilio');

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE categoria_producto IS 'Categorías de productos';
COMMENT ON TABLE productos IS 'Inventario de productos';
COMMENT ON TABLE clientes IS 'Clientes del sistema';
COMMENT ON TABLE proveedores IS 'Proveedores de productos';
COMMENT ON TABLE compras IS 'Registro de compras a proveedores';
COMMENT ON TABLE ventas IS 'Registro de ventas a clientes';
COMMENT ON TABLE pedidos IS 'Pedidos de clientes';
COMMENT ON TABLE rutas IS 'Rutas de distribución';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================