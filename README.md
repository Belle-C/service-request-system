# Service Request System

Internal service request portal for SAP S4 HANA and future Digital request workflows.

## Stack

This project follows the Cora Finance Concierge app shape:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

## Getting Started

```bash
npm install
npm run prisma:generate
npm run dev
```

Open `http://localhost:3000`.

## Database

Use PostgreSQL. For local pgAdmin development, create a database named `Service_Request`, then copy `.env.example` to `.env` and replace `YOUR_PASSWORD` with your local Postgres password:

```bash
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
```

If you prefer Docker, `docker-compose.yml` is available, but update `.env` to match the Docker username/password/database first. If you use Supabase, Neon, or another Postgres server, put that connection string in `.env` as `DATABASE_URL`.

## Folder Shape

```text
src/app              App Router pages and API routes
src/components       Shared UI components
src/lib              Server/client helpers
prisma               Database schema and seed scripts
```
