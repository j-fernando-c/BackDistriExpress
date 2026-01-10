require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  const connected = await testConnection();
  if (!connected) {
    console.error('No se pudo conectar a la base de datos. Verifica las credenciales.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
