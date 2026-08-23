const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: env.db.poolMax,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: true,
});

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function transaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const txQuery = async (sql, params) => {
      const [rows] = await connection.query(sql, params);
      return rows;
    };
    const txQueryOne = async (sql, params) => {
      const rows = await txQuery(sql, params);
      return rows[0] || null;
    };
    const result = await fn({ query: txQuery, queryOne: txQueryOne, connection });
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    logger.info('Database connection established');
  } catch (err) {
    logger.error('Database connection failed', { error: err.message });
    throw err;
  }
}

module.exports = { pool, query, queryOne, transaction, testConnection };
