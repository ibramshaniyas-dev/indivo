const db = require('../config/database');
const env = require('../config/env');
const logger = require('../utils/logger');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Platform settings managed by the Super Admin from the dashboard (Settings page) instead of
 * being hardcoded or living only in .env.
 *
 * - Values live in the `settings` table (group/key/value).
 * - Secrets (passwords, API secrets, webhook tokens) are encrypted at rest with ENCRYPTION_KEY
 *   and are never returned to the browser — only a masked hint (e.g. "••••3V9Y").
 * - Until a value is saved from the dashboard, the matching .env value is used as a fallback,
 *   so existing deployments keep working unchanged.
 * - Values are cached in memory and the cache is refreshed whenever settings are saved, so
 *   changes take effect immediately without a restart.
 */
const DEFINITIONS = [
  // ---- General / store profile (public: shown on the storefront)
  { group: 'general', key: 'site_name', label: 'Store name', type: 'STRING', public: true, fallback: () => 'SEESHAA' },
  { group: 'general', key: 'tagline', label: 'Tagline', type: 'STRING', public: true, fallback: () => 'Shop · Experience · Discover' },
  { group: 'general', key: 'support_email', label: 'Support email', type: 'STRING', public: true, fallback: () => '' },
  { group: 'general', key: 'support_phone', label: 'Support phone', type: 'STRING', public: true, fallback: () => '' },
  { group: 'general', key: 'whatsapp_number', label: 'WhatsApp number', type: 'STRING', public: true, fallback: () => '' },
  { group: 'general', key: 'business_address', label: 'Business address', type: 'STRING', multiline: true, public: true, fallback: () => '' },
  { group: 'general', key: 'gstin', label: 'GSTIN', type: 'STRING', public: true, fallback: () => '' },

  // ---- Razorpay (payments)
  { group: 'razorpay', key: 'key_id', label: 'Key ID', type: 'STRING', fallback: () => env.razorpay.keyId },
  { group: 'razorpay', key: 'key_secret', label: 'Key secret', type: 'STRING', secret: true, fallback: () => env.razorpay.keySecret },
  { group: 'razorpay', key: 'webhook_secret', label: 'Webhook secret', type: 'STRING', secret: true, fallback: () => env.razorpay.webhookSecret },

  // ---- Shiprocket (shipping)
  { group: 'shiprocket', key: 'email', label: 'API user email', type: 'STRING', fallback: () => env.shiprocket.email },
  { group: 'shiprocket', key: 'password', label: 'API user password', type: 'STRING', secret: true, fallback: () => env.shiprocket.password },
  { group: 'shiprocket', key: 'base_url', label: 'API base URL', type: 'STRING', fallback: () => env.shiprocket.baseUrl },
  { group: 'shiprocket', key: 'webhook_token', label: 'Webhook token (X-Api-Key)', type: 'STRING', secret: true, fallback: () => env.shiprocket.webhookToken },

  // ---- Orders (only settings the checkout actually enforces are listed here)
  { group: 'order', key: 'cod_enabled', label: 'Cash on Delivery enabled', type: 'BOOLEAN', public: true, fallback: () => true },
];

const DEF_BY_ID = new Map(DEFINITIONS.map((d) => [`${d.group}.${d.key}`, d]));
const ENC_PREFIX = 'enc:';
const listeners = new Set();

let cache = null; // Map "group.key" -> raw stored string (secrets still encrypted)

function cast(def, raw) {
  if (raw === null || raw === undefined) return raw;
  if (def.type === 'NUMBER') return raw === '' ? null : Number(raw);
  if (def.type === 'BOOLEAN') return raw === true || raw === 'true' || raw === '1' || raw === 1;
  return String(raw);
}

async function load() {
  const rows = await db.query('SELECT `group`, `key`, value FROM settings');
  cache = new Map(rows.map((r) => [`${r.group}.${r.key}`, r.value]));
  return cache;
}

async function ensureLoaded() {
  return cache || load();
}

