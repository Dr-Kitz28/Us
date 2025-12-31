## Drizzle Migration Checklist

Use this template when your PR includes schema changes that require DB migrations.

- [ ] I ran `npm run drizzle:generate -- --name="<descriptive-name>"` locally and committed the generated migration files under `drizzle/migrations/`.
- [ ] The SQL produced by the migration has been reviewed and is included in the PR.
- [ ] I verified the migration locally against a test Postgres instance (`npm run drizzle:push` against a staging DB).
- [ ] I updated any docs that reference database schema or setup (e.g., `SETUP_GUIDE.md`).
- [ ] I confirmed no Prisma artifacts remain in production workflows (we use Drizzle).

Notes for reviewers:
- CI will run a migration generation step and fail the PR if migration files are missing. If CI fails, regenerate migrations locally and include them in the PR.
- To apply migrations to production, use the `Apply Drizzle Migrations` workflow (requires `DATABASE_URL` secret and appropriate repo permissions).

Describe the change and why the migration is safe:

- Migration summary:
- Rollback plan:
- DB size/impact notes:
