-- ============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- Sistema de Gestión Comercial
-- ============================================

-- Eliminar tablas si existen (en orden inverso por dependencias)
DROP TABLE IF EXISTS detalle_permiso;
DROP TABLE IF EXISTS Permisos;
DROP TABLE IF EXISTS Roles;
DROP TABLE IF EXISTS detalle_compra;
DROP TABLE IF EXISTS Compra;
DROP TABLE IF EXISTS Usuarios;
DROP TABLE IF EXISTS Cromoyentes;
DROP TABLE IF EXISTS Rutas;
DROP TABLE IF EXISTS Procesador;
DROP TABLE IF EXISTS Zonas;
DROP TABLE IF EXISTS Cliente;
DROP TABLE IF EXISTS Pedidos;
DROP TABLE IF EXISTS Categoria_productos;
DROP TABLE IF EXISTS Productos;
DROP TABLE IF EXISTS Estado_venta;
DROP TABLE IF EXISTS Venta;

-- ============================================
-- TABLA: Cliente
-- ============================================
CREATE TABLE Cliente (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    documento VARCHAR(50),
    tipo_documento VARCHAR(50),
    email VARCHAR(50),
    telefono VARCHAR(50),
    direccion VARCHAR(255),
    estado VARCHAR(50),
);

-- ============================================
-- TABLA: Zonas
-- ============================================
CREATE TABLE Zonas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT,
    ruta_id INT,
    FOREIGN KEY (cliente_id) REFERENCES Cliente(id)
);

-- ============================================
-- TABLA: Rutas
-- ============================================
CREATE TABLE Rutas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_ruta VARCHAR(255) NOT NULL,
    origen VARCHAR(100),
    destino VARCHAR(100),
    estado VARCHAR(50),
    cliente_id INT,
    FOREIGN KEY (cliente_id) REFERENCES Cliente(id)
);

-- ============================================
-- TABLA: Proveedor
-- ============================================
CREATE TABLE Proveedor (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    documento VARCHAR(50),
    contacto VARCHAR(100),
);

-- ============================================
-- TABLA: Pedidos
-- ============================================
CREATE TABLE Pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT,
    estado VARCHAR(50),
    cantidad INT,
    fecha_pedido DATE,
    total_pedidos DECIMAL(10,2),
    registrar_ArimaList_void TEXT,
    buscar_ArimaList_list VARCHAR(255),
    listar_ArimaList VARCHAR(255),
    editar_ArimaList_ArimaList TEXT,
    combinar_editar_boolean BOOLEAN,
    ver_detalle_ArimaList TEXT
);

-- ============================================
-- TABLA: Categoria_productos
-- ============================================
CREATE TABLE Categoria_productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_categoria VARCHAR(255) NOT NULL,
    descripcion TEXT,
    registrar_ArimaList_void TEXT,
    buscar_ArimaList_list VARCHAR(255),
    listar_ArimaList VARCHAR(255),
    Alistar_obtIst_ArimaList TEXT,
    editar_ArimaList_ArimaList TEXT,
    setIdInt_boolean BOOLEAN,
    setNombre_boolean BOOLEAN,
    setDescripcion_ArimaList TEXT
);

-- ============================================
-- TABLA: Productos
-- ============================================
CREATE TABLE Productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo INT UNIQUE,
    categoria VARCHAR(255),
    categoria_id VARCHAR(255),
    descripcion TEXT,
    contenido VARCHAR(100),
    stock_min INT,
    stock_act INT,
    estado VARCHAR(50),
    registrar_ArimaList_void TEXT,
    buscar_ArimaList_list VARCHAR(255),
    listar_ArimaList VARCHAR(255),
    editar_ArimaList_ArimaList TEXT,
    eliminar_boolean BOOLEAN,
    ver_detalle_ArimaList TEXT,
    setIdInt_void VARCHAR(255),
    FOREIGN KEY (categoria_id) REFERENCES Categoria_productos(id)
);

-- ============================================
-- TABLA: Estado_venta
-- ============================================
CREATE TABLE Estado_venta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estado VARCHAR(50) NOT NULL
);

-- ============================================
-- TABLA: Venta
-- ============================================
CREATE TABLE Venta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente INT,
    fecha_Date DATE,
    fecha_venta DATE,
    total_decimal DECIMAL(10,2),
    estado_id INT,
    estado VARCHAR(50),
    registrar_ArimaList_void TEXT,
    buscar_ArimaList_list_id VARCHAR(255),
    listar_ArimaList VARCHAR(255),
    editar_boolean BOOLEAN,
    ver_detalle_ArimaList TEXT,
    FOREIGN KEY (cliente) REFERENCES Cliente(id),
    FOREIGN KEY (estado_id) REFERENCES Estado_venta(id)
);