function readStored(def) {
  const id = `${def.group}.${def.key}`;
  if (!cache.has(id)) return undefined;
  const raw = cache.get(id);
  if (raw === null || raw === '') return raw;
  if (def.secret && typeof raw === 'string' && raw.startsWith(ENC_PREFIX)) {
    try { return decrypt(raw.slice(ENC_PREFIX.length)); } catch (err) {
      logger.error('Settings: could not decrypt secret (ENCRYPTION_KEY changed?)', { id });
      return '';
    }
  }
  return raw;
}

/** Effective value of one setting: saved value, else .env/default fallback. */
async function get(group, key) {
  await ensureLoaded();
  const def = DEF_BY_ID.get(`${group}.${key}`);
  if (!def) throw new Error(`Unknown setting ${group}.${key}`);
  const stored = readStored(def);
  return cast(def, stored === undefined || stored === null || stored === '' ? def.fallback() : stored);
}

/** All effective values of a group as a plain object, e.g. getGroup('razorpay') -> { key_id, key_secret, ... }. */
async function getGroup(group) {
  const out = {};
  for (const def of DEFINITIONS.filter((d) => d.group === group)) out[def.key] = await get(group, def.key);
  return out;
}

function mask(value) {
  if (!value) return '';
  const s = String(value);
  return `••••••${s.slice(-4)}`;
}

/** Admin view: every definition with its effective value; secrets masked, with "configured" + "source" hints. */
async function listForAdmin() {
  await ensureLoaded();
  return Promise.all(DEFINITIONS.map(async (def) => {
    const stored = readStored(def);
    const fromDb = !(stored === undefined || stored === null || stored === '');
    const value = await get(def.group, def.key);
    return {
      group: def.group,
      key: def.key,
      label: def.label,
      type: def.type,
      secret: Boolean(def.secret),
      multiline: Boolean(def.multiline),
      public: Boolean(def.public),
      value: def.secret ? null : value,
      maskedValue: def.secret ? mask(value) : undefined,
      configured: def.secret ? Boolean(value) : undefined,
      source: fromDb ? 'dashboard' : (value === '' || value === null || value === undefined ? 'unset' : 'env/default'),
    };
  }));
}

/** Storefront view: only settings flagged public, as { group: { key: value } }. */
async function listPublic() {
  const out = {};
  for (const def of DEFINITIONS.filter((d) => d.public)) {
    (out[def.group] ||= {})[def.key] = await get(def.group, def.key);
  }
  return out;
}

/**
 * Saves changes from the dashboard. `updates` is [{ group, key, value }].
 * For secrets, an empty/undefined value means "keep the current secret" (the UI never has it).
 * Returns the list of groups that changed so dependent clients can be reset.
 */
async function update(updates, userId) {
  const changedGroups = new Set();
  await db.transaction(async (tx) => {
    for (const { group, key, value } of updates) {
      const def = DEF_BY_ID.get(`${group}.${key}`);
      if (!def) continue; // ignore unknown keys rather than letting the client write arbitrary rows
      if (def.secret && (value === undefined || value === null || value === '')) continue;

      let stored;
      if (def.type === 'BOOLEAN') stored = value ? 'true' : 'false';
      else if (def.type === 'NUMBER') stored = value === '' || value === null || value === undefined ? '' : String(Number(value));
      else stored = value === null || value === undefined ? '' : String(value).trim();
      if (def.secret) stored = ENC_PREFIX + encrypt(stored);

      await tx.query(
        `INSERT INTO settings (\`group\`, \`key\`, value, value_type, updated_by)
         VALUES (:group, :key, :value, :type, :userId)
         ON DUPLICATE KEY UPDATE value = VALUES(value), value_type = VALUES(value_type), updated_by = VALUES(updated_by)`,
        { group, key, value: stored, type: def.type, userId: userId || null }
      );
      changedGroups.add(group);
    }
  });
  await load();
  for (const fn of listeners) {
    try { fn([...changedGroups]); } catch (err) { logger.error('Settings change listener failed', { error: err.message }); }
  }
  return [...changedGroups];
}

/** Lets integrations drop cached clients/tokens when their credentials change. */
function onChange(fn) {
  listeners.add(fn);
}

module.exports = { DEFINITIONS, get, getGroup, listForAdmin, listPublic, update, onChange, reload: load };
