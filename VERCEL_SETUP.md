Vercel Deployment & Environment Setup

1) Add project to Vercel
- Import the repository into Vercel (connect GitHub/GitLab/Bitbucket)
- Choose the `main` branch (or your deployment branch)

2) Environment variables (in Vercel Dashboard → Project → Settings → Environment Variables)
Set the following for the relevant environment (Preview/Production):

- `DATABASE_URL` = PostgreSQL connection string (required in production)
  - Example: `postgresql://USER:PASSWORD@HOST:5432/DATABASE`
  - Ensure this is a managed Postgres (Neon, Heroku, Supabase, RDS) — SQLite is not supported in production.

- `REDIS_URL` = Redis connection string (ioredis compatible)
  - Example: `redis://:PASSWORD@HOST:6379`

- `NEXTAUTH_URL` = App URL (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` = NextAuth secret

Other optional vars:
- `SENTRY_DSN`, `NEXT_PUBLIC_APP_ENV`, any external API keys

3) Build & Output Settings
- Framework Preset: `Next.js`
- Root Directory: (leave blank unless monorepo)
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: (handled by Next.js)

4) Post-deploy checks
- Verify that `DATABASE_URL` points to Postgres and not SQLite.
- Verify Redis connectivity by visiting `/api/redis-smoke` route (returns success when connected).
- Confirm the admin health route `/api/admin/health` returns healthy.

5) Notes about runtime & static generation
- Some server routes intentionally use request headers or URL search params. Those routes are runtime-only and will run on Node serverless lambdas (not prerendered). This repo already marks critical admin/health/stats routes to use Node runtime.

6) CI / Migrations
- This repo uses Drizzle for runtime queries. Run migrations externally where appropriate; ensure your deployment pipeline applies DB migrations before enabling traffic.

If you want, I can:
- Push the committed changes to a new GitHub branch and open a PR.
- Create a Vercel project and set environment variables (requires your Vercel/GitHub access token).