-- ============================================
-- TABLA: Cromoyentes
-- ============================================
CREATE TABLE Cromoyentes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    telefono_id VARCHAR(50),
    direccion_id VARCHAR(255),
    nombre VARCHAR(255) NOT NULL,
    hora_time TIME,
    estado VARCHAR(50),
    registrar_ArimaList_void TEXT,
    buscar_boolean BOOLEAN,
    listar_ArimaList VARCHAR(255),
    editar_ArimaList TEXT,
    combinar_editar_ArimaList TEXT
);

-- ============================================
-- TABLA: Roles
-- ============================================
CREATE TABLE Roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_rol VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50),
    registrar_ArimaList_void TEXT,
    listar_obtener_ArimaList VARCHAR(255),
    listar_roles_ArimaList VARCHAR(255),
    editar_ArimaList_ArimaList TEXT,
    combinar_editar_ArimaList TEXT
);

-- ============================================
-- TABLA: Usuarios
-- ============================================
CREATE TABLE Usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE,
    contraseña VARCHAR(255),
    rol VARCHAR(100),
    estado VARCHAR(50),
    telefono VARCHAR(50),
    registrar_ArimaList_void TEXT,
    buscar_ArimaList_list VARCHAR(255),
    listar_ArimaList VARCHAR(255),
    Alistar_obtIst_ArimaList TEXT,
    editar_ArimaList_ArimaList TEXT,
    eliminar_boolean BOOLEAN,
    ver_detalle_ArimaList TEXT
);

-- ============================================
-- TABLA: Compra
-- ============================================
CREATE TABLE Compra (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255),
    fecha_Date DATE,
    numFactura VARCHAR(100),
    total_decimal DECIMAL(10,2),
    registrar_ArimaList_void TEXT,
    buscar_ArimaList_list VARCHAR(255),
    listar_ArimaList VARCHAR(255),
    editar_ArimaList_ArimaList TEXT,
    combinar_editar_boolean BOOLEAN,
    ver_detalle_ArimaList TEXT
);

-- ============================================
-- TABLA: detalle_compra
-- ============================================
CREATE TABLE detalle_compra (
    id INT PRIMARY KEY AUTO_INCREMENT,
    compra_id INT,
    precio_unitario DECIMAL(10,2),
    producto VARCHAR(255),
    registrar_ArimaList_void TEXT,
    buscar_ArimaList_list VARCHAR(255),
    listar_ArimaList VARCHAR(255),
    editar_ArimaList_ArimaList TEXT,
    combinar_editar_boolean BOOLEAN,
    ver_detalle_ArimaList TEXT,
    FOREIGN KEY (compra_id) REFERENCES Compra(id)
);

-- ============================================
-- TABLA: Permisos
-- ============================================
CREATE TABLE Permisos (
    rol_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_permiso VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50),
    listar_permisos_ArimaList VARCHAR(255),
    Alistar_permiso_Arlist TEXT
);

-- ============================================
-- TABLA: detalle_permiso
-- ============================================
CREATE TABLE detalle_permiso (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_permiso INT,
    id_roles INT,
    FOREIGN KEY (id_permiso) REFERENCES Permisos(rol_id),
    FOREIGN KEY (id_roles) REFERENCES Roles(id)
);

-- ============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================

-- Índices en Cliente
CREATE INDEX idx_cliente_codigo ON Cliente(codigo_cli);
CREATE INDEX idx_cliente_estado ON Cliente(estado);

-- Índices en Productos
CREATE INDEX idx_productos_categoria ON Productos(categoria_id);
CREATE INDEX idx_productos_codigo ON Productos(codigo);
CREATE INDEX idx_productos_estado ON Productos(estado);

-- Índices en Venta
CREATE INDEX idx_venta_cliente ON Venta(cliente);
CREATE INDEX idx_venta_fecha ON Venta(fecha_Date);
CREATE INDEX idx_venta_estado ON Venta(estado_id);

-- Índices en Usuarios
CREATE INDEX idx_usuarios_rol ON Usuarios(rol);
CREATE INDEX idx_usuarios_correo ON Usuarios(correo);

-- Índices en Compra
CREATE INDEX idx_compra_fecha ON Compra(fecha_Date);
CREATE INDEX idx_compra_factura ON Compra(numFactura);

-- ============================================
-- INSERCIÓN DE DATOS INICIALES
-- ============================================

-- Estados de venta iniciales
INSERT INTO Estado_venta (estado) VALUES 
('Pendiente'),
('Procesando'),
('Completada'),
('Cancelada');

-- Categorías de productos iniciales
INSERT INTO Categoria_productos (nombre_categoria, descripcion) VALUES
('Bebidas', 'Productos líquidos para consumo'),
('Alimentos', 'Productos alimenticios'),
('Limpieza', 'Productos de limpieza e higiene');

-- Roles iniciales
INSERT INTO Roles (nombre_rol, descripcion, estado) VALUES
('Administrador', 'Acceso completo al sistema', 'Activo'),
('Vendedor', 'Gestión de ventas y clientes', 'Activo'),
('Almacenista', 'Gestión de inventario', 'Activo');

-- ============================================
-- FIN DEL SCRIPT
-- ============================================