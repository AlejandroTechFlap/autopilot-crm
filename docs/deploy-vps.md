# VPS Deployment Guide [DRAFT]

> Target: `root@49.13.25.179` (Hetzner) — Docker Swarm + Traefik v3 + FlapDevNet.

## Infrastructure (discovered 2026-04-09)

| Item | Value |
|------|-------|
| OS | Ubuntu 24.04.4 LTS |
| Docker | 29.3.0 + Compose v5.1.0, **Swarm mode active** |
| Reverse proxy | Traefik v3.5.3 (ports 80/443, CrowdSec bouncer) |
| Cert resolver | `letsencryptresolver` (HTTP challenge) |
| Shared network | `FlapDevNet` (overlay) |
| Base domain | `dev.flapconsulting.com` |
| CRM URL | `https://crm.dev.flapconsulting.com` |
| Stacks dir | `/opt/stacks/` |
| Portainer | `portainer.dev.flapconsulting.com` |
| Stack file | `docker-stack.yml` (Swarm-compatible) |

## Deploy steps

### 1. Build image

```bash
cd /opt/stacks/autopilot-crm
docker build -t autopilot-crm:latest .
```

### 2. Create `.env.local`

```bash
cp .env.example .env.local
# Fill in the 4 values (Supabase URL, publishable key, service role key, Gemini key)
```

### 3. Deploy stack

```bash
cd /opt/stacks/autopilot-crm
export $(grep -v '^#' .env.local | xargs)
docker stack deploy -c docker-stack.yml autopilot-crm
```

### 4. DNS

Add A record for `crm.dev.flapconsulting.com` → `49.13.25.179`
(skip if `*.dev.flapconsulting.com` wildcard already exists).

### 5. Verify

```bash
# Service running?
docker service ls | grep crm

# Logs
docker service logs autopilot-crm_app --tail=30

# Health (once DNS propagates)
curl -s https://crm.dev.flapconsulting.com/api/health | jq .
```

Expected: `{ "status": "ok" }` and `/login` loads.

## Update flow

```bash
cd /opt/stacks/autopilot-crm
git pull
docker build -t autopilot-crm:latest .
docker service update --force autopilot-crm_app
```

## Rollback

```bash
docker service rollback autopilot-crm_app
```
