const app = require('./app');
const env = require('./config/env');
const db = require('./config/database');
const logger = require('./utils/logger');
const shipmentTrackingSyncJob = require('./jobs/shipmentTrackingSync.job');

async function start() {
  await db.testConnection();
  app.listen(env.port, () => {
    logger.info(`INDIVO API listening on port ${env.port} [${env.nodeEnv}]`);
  });
  shipmentTrackingSyncJob.start();
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
