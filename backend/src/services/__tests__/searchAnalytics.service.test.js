const mockQuery = jest.fn();
const mockQueryOne = jest.fn();
jest.mock('../../config/database', () => ({ query: (...a) => mockQuery(...a), queryOne: (...a) => mockQueryOne(...a) }));

const svc = require('../searchAnalytics.service');

beforeEach(() => { mockQuery.mockReset(); mockQueryOne.mockReset(); });

test('normalizeTerm lower-cases, trims, collapses spaces and drops too-short terms', () => {
  expect(svc.normalizeTerm('  Silk   SAREE ')).toBe('silk saree');
  expect(svc.normalizeTerm('"Oud"')).toBe('oud');
  expect(svc.normalizeTerm('a')).toBe('');
  expect(svc.normalizeTerm('')).toBe('');
});

test('visitorKey is a stable 16-char hash, different per visitor', () => {
  const req = (ip, ua) => ({ ip, get: () => ua });
  const a = svc.visitorKey(req('1.1.1.1', 'Chrome'));
  expect(a).toHaveLength(16);
  expect(svc.visitorKey(req('1.1.1.1', 'Chrome'))).toBe(a);
  expect(svc.visitorKey(req('2.2.2.2', 'Chrome'))).not.toBe(a);
});

test('logSearch inserts a new search and returns its id', async () => {
  mockQueryOne.mockResolvedValue(null);
  mockQuery.mockResolvedValue({ insertId: 42 });
  await expect(svc.logSearch({ term: 'Silk Saree', resultsCount: 5, visitor: 'v' })).resolves.toBe(42);
  expect(mockQuery.mock.calls[0][1]).toMatchObject({ term: 'Silk Saree', norm: 'silk saree', resultsCount: 5 });
});

test('logSearch reuses a recent search by the same visitor instead of double counting', async () => {
  mockQueryOne.mockResolvedValue({ id: 7 });
  await expect(svc.logSearch({ term: 'silk', resultsCount: 3, visitor: 'v' })).resolves.toBe(7);
  expect(mockQuery).toHaveBeenCalledTimes(1);
  expect(mockQuery.mock.calls[0][0]).toMatch(/^UPDATE search_logs/);
});

test('logSearch does not overwrite the result count from a filtered request', async () => {
  mockQueryOne.mockResolvedValue({ id: 7 });
  await svc.logSearch({ term: 'silk', resultsCount: 0, visitor: 'v', updateResults: false });
  expect(mockQuery).not.toHaveBeenCalled();
});

test('logSearch ignores terms that normalise to nothing', async () => {
  await expect(svc.logSearch({ term: ' x ', resultsCount: 0, visitor: 'v' })).resolves.toBeNull();
  expect(mockQueryOne).not.toHaveBeenCalled();
});

test('logClick ignores unknown searches', async () => {
  mockQueryOne.mockResolvedValueOnce(null);
  await expect(svc.logClick({ searchId: 1, productId: 2, position: 1 })).resolves.toBe(false);
  expect(mockQuery).not.toHaveBeenCalled();
});

test('logClick records the product against the search term', async () => {
  mockQueryOne.mockResolvedValueOnce({ id: 1, term_norm: 'silk' }).mockResolvedValueOnce({ id: 2 });
  await expect(svc.logClick({ searchId: 1, productId: 2, position: 3 })).resolves.toBe(true);
  expect(mockQuery.mock.calls[0][1]).toMatchObject({ searchId: 1, term: 'silk', productId: 2, position: 3 });
});
