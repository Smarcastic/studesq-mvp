# StudesQ Database Guide

## Current Setup (Development)

StudesQ uses **SQLite** via Prisma ORM for local development.

- **Provider:** `sqlite`
- **File:** `prisma/dev.db`
- **Adapter:** `@prisma/adapter-better-sqlite3`
- **Schema:** `prisma/schema.prisma`

### Quick Commands

```bash
# Push schema changes (no migration files)
npx prisma db push

# Generate Prisma client
npx prisma generate

# Open database GUI
npx prisma studio

# Reset database (destructive)
npx prisma db push --force-reset
```

---

## Migrating to PostgreSQL (Production)

When deploying to production, switch from SQLite to PostgreSQL.

### Step 1: Update `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 2: Set Environment Variable

```env
DATABASE_URL="postgresql://user:password@host:5432/studesq?schema=public"
```

### Step 3: Update Prisma Config

In `prisma.config.ts`, swap the adapter:

```ts
// Remove:
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";

// Add:
// No adapter needed for PostgreSQL — Prisma uses the native driver by default
```

Or, to use the Neon serverless driver:

```bash
npm install @prisma/adapter-neon @neondatabase/serverless
```

### Step 4: Schema Adjustments

The current schema is PostgreSQL-compatible with these notes:

| Feature | SQLite | PostgreSQL | Action Needed |
|---------|--------|------------|---------------|
| `@id @default(cuid())` | Works | Works | None |
| `DateTime` | Stored as text | Native timestamp | None |
| `Float` | Works | Works | None |
| `String` (long text) | Works | Works (consider `@db.Text` for large fields) | Optional |
| `@@unique` | Works | Works | None |
| `@@index` | Works | Works | None |

### Step 5: Run Migration

```bash
# Create initial migration from current schema
npx prisma migrate dev --name init

# In production
npx prisma migrate deploy
```

---

## Recommended Production Databases

| Provider | Plan | Notes |
|----------|------|-------|
| **Neon** | Free tier (0.5 GB) | Serverless PostgreSQL, great for Vercel |
| **Supabase** | Free tier (500 MB) | PostgreSQL with extras (auth, storage) |
| **PlanetScale** | Free tier (5 GB) | MySQL-compatible, branching support |
| **Railway** | $5/mo | Managed PostgreSQL, simple setup |

---

## Data Seeding

After migrating, seed initial data:

```bash
npx prisma db seed
```

Create `prisma/seed.ts` to populate demo data if needed.
