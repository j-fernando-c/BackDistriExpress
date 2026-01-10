const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones con mejores prácticas
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necesario para Render
  },
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexión inactiva
  connectionTimeoutMillis: 2000, // Tiempo máximo para establecer conexión
});

// Evento de error en el pool
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones:', err);
  process.exit(-1);
});

// Función para verificar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Obtener información de la base de datos
    const result = await client.query('SELECT version()');
    console.log('📊 Versión de PostgreSQL:', result.rows[0].version.split(' ')[1]);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    return false;
  }
};

// Función helper para ejecutar queries con manejo de errores
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📝 Query ejecutado', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Error en query:', error);
    throw error;
  }
};

// Función para transacciones
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Sobrescribir release para asegurar que se llame solo una vez
  const timeout = setTimeout(() => {
    console.error('⚠️ Cliente no liberado después de 5 segundos');
  }, 5000);
  
  client.release = () => {
    clearTimeout(timeout);
    client.release = release;
    return release();
  };
  
  return client;
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};