# Production Readiness Checklist for Uz

This file lists concrete, actionable steps to prepare the app and infra for production.

1) Secrets & configuration
- Migrate all sensitive values from env files to a secrets manager (Azure Key Vault, AWS Secrets Manager, or HashiCorp Vault).
- Remove plaintext secrets from repository and `.env` files.
- Add CI/CD integration to fetch secrets at deploy time.

2) TLS, networking, and ingress
- Terminate TLS at a reverse proxy (NGINX/Traefik) or load balancer.
- Configure strong TLS settings and enable HSTS.
- Restrict public ports; only expose necessary ports (e.g., 443 for HTTPS, internal ports for monitoring behind VPN).

3) Monitoring & alerting hardening
- Configure Prometheus retention and remote write if needed; set `--storage.tsdb.retention.time` or remote storage.
- Enable auth for Grafana and use API keys or OAuth; persist `grafana-storage` and backup regularly.
- Avoid high-cardinality labels (remove `userId` from long-term metrics); keep those only in ephemeral debug panels.
- Validate Alertmanager receivers (Slack, PagerDuty, email) and test notifications.

4) Data stores and backups
- Use a managed production DB (RDS/Azure Database) with backups and read replicas as needed.
- Configure Prisma to use production connection pooling (PgBouncer) and set application timeouts.
- Run migrations via CI/CD: `npx prisma migrate deploy` during deploy pipeline.
- Set up Redis with persistence / managed service and enable replication.

5) Observability & rate limiting
- Add OTLP/Jaeger tracing and structured logs (JSON) forwarded to a log sink (ELK/Datadog).
- Implement rate limiting for public APIs (NGINX or middleware) and per-user quotas.
- Add request sampling and error reporting (Sentry or similar).

6) Security & testing
- Run SAST and DAST scanners in CI (e.g., CodeQL, Semgrep, OWASP ZAP).
- Run automated dependency checks for vulnerabilities and apply CVE fixes.
- Perform load testing (k6, locust) and tune connection pools, caches, and autoscaling.

7) CI/CD & deployment
- Create pipeline that builds, tests, runs migrations, and deploys with canary or rolling updates.
- Automate infrastructure provisioning (Terraform/Bicep) and state management.
- Add production readiness gates: smoke tests, health checks, and rollback on failures.

8) Backup & DR
- Schedule automated DB and Grafana backups; store backups off-site.
- Periodically test restore procedures.

Suggested immediate next steps I can start now (pick one):
- Scaffold a `infra/k8s/` or `infra/terraform/` skeleton for infra provisioning.
- Add sample NGINX/Traefik config and `docker-compose.prod.yml` with TLS placeholders.
- Add Prometheus retention and Grafana auth config to the `infra` compose files.
- Add CI job templates for secrets fetching, migration, and deployment.

If you pick one, I'll implement the corresponding scaffold and mark the todo item in-progress.
