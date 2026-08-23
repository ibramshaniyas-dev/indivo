const crypto = require('crypto');

/** Fast, deterministic hash for storing high-entropy tokens (e.g. refresh tokens) for equality checks. */
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

module.exports = { sha256 };
