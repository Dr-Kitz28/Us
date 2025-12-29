Prisma -> Postgres migration plan (for Vercel)

Goal
- Replace the local SQLite datasource with a managed PostgreSQL for production on Vercel.
- Produce a safe migration path for schema + data, and commands to run migrations locally and in production.

Overview
- Keep your existing prisma/schema.prisma as the canonical schema. For production, change the datasource provider to "postgresql" and set DATABASE_URL to your managed Postgres.
- Use Prisma Migrate to generate migration SQL and apply locally against a local Postgres or a temporary cloud Postgres.
- For data migration from SQLite -> Postgres either: (A) write a small Node seed script to copy data between DBs using Prisma clients, or (B) use a generic tool (pgloader) to convert DBs. The Node script is recommended to retain type mapping/transformations.

1) Provision Postgres
- Recommended providers (free/trial friendly): Neon, Supabase, Railway. For small apps Neon or Supabase work well.
- Create a database and note the connection string (DATABASE_URL). Example:
  postgres://user:password@db-host:5432/dbname?schema=public

2) Update prisma/schema.prisma (development flow)
- The only change required in schema.prisma is the datasource provider line. Example:
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

Note: Don't commit production secrets. Keep this change in the repo; locally you can point DATABASE_URL to a local Postgres for testing.

3) Local dev: prepare a local Postgres (optional)
- Install Postgres locally or run Docker:
  docker run --name local-postgres -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=devdb -p 5432:5432 -d postgres:15
- Set DATABASE_URL in your .env to: postgres://postgres:pass@127.0.0.1:5432/devdb

4) Generate migration files and apply (development)
- Ensure you switched schema provider if you changed it.
- Run:
  npx prisma generate
  npx prisma migrate dev --name init

This creates a migrations/ folder and applies the migration to your local Postgres. Inspect the SQL in prisma/migrations/<timestamp>_init/

5) Data migration strategies (SQLite -> Postgres)
Option A (recommended): Node copy script using two Prisma clients
- Create two .env files: .env.sqlite (pointing to local sqlite) and .env.pg (pointing to Postgres).
- Implement a script scripts/migrate_sqlite_to_pg.ts that:
  - Instantiates PrismaClient({ datasources: { db: 'file:./dev.db' } }) for sqlite and a second PrismaClient for Postgres (or read/write by temporarily switching env)
  - Reads records in batches from sqlite and upserts into Postgres, taking care of IDs and relations.
  - Run the script: DATABASE_URL=postgres://... npx tsx scripts/migrate_sqlite_to_pg.ts

Option B: SQL dump / pgloader
- Use sqlite3 to dump data and pgloader to load into Postgres. This is less flexible and may require SQL transformations.

6) Production deployment on Vercel
- Vercel doesn't run migrations automatically. Choose one of:
  a) Run migrations during your CI pipeline (recommended): add a GitHub Action step that runs `npx prisma migrate deploy` using DATABASE_URL set to production DB.
  b) Manually run `npx prisma migrate deploy` from a machine that has access to the production DB before or after deployment.

- Set environment variables in Vercel (Project Settings -> Environment Variables):
  - DATABASE_URL=postgres://user:pass@host:5432/dbname
  - NEXTAUTH_URL=https://<your-app>.vercel.app
  - NEXTAUTH_SECRET=<secure_random_value>
  - REDIS_URL or UPSTASH variables as needed
  - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET

- For Prisma Migrate in CI, ensure you provide a SHADOW_DATABASE_URL if using introspection/migrations in CI for a production database. Example:
  SHADOW_DATABASE_URL=postgres://shadow_user:pass@host:5432/shadowdb

- Add a GitHub Action (example snippet):
  - name: Deploy migrations
    run: npx prisma migrate deploy
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}

7) Prisma Client generation on Vercel
- Vercel will run the build; ensure `npx prisma generate` is available during build. The migrate deploy step should be run before the build (as a separate CI step) or you can run `prisma migrate deploy` as part of the build, but a separate migration step in CI is safer.

8) Adjustments & common pitfalls
- Connection limits: serverless platforms like Vercel create many short-lived connections. Use a connection pooling proxy (PgBouncer) or use Neon which offers serverless-friendly connections. For Postgres, include pool settings in connection string if provider supports it.
- Types: SQLite used `String` and other types — Postgres supports same Prisma types. For JSON fields: if you used String to store JSON (like `interests` in Profile currently a String), you may want to change to Json type in Prisma for metadata, e.g. `interests Json?`. This requires data migration.
- Migrate filesystem uploads to S3: update code for direct-to-S3 signed upload URLs.

9) Rollback strategy
- Keep backups of your Postgres (enable automatic backups on provider) before applying migrations.
- Prisma migrations are reversible only if you create down migrations manually; plan for a DB snapshot/backup to restore if needed.

10) Post-deploy checks
- Run smoke tests: auth flow, messaging API, sending/reading messages, uploads.
- Monitor error logs (Sentry) and DB metrics (connection count, slow queries).

11) Cleanup dev-bypass
- Remove dev bypass code in app/api/messages/route.ts and any test-only scripts before final production deploy.

Example .env.production (do NOT commit):
DATABASE_URL=postgres://<USER>:<PASS>@<HOST>:5432/<DBNAME>
NEXTAUTH_URL=https://<your-app>.vercel.app
NEXTAUTH_SECRET=<32+ char random string>
REDIS_URL=<UPSTASH_REDIS_REST_URL>
REDIS_TOKEN=<UPSTASH_TOKEN>
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=your-bucket


If you want, next steps I can take:
- (A) Create a migration script template (scripts/migrate_sqlite_to_pg.ts) that copies data record-by-record with batching.
- (B) Update prisma/schema.prisma provider to postgresql and add a short commit message template.
- (C) Add a GitHub Actions workflow snippet to run prisma migrate deploy in CI before Vercel build.

Which of A/B/C should I implement next? (I can generate files and snippets.)
