const path = require('path');
const env = require('../config/env');

/**
 * Thin indirection over local disk storage so a future S3/cloud provider
 * is a drop-in swap (change this file only) without touching callers.
 */
function publicUrlFor(relativePath) {
  return `${env.appUrl}/${env.upload.dir}/${relativePath.replace(/\\/g, '/')}`;
}

function relativePathFromFile(file) {
  return path.join(file.fieldSubdir || '', file.filename);
}

module.exports = { publicUrlFor, relativePathFromFile };
