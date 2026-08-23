require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../../src/config/database');
const env = require('../../src/config/env');
const { encrypt } = require('../../src/utils/crypto');
const { SELLERS, CITIES, randomFrom, randomName } = require('./data/demoData');

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@1234';
const STAFF_ROLES = ['ADMIN', 'STAFF'];

async function createUser(tx, { name, mobile, email, passwordHash, userType }) {
  const existing = await tx.queryOne('SELECT id FROM users WHERE mobile = :mobile', { mobile });
  if (existing) return existing.id;
  const result = await tx.query(
    `INSERT INTO users (name, mobile, email, password_hash, user_type, status)
     VALUES (:name, :mobile, :email, :passwordHash, :userType, 'ACTIVE')`,
    { name, mobile, email, passwordHash, userType }
  );
  return result.insertId;
}

async function seedOneSeller(index, def, passwordHash, superAdminId) {
  const mobile = `90000${String(index).padStart(5, '0')}`;
  const location = randomFrom(CITIES);
  const ownerName = randomName();

  return db.transaction(async (tx) => {
    const existingSeller = await tx.queryOne('SELECT id FROM sellers WHERE company_name = :name', { name: def.company });
    if (existingSeller) {
      console.log(`Skipping ${def.company} — already exists`);
      return existingSeller.id;
    }

    const ownerUserId = await createUser(tx, {
      name: ownerName,
      mobile,
      email: `${slugifyLocal(def.display)}@indivo-demo.in`,
      passwordHash,
      userType: 'SELLER_STAFF',
    });

    const sellerResult = await tx.query(
      `INSERT INTO sellers (public_id, company_name, display_name, business_category, contact_person, gst_no, pan_no, status, approved_by, approved_at, agreement_accepted_at, agreement_version)
       VALUES (:publicId, :company, :display, :category, :contact, :gst, :pan, 'APPROVED', :approvedBy, NOW(), NOW(), '1.0')`,
      {
        publicId: uuidv4(),
        company: def.company,
        display: def.display,
        category: def.category,
        contact: ownerName,
        gst: `29ABCDE${1000 + index}F1Z${index % 10}`,
        pan: `ABCDE${1000 + index}F`,
        approvedBy: superAdminId,
      }
    );
    const sellerId = sellerResult.insertId;

    await tx.query(
      `INSERT INTO seller_users (user_id, seller_id, seller_role, status) VALUES (:userId, :sellerId, 'OWNER', 'ACTIVE')`,
      { userId: ownerUserId, sellerId }
    );

    for (let i = 0; i < 2; i += 1) {
      const staffMobile = `90000${String(index).padStart(3, '0')}${i + 1}${i + 1}`;
      const staffUserId = await createUser(tx, {
        name: randomName(),
        mobile: staffMobile.slice(0, 10),
        email: `${slugifyLocal(def.display)}.staff${i + 1}@indivo-demo.in`,
        passwordHash,
        userType: 'SELLER_STAFF',
      });
      await tx.query(
        `INSERT INTO seller_users (user_id, seller_id, seller_role, status) VALUES (:userId, :sellerId, :role, 'ACTIVE')`,
        { userId: staffUserId, sellerId, role: STAFF_ROLES[i] || 'STAFF' }
      );
    }

    await tx.query(
      `INSERT INTO seller_addresses (seller_id, type, address_line1, city, district, state, pincode)
       VALUES (:sellerId, 'REGISTERED', :address, :city, :city, :state, :pincode)`,
      { sellerId, address: `${index + 10}, Textile Market Road`, city: location.city, state: location.state, pincode: location.pincode }
    );

    await tx.query(
      `INSERT INTO seller_bank_accounts (seller_id, account_holder_name, bank_name, account_number_enc, account_number_last4, ifsc, branch)
       VALUES (:sellerId, :holder, 'State Bank of India', :enc, :last4, 'SBIN0001234', :branch)`,
      {
        sellerId,
        holder: def.company,
        enc: encrypt(`50100${String(index).padStart(7, '0')}`),
        last4: String(index).padStart(4, '0'),
        branch: location.city,
      }
    );

    console.log(`Created seller: ${def.company} (owner: ${ownerName}, mobile: ${mobile})`);
    return sellerId;
  });
}

function slugifyLocal(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

async function run() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, env.bcryptRounds);
  const superAdmin = await db.queryOne("SELECT id FROM users WHERE user_type = 'ADMIN' LIMIT 1");

  const sellerIds = [];
  for (let i = 0; i < SELLERS.length; i += 1) {
    sellerIds.push(await seedOneSeller(i + 1, SELLERS[i], passwordHash, superAdmin?.id));
  }
  console.log(`\n${sellerIds.length} sellers ready. Demo password for all seeded accounts: ${DEMO_PASSWORD}`);
  return sellerIds;
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run, DEMO_PASSWORD };
