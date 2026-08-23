require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  db: {
    host: required('DB_HOST', 'localhost'),
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD || '',
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,

  encryptionKey: process.env.ENCRYPTION_KEY || '',

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 5,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
    checkoutMax: parseInt(process.env.CHECKOUT_RATE_LIMIT_MAX, 10) || 20,
    webhookMax: parseInt(process.env.WEBHOOK_RATE_LIMIT_MAX, 10) || 60,
  },

  order: {
    unpaidExpiryMinutes: parseInt(process.env.UNPAID_ORDER_EXPIRY_MINUTES, 10) || 30,
    codChargeDefault: parseFloat(process.env.COD_CHARGE_DEFAULT) || 0,
  },

  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL || '',
    password: process.env.SHIPROCKET_PASSWORD || '',
    baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
    webhookToken: process.env.SHIPROCKET_WEBHOOK_TOKEN || '',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    get isConfigured() {
      return Boolean(this.keyId && this.keySecret);
    },
  },

  superAdmin: {
    mobile: process.env.SUPER_ADMIN_MOBILE,
    password: process.env.SUPER_ADMIN_PASSWORD,
    name: process.env.SUPER_ADMIN_NAME || 'INDIVO Super Admin',
    email: process.env.SUPER_ADMIN_EMAIL,
  },
};
