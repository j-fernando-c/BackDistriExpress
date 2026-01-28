-- =====================================================
-- SEED DATA CORREGIDO - SISTEMA DE DISTRIBUCIÓN
-- PostgreSQL 14+
-- =====================================================

BEGIN;

-- =====================================================
-- ROLES ↔ PERMISOS
-- =====================================================

-- Administrador → todos los permisos
INSERT INTO detalle_permisos (permiso_id, rol_id)
SELECT p.id, r.id
FROM permisos p
JOIN roles r ON r.nombre_rol = 'Administrador'
ON CONFLICT DO NOTHING;

-- Vendedor → permisos básicos
INSERT INTO detalle_permisos (permiso_id, rol_id)
SELECT p.id, r.id
FROM permisos p
JOIN roles r ON r.nombre_rol = 'Vendedor'
WHERE p.nombre_permiso IN (
    'Ver Dashboard',
    'Gestionar Ventas',
    'Gestionar Clientes'
)
ON CONFLICT DO NOTHING;

-- Empleado → inventario y compras
INSERT INTO detalle_permisos (permiso_id, rol_id)
SELECT p.id, r.id
FROM permisos p
JOIN roles r ON r.nombre_rol = 'Empleado'
WHERE p.nombre_permiso IN (
    'Gestionar Productos',
    'Gestionar Compras'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- USUARIOS
-- =====================================================
INSERT INTO usuarios (
    tipo_documento, documento, nombre, email,
    telefono, direccion, rol_id, contrasena
)
VALUES
(
    'CC', '1001', 'Administrador General', 'admin@sistema.com',
    '3001111111', 'Oficina Central',
    (SELECT id FROM roles WHERE nombre_rol='Administrador'),
    'admin123'
),
(
    'CC', '1002', 'Carlos Vendedor', 'vendedor@sistema.com',
    '3002222222', 'Sucursal Norte',
    (SELECT id FROM roles WHERE nombre_rol='Vendedor'),
    'vendedor123'
),
(
    'CC', '1003', 'Laura Empleada', 'empleado@sistema.com',
    '3003333333', 'Bodega Central',
    (SELECT id FROM roles WHERE nombre_rol='Empleado'),
    'empleado123'
),
(
    'CC', '1004', 'Pedro Domiciliario', 'domi@sistema.com',
    '3004444444', 'Zona Sur',
    (SELECT id FROM roles WHERE nombre_rol='Domiciliario'),
    'domi123'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CLIENTES
-- =====================================================
INSERT INTO clientes (
    tipo_documento, documento, nombre, email, telefono, direccion
)
VALUES
('CC','2001','Juan Pérez','juan@mail.com','3010000001','Barrio Centro'),
('CC','2002','María Gómez','maria@mail.com','3010000002','Barrio Norte'),
('NIT','900100200','Tienda La Esquina','tienda@mail.com','6011111111','Zona Comercial')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PROVEEDORES
-- =====================================================
INSERT INTO proveedores (
    tipo, tipo_documento, documento,
    nombre_o_razon_social, contacto, email, telefono
)
VALUES
(
    'Distribuidor','NIT','800100100',
    'Distribuciones ABC','Carlos López','abc@mail.com','6020000001'
),
(
    'Fábrica','NIT','800200200',
    'Alimentos del Valle','Ana Torres','valle@mail.com','6020000002'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- DOMICILIARIOS
-- =====================================================
INSERT INTO domiciliarios (
    tipo_documento, documento, nombre, telefono, email
)
VALUES
('CC','3001','Luis Rojas','3020000001','luis@mail.com'),
('CC','3002','Andrea Ruiz','3020000002','andrea@mail.com')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PRODUCTOS
-- =====================================================
INSERT INTO productos (
    categoria_id, nombre, descripcion,
    precio, cantidad, stock_min, stock_max
)
VALUES
(
    (SELECT id FROM categoria_productos WHERE nombre_categoria='Granos'),
    'Arroz 1kg','Arroz blanco premium',4500,100,20,200
),
(
    (SELECT id FROM categoria_productos WHERE nombre_categoria='Aceites'),
    'Aceite Vegetal 1L','Aceite refinado',9000,80,15,150
),
(
    (SELECT id FROM categoria_productos WHERE nombre_categoria='Lácteos'),
    'Leche Entera 1L','Leche pasteurizada',3800,120,30,250
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ENTRADAS DE INVENTARIO
-- =====================================================
INSERT INTO entradas_salidas (
    producto_id, tipo, cantidad, precio, observaciones
)
SELECT
    id, 'entrada', 50, precio, 'Carga inicial de inventario'
FROM productos;

-- =====================================================
-- COMPRAS + DETALLE
-- =====================================================
INSERT INTO compras (
    proveedor_id, total_compra, estado
)
VALUES
(
    (SELECT id FROM proveedores LIMIT 1),
    500000,
    'completada'
);

INSERT INTO detalle_compras (
    compra_id, producto_id, cantidad, precio_unitario, subtotal
)
SELECT
    (SELECT id FROM compras ORDER BY fecha DESC LIMIT 1),
    p.id,
    20,
    p.precio,
    p.precio * 20
FROM productos p;

-- =====================================================
-- VENTAS + DETALLE
-- =====================================================
INSERT INTO ventas (
    cliente_id, total_venta, estado_id, domiciliario_id, estado
)
VALUES
(
    (SELECT id FROM clientes LIMIT 1),
    20000,
    (SELECT id FROM estado_ventas WHERE estado='terminado'),
    (SELECT id FROM domiciliarios LIMIT 1),
    'entregada'
);

INSERT INTO detalle_ventas (
    venta_id, producto_id, cantidad, precio_venta, subtotal
)
VALUES
(
    (SELECT id FROM ventas ORDER BY fecha DESC LIMIT 1),
    (SELECT id FROM productos LIMIT 1),
    2,
    4500,
    9000
);

-- =====================================================
-- PEDIDOS + DETALLE
-- =====================================================
INSERT INTO pedidos (
    cliente_id, total, domiciliario_id, estado
)
VALUES
(
    (SELECT id FROM clientes OFFSET 1 LIMIT 1),
    18000,
    (SELECT id FROM domiciliarios LIMIT 1),
    'confirmado'
);

INSERT INTO detalle_pedidos (
    pedido_id, producto_id, cantidad, precio, subtotal
)
VALUES
(
    (SELECT id FROM pedidos ORDER BY fecha DESC LIMIT 1),
    (SELECT id FROM productos OFFSET 1 LIMIT 1),
    2,
    9000,
    18000
);

-- =====================================================
-- RUTAS, ZONAS Y CRONOGRAMAS (CORREGIDO)
-- =====================================================
INSERT INTO rutas (
    nombre_ruta, origen, destino, cliente_id
)
VALUES
(
    'Ruta Norte',
    'Bodega Central',
    'Zona Norte',
    (SELECT id FROM clientes LIMIT 1)
);

INSERT INTO zonas (
    cliente_id, ruta_id
)
VALUES
(
    (SELECT id FROM clientes LIMIT 1),
    (SELECT id FROM rutas ORDER BY fecha_creacion DESC LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- 🔥 CORRECCIÓN CLAVE: usuario_id NUNCA NULL
INSERT INTO cronogramas (
    ruta_id, usuario_id, fecha, hora
)
VALUES
(
    (SELECT id FROM rutas ORDER BY fecha_creacion DESC LIMIT 1),
    (
        SELECT u.id
        FROM usuarios u
        JOIN roles r ON r.id = u.rol_id
        WHERE r.nombre_rol = 'Empleado'
        LIMIT 1
    ),
    CURRENT_DATE + 1,
    '08:00'
);

COMMIT;

-- =====================================================
-- FIN SEED DATA
-- =====================================================
