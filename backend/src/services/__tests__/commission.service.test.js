jest.mock('../../config/database', () => ({ query: jest.fn(), queryOne: jest.fn(), transaction: jest.fn() }));

const { computeCommissionAmount } = require('../commission.service');

test('percentage commission is rounded to paise', () => {
  expect(computeCommissionAmount({ type: 'PERCENTAGE', value: 10 }, 1620)).toBe(162);
  expect(computeCommissionAmount({ type: 'PERCENTAGE', value: 12.5 }, 999)).toBe(124.88);
  expect(computeCommissionAmount({ type: 'PERCENTAGE', value: '7' }, 1935.2)).toBe(135.46);
});

test('fixed commission never exceeds the sale amount', () => {
  expect(computeCommissionAmount({ type: 'FIXED', value: 50 }, 820)).toBe(50);
  expect(computeCommissionAmount({ type: 'FIXED', value: 500 }, 300)).toBe(300);
});

test('zero commission yields zero', () => {
  expect(computeCommissionAmount({ type: 'PERCENTAGE', value: 0 }, 1000)).toBe(0);
});
