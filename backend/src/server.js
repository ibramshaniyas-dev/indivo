const app = require('./app');
const env = require('./config/env');
const db = require('./config/database');
const logger = require('./utils/logger');

async function start() {
  await db.testConnection();
  app.listen(env.port, () => {
    logger.info(`INDIVO API listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
