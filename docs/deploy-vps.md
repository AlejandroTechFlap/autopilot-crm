# VPS Deployment Guide [DRAFT]

> Target: `root@49.13.25.179` — Docker + reverse proxy + CRM subdomain.
> This guide is designed to be followed by Claude Code running directly on the VPS.

## Prerequisites

| Item | Value |
|------|-------|
| Repo | `https://github.com/AlejandroTechFlap/autopilot-crm.git` |
| Docker image port | 3000 |
| Health endpoint | `GET /api/health` → `{ status: 'ok' }` |
| Env file | `.env.local` (4 vars — see `.env.example`) |
| Subdomain | `crm.{domain}` (discover base domain on VPS) |

## Phase A — Investigate VPS infrastructure

Run these commands to understand the hosting platform:

```bash
# OS and Docker
cat /etc/os-release | head -5
docker --version && docker compose version

# Running services
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"
docker compose ls

# Networks (find the reverse-proxy network)
docker network ls

# Reverse proxy — check which one is in use
docker ps --filter "name=portainer" --format "{{.Names}} {{.Ports}}"
docker ps --filter "name=traefik" --format "{{.Names}} {{.Ports}}"
docker ps --filter "name=nginx" --format "{{.Names}} {{.Ports}}"
docker ps --filter "name=caddy" --format "{{.Names}} {{.Ports}}"

# Standard project directories
ls /opt/stacks/ /srv/ /root/ 2>/dev/null

# Discover base domain
docker inspect $(docker ps -q) --format '{{.Config.Labels}}' | grep -i host
cat /etc/traefik/traefik.yml 2>/dev/null
```

**Goal:** Identify the reverse proxy, the shared Docker network, the base domain,
and the standard directory for project stacks.

## Phase B — Clone & configure

```bash
# Clone to the standard directory discovered in Phase A
cd /opt/stacks  # or whatever the standard is
git clone https://github.com/AlejandroTechFlap/autopilot-crm.git
cd autopilot-crm

# Create env file from template
cp .env.example .env.local
# Edit .env.local with real values:
#   NEXT_PUBLIC_SUPABASE_URL=https://wymklyaikwsbfxhwkzsy.supabase.co
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<from Supabase dashboard>
#   SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
#   GEMINI_API_KEY=<from Google AI Studio>
```

## Phase C — Deploy with Docker

### Option 1: Portainer stack (if Portainer is available)

1. Open Portainer UI (usually `https://{vps-ip}:9443`)
2. Go to Stacks → Add Stack
3. Name: `autopilot-crm`
4. Upload or paste the `docker-compose.yml`
5. Add environment variables from `.env.local`
6. Deploy

### Option 2: Docker Compose (CLI)

```bash
# Build and start
docker compose up -d --build

# Verify
docker compose ps
docker compose logs -f --tail=50
curl -s http://localhost:3000/api/health
```

### Verify health

```bash
# Wait for container to be healthy (30s start period)
docker inspect autopilot-crm --format '{{.State.Health.Status}}'
curl -s http://localhost:3000/api/health | jq .
```

## Phase D — Reverse proxy + subdomain

Adapt to whatever reverse proxy is running on the VPS:

### If Traefik

Add labels to `docker-compose.yml`:

```yaml
services:
  autopilot-crm:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.crm.rule=Host(`crm.{domain}`)"
      - "traefik.http.routers.crm.entrypoints=websecure"
      - "traefik.http.routers.crm.tls.certresolver=letsencrypt"
      - "traefik.http.services.crm.loadbalancer.server.port=3000"
    networks:
      - proxy  # the shared Traefik network

networks:
  proxy:
    external: true
```

### If Nginx Proxy Manager

1. Open NPM dashboard
2. Proxy Hosts → Add Proxy Host
3. Domain: `crm.{domain}`
4. Forward: `autopilot-crm:3000` (container name)
5. Enable SSL → Let's Encrypt
6. Ensure NPM and the CRM container share a Docker network

### If Caddy

Add to Caddyfile:

```
crm.{domain} {
    reverse_proxy autopilot-crm:3000
}
```

### DNS

Add an A record for `crm.{domain}` pointing to `49.13.25.179` (or wildcard if already set up).

## Phase E — Verify production

```bash
# External access
curl -sI https://crm.{domain}/login
curl -s https://crm.{domain}/api/health | jq .

# Check logs for errors
docker compose logs --tail=20
```

Expected: `/login` returns 200, health returns `{ status: 'ok' }`.
