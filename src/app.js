const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const testRoutes = require('./routes/testRoutes');
const productosRoutes = require('./routes/productosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');

const app = express();

// Middlewares de seguridad y utilidades
app.use(helmet()); // Protección de headers HTTP
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('dev')); // Logging de peticiones HTTP
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Backend Node.js + PostgreSQL',
    version: '1.0.0',
    endpoints: {
      health: '/api/test/connection',
      tables: '/api/test/tables',
      setup: 'POST /api/test/setup',
      users: '/api/test/users'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/test', testRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);

// Aquí irán más rutas en el futuro
// app.use('/api/productos', productosRoutes);
// app.use('/api/clientes', clientesRoutes);
// etc...

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

module.exports = app;