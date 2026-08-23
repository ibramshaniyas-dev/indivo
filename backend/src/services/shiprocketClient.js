const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

const REQUEST_TIMEOUT_MS = 15000;
// Shiprocket documents the auth token as valid for 10 days; refresh a little early so a
// long-running process never gets caught mid-request with an expired token.
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;

let cachedToken = null;
let cachedTokenExpiresAt = 0;

const http = axios.create({ baseURL: env.shiprocket.baseUrl, timeout: REQUEST_TIMEOUT_MS });

function redact(data) {
  if (!data || typeof data !== 'object') return data;
  const clone = { ...data };
  if (clone.password) clone.password = '[redacted]';
  if (clone.token) clone.token = '[redacted]';
  return clone;
}

class ShiprocketApiError extends Error {
  constructor(message, { status, endpoint, details } = {}) {
    super(message);
    this.name = 'ShiprocketApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.details = details;
  }
}

async function fetchToken() {
  if (!env.shiprocket.email || !env.shiprocket.password) {
    throw new ShiprocketApiError('Shiprocket credentials are not configured (SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD)');
  }
  try {
    const { data } = await http.post('/auth/login', {
      email: env.shiprocket.email,
      password: env.shiprocket.password,
    });
    if (!data?.token) {
      throw new ShiprocketApiError('Shiprocket login response did not include a token', { details: redact(data) });
    }
    logger.info('Shiprocket: authenticated, token cached');
    return data.token;
  } catch (err) {
    if (err instanceof ShiprocketApiError) throw err;
    logger.error('Shiprocket: authentication failed', { error: err.message, response: redact(err.response?.data) });
    throw new ShiprocketApiError('Shiprocket authentication failed', {
      status: err.response?.status,
      endpoint: '/auth/login',
      details: redact(err.response?.data),
    });
  }
}

/** Returns a cached bearer token, transparently refreshing it once it's close to expiry. */
async function getToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;
  cachedToken = await fetchToken();
  cachedTokenExpiresAt = Date.now() + TOKEN_TTL_MS;
  return cachedToken;
}

/**
 * Authenticated request against the Shiprocket API. Retries exactly once, on a 401 only
 * (stale cached token), by forcing a fresh login — never retries on 4xx/5xx business errors,
 * which must surface to the caller so shipment creation isn't silently retried into duplicates.
 */
async function request(method, endpoint, { data, params, retryOn401 = true } = {}) {
  const token = await getToken();
  try {
    const response = await http.request({
      method,
      url: endpoint,
      data,
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 && retryOn401) {
      logger.warn('Shiprocket: cached token rejected, re-authenticating once');
      cachedToken = null;
      return request(method, endpoint, { data, params, retryOn401: false });
    }
    logger.error('Shiprocket API error', {
      endpoint, method, status, response: redact(err.response?.data), request: redact(data),
    });
    throw new ShiprocketApiError(
      err.response?.data?.message || `Shiprocket request to ${endpoint} failed`,
      { status, endpoint, details: redact(err.response?.data) }
    );
  }
}

module.exports = {
  get: (endpoint, params) => request('get', endpoint, { params }),
  post: (endpoint, data) => request('post', endpoint, { data }),
  ShiprocketApiError,
};
