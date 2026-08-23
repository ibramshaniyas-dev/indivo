require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../../src/config/database');
const env = require('../../src/config/env');
const { randomFrom, randomName, CITIES } = require('./data/demoData');
const { DEMO_PASSWORD } = require('./seedSellers');

async function seedOneCustomer(index, passwordHash) {
  const mobile = `80000${String(index).padStart(5, '0')}`;
  const existing = await db.queryOne('SELECT id FROM users WHERE mobile = :mobile', { mobile });
  if (existing) return existing.id;

  const name = randomName();
  const location = randomFrom(CITIES);
  const genders = ['MALE', 'FEMALE'];

  return db.transaction(async (tx) => {
    const userResult = await tx.query(
      `INSERT INTO users (mobile, email, password_hash, user_type, status)
       VALUES (:mobile, :email, :passwordHash, 'CUSTOMER', 'ACTIVE')`,
      { mobile, email: `customer${index}@indivo-demo.in`, passwordHash }
    );
    const userId = userResult.insertId;

    const customerResult = await tx.query(
      `INSERT INTO customers (user_id, name, gender) VALUES (:userId, :name, :gender)`,
      { userId, name, gender: randomFrom(genders) }
    );
    const customerId = customerResult.insertId;

    await tx.query(
      `INSERT INTO customer_addresses (customer_id, name, mobile, address_line1, city, district, state, pincode, type, is_default)
       VALUES (:customerId, :name, :mobile, :address, :city, :city, :state, :pincode, 'HOME', 1)`,
      { customerId, name, mobile, address: `${index + 20}, MG Road`, city: location.city, state: location.state, pincode: location.pincode }
    );

    return userId;
  });
}

async function run(count = 30) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, env.bcryptRounds);
  let created = 0;
  for (let i = 1; i <= count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await seedOneCustomer(i, passwordHash);
    created += 1;
  }
  console.log(`${created} demo customers ready. Password: ${DEMO_PASSWORD}`);
}

if (require.main === module) {
  const count = parseInt(process.argv[2], 10) || 30;
  run(count)
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run };
