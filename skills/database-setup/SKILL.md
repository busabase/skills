---
name: database-setup
description: Initialize and configure PostgreSQL database for an app. Use when setting up new environments, creating databases, or running migrations. Handles database creation, migrations, and schema verification.
disable-model-invocation: false
allowed-tools: Bash(tsx:*), Bash(pnpm:*), Bash(npx:*)
argument-hint: "[app-name]"
---

# Database Setup

Complete database setup workflow for Next.js apps using Drizzle ORM and PostgreSQL.

## What it does

For a given app (e.g., productready, memtable):
1. Creates PostgreSQL database if it doesn't exist
2. Runs Drizzle migrations
3. Verifies system tables
4. (Optional) Seeds initial data

## Usage

From app directory:
```bash
cd apps/productready
pnpm db:migrate      # Create DB and run migrations
pnpm db:push         # Push schema changes (dev mode)
pnpm db:studio       # Open Drizzle Studio
pnpm db:seed         # Seed initial data
```

Or run scripts directly:
```bash
tsx apps/productready/scripts/create-db.ts
tsx apps/productready/scripts/verify-system-tables.ts
```

## Common workflows

### New environment setup
```bash
# 1. Configure environment
cp .env.example .env.local
# Edit DATABASE_URL

# 2. Create database and migrate
pnpm db:migrate

# 3. Verify tables
tsx scripts/verify-system-tables.ts

# 4. Seed data (optional)
pnpm db:seed
```

### Schema changes
```bash
# 1. Generate migration
pnpm db:generate

# 2. Apply migration
pnpm db:migrate

# 3. Verify changes
pnpm db:studio
```

### Development workflow
```bash
# Quick schema push (no migrations)
pnpm db:push
```

## When to use

- Setting up a new development environment
- Deploying to a new server
- After cloning the repository
- When schema changes need to be applied
- Troubleshooting database issues

## Scripts available

- `create-db.ts` - Creates database if missing
- `verify-system-tables.ts` - Checks required tables exist
- `verify-redemption-tables.ts` - For apps with redemption codes
- `create-missing-tables.ts` - Creates missing tables

## Requirements

- PostgreSQL server running
- `DATABASE_URL` configured in `.env` or `.env.local`
- Drizzle Kit installed (dev dependency)
- Migration files in `drizzle/` directory
