jest.mock('../../config/database', () => ({ query: jest.fn(), queryOne: jest.fn() }));

const { scoreSeller } = require('../performance.service');

const base = {
  orders: 20, cancellationRate: 0, lateShipRate: 0, rtoRate: 0, pendingConfirm: 0,
  reviewCount: 0, rating: 0, variants: 10, outOfStock: 0, liveProducts: 10, noPhotoProducts: 0,
};

test('a clean seller scores 100 and is Excellent', () => {
  const r = scoreSeller(base);
  expect(r.score).toBe(100);
  expect(r.band).toBe('EXCELLENT');
  expect(r.deductions).toEqual([]);
});

test('cancellations, late shipping and stuck orders push a seller to At risk with reasons', () => {
  const r = scoreSeller({ ...base, cancellationRate: 0.2, lateShipRate: 0.5, pendingConfirm: 4, rtoRate: 0.1 });
  expect(r.score).toBeLessThan(50);
  expect(r.band).toBe('AT_RISK');
  expect(r.deductions[0].reason).toMatch(/cancelled|not shipped/);
  expect(r.deductions.length).toBe(4);
});

test('deductions are capped per rule', () => {
  const r = scoreSeller({ ...base, cancellationRate: 1 });
  expect(r.deductions[0].points).toBe(25);
  expect(r.score).toBe(75);
});

test('rating only counts with at least 3 reviews', () => {
  expect(scoreSeller({ ...base, reviewCount: 2, rating: 2 }).score).toBe(100);
  expect(scoreSeller({ ...base, reviewCount: 5, rating: 3 }).score).toBe(90);
});

test('sellers with fewer than 3 orders are New, not judged', () => {
  expect(scoreSeller({ ...base, orders: 2 }).band).toBe('NEW');
});
