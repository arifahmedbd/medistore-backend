
                                                     MediStore Backend API

Backend service for MediStore 💊 – an e-commerce platform for over-the-counter medicines.

Built with Node.js, Express, Prisma, and PostgreSQL, supporting authentication, role-based access, orders, cart, and payments (Stripe + COD).

---

## Tech Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Better Auth (Authentication)

---

## Modular Project Structure

---

## 🔐 Authentication

Handled by Better Auth

- Email/password login
- Google OAuth
- Email verification
- Session-based authentication

---

## Roles

| Role   | Permissions                      |
| ------ | -------------------------------- |
| USER   | Browse, cart, orders, reviews    |
| SELLER | Manage medicines, orders         |
| ADMIN  | Manage users, categories, orders |

---

## Core Features

### User

- Register / Login
- Email verification
- Profile management

### Cart

- Add / update / remove items
- Persistent cart (database)

### Orders

- Place order (COD)
- Track order status

### Medicines

- CRUD (Seller)
- Filter, search, pagination

### Reviews

- Only verified buyers can review

### Admin

- Manage users (ban/unban)
- Manage categories
- View all orders

---

## Payments

Supports:

- Cash on Delivery (COD)

---

## ⚙️ Environment Variables

```env

PORT=4000
NODE_ENV=development
DATABASE_URL="postgres://username:password@host:5432/database?sslmode=require"
FRONTEND_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-better-auth-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret



Run Locally
npm install
npx prisma generate
npx prisma migrate dev
npm run dev


Security Features
Role-based access control
Centralized error handling
Ownership checks
Transactions for stock safety


Performance
Pagination & filtering
Optimized queries with Prisma
Indexed database fields


Deployment
Backend: Vercel
Database: PostgreSQL (Neon)
Notes
OTC medicines only (no prescription drugs)

MediStore Backend – Built for scalable e-commerce systems
```
