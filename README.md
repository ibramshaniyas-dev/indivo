# INDIVO — Multi-Vendor E-Commerce Marketplace

Public marketplace platform: customers, seller companies, and platform admins on one Node.js/Express + MySQL backend with a React + MUI frontend. Production domain: `indivo.iharogroups.com`.

Architecture, ERD, and phased delivery plan: see `docs/architecture.md`.

## Local setup

**Backend**
```
cd backend
copy .env.example .env   # fill in DB credentials, JWT secrets, super admin login
npm install
mysql -u root -p indivo < database/schema.sql
npm run seed              # seeds RBAC roles/permissions + super admin user
npm run dev
```

**Frontend**
```
cd frontend
copy .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`, frontend on `http://localhost:5173`.
