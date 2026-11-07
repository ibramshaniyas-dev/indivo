// Unit tests for the dashboard-managed settings service, using an in-memory fake of the DB layer.
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
process.env.DB_NAME = 'test';
process.env.DB_USER = 'test';
process.env.JWT_SECRET = 'x';
process.env.JWT_REFRESH_SECRET = 'y';
process.env.RAZORPAY_KEY_ID = 'rzp_env_key';
process.env.RAZORPAY_KEY_SECRET = 'env_secret_1234';
process.env.SHIPROCKET_EMAIL = 'ops@example.com';

const mockRows = new Map(); // "group.key" -> { group, key, value }

jest.mock('../../config/database', () => {
  const query = async (sql, params = {}) => {
    if (/^SELECT `group`, `key`, value FROM settings/.test(sql)) return [...mockRows.values()];
    if (/^\s*INSERT INTO settings/.test(sql)) {
      mockRows.set(`${params.group}.${params.key}`, { group: params.group, key: params.key, value: params.value });
      return { affectedRows: 1 };
    }
    throw new Error(`Unexpected SQL in test: ${sql}`);
  };
  return { query, transaction: async (fn) => fn({ query }) };
});
jest.mock('../../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const settings = require('../settings.service');

beforeEach(async () => {
  mockRows.clear();
  await settings.reload();
});

test('falls back to .env values until something is saved from the dashboard', async () => {
  expect(await settings.get('razorpay', 'key_id')).toBe('rzp_env_key');
  expect(await settings.get('shiprocket', 'email')).toBe('ops@example.com');
  expect(await settings.get('order', 'cod_enabled')).toBe(true);
});

test('saved values override the fallback and are cast to their type', async () => {
  await settings.update([
    { group: 'razorpay', key: 'key_id', value: '  rzp_live_new  ' },
    { group: 'order', key: 'cod_enabled', value: false },
  ], 1);
  expect(await settings.get('razorpay', 'key_id')).toBe('rzp_live_new');
  expect(await settings.get('order', 'cod_enabled')).toBe(false);
});

test('secrets are encrypted at rest and only ever returned masked', async () => {
  await settings.update([{ group: 'shiprocket', key: 'password', value: 'SuperSecret9876' }], 1);

  const stored = mockRows.get('shiprocket.password').value;
  expect(stored.startsWith('enc:')).toBe(true);
  expect(stored).not.toContain('SuperSecret9876');

  expect(await settings.get('shiprocket', 'password')).toBe('SuperSecret9876'); // server-side use

  const adminView = (await settings.listForAdmin()).find((s) => s.key === 'password' && s.group === 'shiprocket');
  expect(adminView.value).toBeNull();
  expect(adminView.maskedValue).toBe('••••••9876');
  expect(adminView.configured).toBe(true);
  expect(JSON.stringify(await settings.listForAdmin())).not.toContain('SuperSecret9876');
});

test('a blank secret in an update keeps the existing secret', async () => {
  await settings.update([{ group: 'razorpay', key: 'key_secret', value: 'first_secret_AAAA' }], 1);
  await settings.update([{ group: 'razorpay', key: 'key_secret', value: '' }], 1);
  expect(await settings.get('razorpay', 'key_secret')).toBe('first_secret_AAAA');
});

test('public view never exposes integration credentials', async () => {
  const pub = await settings.listPublic();
  expect(Object.keys(pub).sort()).toEqual(['general', 'order']);
  expect(pub.razorpay).toBeUndefined();
  expect(pub.shiprocket).toBeUndefined();
});

test('unknown keys are ignored and change listeners are notified', async () => {
  const seen = [];
  settings.onChange((groups) => seen.push(groups));
  await settings.update([
    { group: 'evil', key: 'anything', value: 'x' },
    { group: 'shiprocket', key: 'email', value: 'new@example.com' },
  ], 1);
  expect(mockRows.has('evil.anything')).toBe(false);
  expect(seen.at(-1)).toEqual(['shiprocket']);
});
