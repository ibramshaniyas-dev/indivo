jest.mock('../../config/database', () => ({ query: jest.fn(), queryOne: jest.fn(), transaction: jest.fn() }));

const { haversineKm } = require('../homeDemo.service');

test('distance between two Coimbatore areas is a few km', () => {
  // Gandhipuram (11.0183, 76.9725) to RS Puram (11.0089, 76.9483)
  const d = haversineKm(11.0183, 76.9725, 11.0089, 76.9483);
  expect(d).toBeGreaterThan(2.5);
  expect(d).toBeLessThan(3.2);
});

test('Chennai to Coimbatore is roughly 425 km in a straight line', () => {
  const d = haversineKm(13.0827, 80.2707, 11.0168, 76.9558);
  expect(d).toBeGreaterThan(410);
  expect(d).toBeLessThan(440);
});

test('same point is zero distance', () => {
  expect(haversineKm(11, 77, 11, 77)).toBe(0);
});
