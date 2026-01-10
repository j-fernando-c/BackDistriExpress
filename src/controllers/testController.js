const { query, getClient } = require('../config/database');

// Verificar conexión a la base de datos
const checkConnection = async (req, res, next) => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    
    res.status(200).json({
      success: true,
      message: 'Conexión exitosa a la base de datos',
      data: {
        timestamp: result.rows[0].current_time,
        database: 'bd_distri',
        version: result.rows[0].db_version
      }
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  checkConnection,
};