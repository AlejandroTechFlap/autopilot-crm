# Phase 6: Navigation, Polish & Deploy [IMPLEMENTED]

## Overview

Final phase: Command Palette (Cmd+K), responsive design, and Docker deployment.

## 1. Command Palette (Cmd+K)

Global search + quick actions using `cmdk` library (already installed as shadcn/ui `command` component).

### Search Categories
- **Companies**: search by name, navigate to detail
- **Contacts**: search by name, navigate to company
- **Deals**: search by company name, navigate to pipeline

### Quick Actions
- Create new lead
- Register a call
- Open AI chat
- Navigate to any page

### API Route

**GET /api/search?q=term**

Returns matching results across all entities (max 5 per category).

### Integration
- Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
- Registered in dashboard layout
- Accessible from any authenticated page

## 2. Responsive Design

### Breakpoints
- Desktop: 1280px+ (full layout)
- Tablet: 768-1279px (collapsible sidebar)
- Mobile: <768px (sheet sidebar, stacked layouts)

### Sidebar
- Mobile: hidden by default, opens as Sheet from hamburger menu in TopBar
- Tablet: icon-only collapsed mode
- Desktop: full sidebar

### Tables (empresas, contactos)
- Horizontal scroll on mobile
- Reduced columns on small screens

### Pipeline Kanban
- Horizontal scroll on mobile
- Min column width 280px

## 3. Docker Deployment

### Dockerfile (multi-stage)
1. Stage 1: `node:20-alpine` — install deps + build
2. Stage 2: `node:20-alpine` — copy standalone output + run

### docker-compose.yml
- Single service: `autopilot-crm`
- Environment variables from `.env` file
- Port mapping: 3000
- Health check

### Deployment via Portainer
- Push image or build on VPS
- Configure stack in Portainer with env vars
