const env = require('../config/env');
const logger = require('../utils/logger');
const { error } = require('../utils/response');
const ApiError = require('../utils/ApiError');

const MYSQL_ERROR_MAP = {
  ER_DUP_ENTRY: { status: 409, message: 'A record with these details already exists' },
  ER_NO_REFERENCED_ROW_2: { status: 400, message: 'Referenced record does not exist' },
  ER_ROW_IS_REFERENCED_2: { status: 409, message: 'This record is referenced by other data and cannot be modified' },
};

function notFound(req, res) {
  return error(res, { status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return error(res, { status: err.status, message: err.message, errors: err.errors });
  }

  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    return error(res, { status: 400, message });
  }

  if (err.code && MYSQL_ERROR_MAP[err.code]) {
    const mapped = MYSQL_ERROR_MAP[err.code];
    return error(res, { status: mapped.status, message: mapped.message });
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: env.isProduction ? undefined : err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  return error(res, {
    status: 500,
    message: env.isProduction ? 'Internal server error' : err.message,
  });
}

module.exports = { notFound, errorHandler };
