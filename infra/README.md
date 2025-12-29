# Infra: Prometheus & Grafana for Uz (local)

This folder contains local configs to run Prometheus and Grafana for scraping the app's metrics endpoint.

Quick start

1. Ensure your Next.js app is running on port `3000`:

```powershell
# from repo root
npm run dev
```

2. Start Prometheus and Grafana (uses Docker Desktop on Windows):

```powershell
cd infra
docker-compose up -d
```

3. Verify Prometheus targets (should show `host.docker.internal:3000` UP):

Open: http://localhost:9090/targets

4. Open Grafana: http://localhost:3001 (default admin/admin)
   - Dashboard `Uz - Basic Metrics` is provisioned automatically.

Troubleshooting

- Docker errors (Windows): ensure Docker Desktop is installed and running. If you see errors about `dockerDesktopLinuxEngine` or pipes, open Docker Desktop and wait until it reports "Docker is running".
- Prometheus cannot reach app: Prometheus runs in Docker and reaches the host via `host.docker.internal`. If you changed your app port or run inside WSL, update `infra/prometheus/prometheus.yml` targets accordingly.
- Grafana dashboard missing: check Grafana logs in the container and ensure provisioning files are mounted. Logs:

```powershell
docker logs infra-grafana-1 --tail 200
```

Editing configs

- Update `infra/prometheus/prometheus.yml` to change scrape intervals or targets.
- Update `infra/grafana/dashboards/basic_metrics.json` to add panels or modify queries.

Stopping and cleanup

```powershell
cd infra
docker-compose down
```

If you want to persist Grafana state between restarts, replace the dashboards mount with a Docker volume and configure Grafana provisioning accordingly.
If you want to persist Grafana state between restarts, the Compose file now creates a named Docker volume `grafana-storage` and mounts it at `/var/lib/grafana`.

Persistence notes

- The named volume `grafana-storage` stores Grafana's SQLite DB, plugins, and dashboard state. To preserve dashboards, alerts, and user data across container restarts, use the provided compose which mounts `grafana-storage`.
- To inspect or remove the volume:

```powershell
docker volume ls
docker volume inspect uz_infra_grafana-storage
docker volume rm uz_infra_grafana-storage
```

Cardinality warning

- The dashboard includes a troubleshooting panel that shows latency by `userId`. This is high-cardinality and can cause performance and storage issues if used in production with many distinct `userId` label values. Use such panels only for short-term debugging and avoid storing very high-cardinality labels in Prometheus long-term.

If you change the volume name or path, update `infra/docker-compose.yml` accordingly.

Backup checklist

- To back up Grafana data (named volume):

```powershell
# Create a tarball of the grafana volume contents (run from repo root)
docker run --rm -v uz_infra_grafana-storage:/volume -v ${PWD}:/backup busybox \
   sh -c "cd /volume && tar czf /backup/grafana-backup-$(date +%Y%m%dT%H%M%S).tar.gz ."
```

- To restore from a backup tarball:

```powershell
docker run --rm -v uz_infra_grafana-storage:/volume -v ${PWD}:/backup busybox \
   sh -c "cd /volume && tar xzf /backup/grafana-backup-YYYYmmddTHHMMSS.tar.gz"
```

- Verify Grafana state after restore by viewing container logs and visiting the UI.

Alertmanager & test alerts

- Create an `infra/.env` file (example below) and set your webhook URL.
- Restart Alertmanager to pick up the env and test sending an alert.

Example `infra/.env`:

```powershell
# infra/.env
ALERTMANAGER_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

Restart Alertmanager (Windows PowerShell):

```powershell
cd infra
docker-compose --env-file .env up -d --force-recreate alertmanager
```

Send a test alert (PowerShell):

```powershell
Invoke-RestMethod -Uri 'http://localhost:9093/api/v1/alerts' -Method Post -ContentType 'application/json' -Body '[{"labels":{"alertname":"TestAlert","severity":"critical"}}]'
```

Or use the native curl binary if PowerShell's `curl` aliases interfere:

```powershell
& curl.exe -X POST -H "Content-Type: application/json" -d '[{"labels":{"alertname":"TestAlert","severity":"critical"}}]' http://localhost:9093/api/v1/alerts
```

Provisioning dashboards and alerts

- Additional dashboards: add JSON files to `infra/grafana/dashboards` and they will be provisioned automatically.
- Alerts: Prometheus alert rules live in `infra/prometheus/alert_rules.yml` and are loaded by Prometheus via `prometheus.yml` `rule_files` setting.
- Grafana alerting provisioning is available under `infra/grafana/provisioning/alerting/alerting.yml`; configure `notifiers` and `notificationPolicies` there to enable notifications.

Local dev: fetch DB password from Secrets Manager

If you used the `secrets` module, the DB password is stored in AWS Secrets Manager. For local testing you can fetch it with the included scripts.

Bash:

```bash
./infra/scripts/get-db-password.sh <secret-name-or-arn>
```

PowerShell:

```powershell
.\infra\scripts\get-db-password.ps1 -SecretId "arn:aws:secretsmanager:..."
```

Note: these scripts use the AWS CLI and assume your local AWS credentials are configured (`aws configure` or environment variables). The Secrets Manager secret created by the `secrets` module stores the raw password as `SecretString`.
