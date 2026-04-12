# Autopilot CRM — Playbook de desarrollo con Claude Code
## Instrucciones exactas para el desarrollador

---

## Cómo usar este documento

Este playbook te dice exactamente qué hacer en cada sesión de Claude Code: qué archivos pasar, qué prompt escribir, y qué verificar antes de avanzar. Sigue el orden. No te saltes fases.

### Documentos que tienes

| Documento | Para qué sirve | Cuándo se usa |
|-----------|----------------|---------------|
| `Autopilot_CRM_Especificacion_Tecnica_Desarrollo.md` | Especificación completa: modelo de datos, queries, cálculos, reglas | Se pasa a Claude Code como contexto en CADA sesión |
| `Autopilot_CRM_Guia_Desarrollo_Claude_Code.md` | Guía de fases con estimaciones y criterios | Referencia tuya para saber qué toca |
| `Prototipo_MVP_CRM_Flap_RSR.html` | Prototipo visual Pipeline + Ficha | Se pasa cuando construyas esas pantallas |
| `Prototipo_Dashboard_Direccion_CRM.html` | Prototipo visual Dashboard | Se pasa cuando construyas esa pantalla |
| `Prototipo_Cockpit_Vendedor_CRM.html` | Prototipo visual Cockpit | Se pasa cuando construyas esa pantalla |
| `Prototipo_Base_Datos_CRM.html` | Prototipo visual Base de datos | Se pasa cuando construyas esa pantalla |
| `MVP_CRM_Flap_x_RSR_Especificacion_Funcional.md` | Spec funcional con reglas configurables y gaps | Referencia tuya, no se pasa a Claude Code |

### Regla de oro

Cada sesión de Claude Code sigue este patrón:

1. **Pasa el contexto** (documentos + estado actual del proyecto)
2. **Da el prompt** (copia del que está abajo)
3. **Verifica los criterios** (antes de avanzar)
4. **Haz commit** con mensaje convencional
5. **Si la sesión se alarga** (15+ intercambios), pide un checkpoint antes de cerrar

---

## SESIÓN 0: Prompt de inicialización del proyecto

### Qué pasar a Claude Code

- `Autopilot_CRM_Especificacion_Tecnica_Desarrollo.md` (adjuntar completo)

### Prompt exacto

```
Eres el lead developer de un proyecto CRM llamado "Autopilot CRM". Adjunto la especificación técnica completa.

ANTES DE ESCRIBIR CÓDIGO, necesito que hagas 3 cosas:

1. LEE la especificación técnica completa que adjunto.

2. INICIALIZA el proyecto con esta estructura y stack:
   - BACKEND: Node.js + Express + TypeScript
   - FRONTEND: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
   - BASE DE DATOS: PostgreSQL (con migraciones SQL versionadas)
   - AUTH: JWT con middleware de roles (admin, direccion, vendedor)
   - ESTRUCTURA: Monorepo con /backend y /frontend

3. CONFIGURA el proyecto siguiendo estas prácticas obligatorias:
   - Arquitectura de 3 capas en backend: Routes (finos) → Services (lógica) → Repositories (datos)
   - Estructura de features en frontend: src/features/{nombre}/components|hooks|services|schemas
   - Validación de variables de entorno al arrancar (falla rápido si falta alguna)
   - .env.example con placeholders, .env en .gitignore DESDE EL PRIMER COMMIT
   - Validación de input con Zod en TODA la API
   - Manejo de errores centralizado con clases tipadas (AppError, NotFoundError, ValidationError)
   - Logging estructurado con Pino (redactar campos sensibles)
   - Commits convencionales: feat(scope): descripción
   - CORS con orígenes específicos, nunca wildcard
   - Queries parametrizadas SIEMPRE, nunca concatenar input de usuario en SQL

Genera:
- La estructura completa de carpetas
- package.json de ambos proyectos con dependencias
- Configuración de TypeScript, Vite, Tailwind, ESLint
- .env.example con todas las variables necesarias
- .gitignore completo
- README.md con instrucciones de setup
- El módulo de config que valida env vars al arrancar
- El middleware de errores centralizado
- El middleware de autenticación con JWT y roles
- El cliente de base de datos PostgreSQL configurado

NO crees todavía tablas, endpoints ni componentes. Solo la estructura y configuración base.
```

### Verificar antes de avanzar

- [ ] El proyecto arranca sin errores (`npm run dev` en ambos)
- [ ] Hay .env.example con variables y .env en .gitignore
- [ ] La estructura de carpetas es correcta (features/ en frontend, routes/services/repositories en backend)
- [ ] El middleware de auth rechaza peticiones sin token (probar con curl)
- [ ] El manejo de errores devuelve formato JSON consistente
- [ ] Las env vars se validan al arrancar (quitar una y verificar que falla con mensaje claro)

### Commit

```
git init
git add .
git commit -m "chore(project): inicializar estructura del proyecto con stack completo"
```

---

## SESIÓN 1: Modelo de datos

### Qué pasar a Claude Code

No hace falta volver a pasar el spec si estás en la misma sesión. Si es sesión nueva:
- `Autopilot_CRM_Especificacion_Tecnica_Desarrollo.md`
- Decirle: "El proyecto ya está inicializado con la estructura de la sesión anterior."

### Prompt exacto

```
Crea las migraciones SQL para todas las tablas del CRM. La especificación del modelo de datos está en la sección 2 del documento que ya tienes.

Necesito migraciones numeradas y versionadas en /backend/migrations/:

001_create_usuarios.sql
002_create_pipelines_y_fases.sql
003_create_empresas.sql
004_create_contactos.sql
005_create_deals.sql
006_create_actividades.sql
007_create_configuracion.sql (scripts, notificacion_config, kpi_config, comisiones, notificaciones_log)
008_create_tareas.sql
009_create_vistas_guardadas.sql

Para cada migración:
- Crea la tabla con TODOS los campos del spec (tipos exactos, constraints, defaults)
- Añade FKs con ON DELETE RESTRICT (nunca CASCADE — no queremos borrado en cascada)
- Añade índices para las queries principales:
  - empresas: idx por vendedor_asignado, lifecycle_stage, fuente_lead
  - deals: idx por empresa_id, fase_actual, vendedor_asignado, resultado
  - actividades: idx por empresa_id + created_at DESC, deal_id, contacto_id
  - contactos: idx por empresa_id
- La tabla actividades debe tener un TRIGGER que impida UPDATE y DELETE (inmutabilidad)
- La tabla notificaciones_log igual: inmutable

También crea 010_seed_data.sql con los datos de demo del sector retail mascotas:
- 1 pipeline "Retail mascotas" con 6 fases (con tiempos esperados: 1d, 2d, 5d, 7d, 10d, null)
- 4 usuarios: admin@autopilot.com (admin), rebeca@rsrbridge.com (direccion), ignacio@rsrbridge.com (vendedor), laura@rsrbridge.com (vendedor)
- 11 empresas con los datos del prototipo (Clínica Animalia, MimoPets, Luna Perruna, Lobitos&Co, etc.)
- 15 contactos (algunas empresas con 2: Luna Perruna tiene Pablo + Marina, Agropecuario tiene Elena + Rafael, Clínica Animalia tiene Carmen + Andrés)
- 11 deals en distintas fases (VetPartners lleva 18 días en negociación, Amor de Gato 7 días en seguimiento)
- ~30 actividades de ejemplo
- 4 scripts comerciales
- Config de 3 disparadores de notificación
- Config de 5 KPIs con umbrales

También crea el script de ejecución de migraciones en /backend/scripts/migrate.ts

Y crea los Repository base con los tipos TypeScript para cada tabla en /backend/src/repositories/
```

### Verificar antes de avanzar

- [ ] Todas las migraciones se ejecutan sin errores
- [ ] `SELECT * FROM empresas` devuelve 11 filas
- [ ] `SELECT * FROM contactos` devuelve 15 filas
- [ ] `INSERT INTO actividades ... ON CONFLICT DO UPDATE` FALLA (inmutabilidad funciona)
- [ ] `DELETE FROM actividades WHERE id = 1` FALLA
- [ ] Los JOINs funcionan: `SELECT e.nombre, c.nombre_completo FROM empresas e JOIN contactos c ON c.empresa_id = e.id WHERE c.es_principal = true`
- [ ] Los tipos TypeScript coinciden con las tablas

### Commit

```
git add .
git commit -m "feat(database): crear migraciones, seed data y repositories base"
```

---

## SESIÓN 2: API — Empresas y Contactos

### Qué pasar a Claude Code (si sesión nueva)

- `Autopilot_CRM_Especificacion_Tecnica_Desarrollo.md`
- Estado: "El proyecto tiene la estructura inicializada y las migraciones de BBDD ejecutadas con seed data."

### Prompt exacto

```
Construye la API CRUD para Empresas y Contactos. La especificación de endpoints está en las secciones 5 y 8 del documento técnico.

Sigue estrictamente la arquitectura de 3 capas:
- /backend/src/routes/empresas.routes.ts → solo parsea request y llama a service
- /backend/src/services/empresas.service.ts → toda la lógica de negocio
- /backend/src/repositories/empresas.repository.ts → toda la interacción con DB

Valida TODOS los inputs con Zod schemas en /backend/src/schemas/

ENDPOINTS EMPRESAS:

GET /api/empresas
- Paginación cursor-based (param: cursor, limit default 20)
- Filtros por query params: lifecycle_stage, vendedor_asignado, fuente_lead, provincia
- Búsqueda: param "q" busca en nombre, contacto principal, teléfono, email (ILIKE)
- Ordenable: param "sort" (ej: sort=-updated_at, sort=nombre)
- Cada fila incluye campos calculados via JOINs:
  - contacto_principal: JOIN contactos WHERE es_principal = true
  - ultima_actividad: subquery MAX(actividades.created_at)
  - valor_total: subquery SUM(deals.valor WHERE resultado = 'ganado')
  - deals_activos: subquery COUNT(deals WHERE resultado IS NULL)

GET /api/empresas/:id
- Devuelve empresa + contactos + deals + últimas 20 actividades

POST /api/empresas
- Crea empresa + contacto principal en UNA transacción
- Campos obligatorios: nombre, fuente_lead, vendedor_asignado, proxima_accion, proxima_accion_fecha, contacto_nombre, contacto_telefono, contacto_email
- El contacto se crea con es_principal = true

PUT /api/empresas/:id
- Actualiza campos. Crea actividad tipo "sistema" registrando qué cambió.
- Solo el vendedor asignado o roles superiores pueden editar

POST /api/empresas/:id/actividades
- Crea actividad (tipo: llamada/nota/reunion)
- Campos: tipo, contenido, contacto_id (opcional), deal_id (opcional)
- Actualiza empresas.updated_at

ENDPOINTS CONTACTOS:

GET /api/contactos
- Misma estructura de paginación y filtros
- JOIN con empresas para nombre empresa y lifecycle
- Filtrable por: empresa_id, cargo (ILIKE), es_principal, vendedor (via empresa)

POST /api/contactos
- Si es_principal = true, poner false a los otros de la misma empresa (en transacción)

PUT /api/contactos/:id

IMPORTANTE:
- NUNCA implementes DELETE para empresas ni actividades
- Queries SIEMPRE parametrizadas ($1, $2)
- Errores devuelven formato AppError consistente
- Middleware de auth verifica rol: vendedor solo edita sus propias empresas
```

### Verificar antes de avanzar

- [ ] GET /api/empresas devuelve 11 empresas con campos calculados correctos
- [ ] GET /api/empresas?q=animalia encuentra Clínica Animalia
- [ ] GET /api/empresas?lifecycle_stage=lead devuelve solo leads
- [ ] GET /api/empresas?sort=-valor_total ordena por valor descendente
- [ ] POST /api/empresas crea empresa + contacto en una transacción
- [ ] POST /api/empresas/:id/actividades crea actividad y actualiza updated_at
- [ ] PUT /api/empresas/:id como vendedor que NO es asignado → 403
- [ ] GET /api/contactos devuelve 15 contactos con empresa y lifecycle
- [ ] DELETE /api/empresas/:id → 404 o 405 (no existe el endpoint)

### Commit

```
git add .
git commit -m "feat(api): implementar CRUD empresas y contactos con filtros y paginación"
```

---

## SESIÓN 3: API — Deals, Pipeline y Dashboard

### Prompt exacto

```
Construye la API para Deals, Pipeline y Dashboard. Especificación en secciones 4, 6 del documento técnico.

ENDPOINTS DEALS / PIPELINE:

GET /api/pipeline/:pipeline_id
- Deals activos (resultado IS NULL) agrupados por fase
- Para cada deal: empresa nombre, valor, días en fase (NOW - fecha_entrada_fase), semáforo calculado, vendedor, fuente, próxima acción
- Semáforo: dias/tiempo_esperado → verde ≤0.7, ámbar 0.7-1.0, rojo >1.0. Si tiempo_esperado es NULL → null.
- Filtrable por: vendedor_asignado, rango valor (min/max), categoria empresa
- Devuelve también: conteo y suma por fase

POST /api/deals
- Crea deal vinculado a empresa y pipeline
- fecha_entrada_fase = NOW()

PUT /api/deals/:id/mover
- Recibe: nueva_fase_id
- Acción: UPDATE fase_actual + SET fecha_entrada_fase = NOW()
- Crear actividad tipo "cambio_fase" con contenido "Movido de [fase_anterior] a [fase_nueva]"
- Validar criterios_entrada de la nueva fase (JSON con campos requeridos). Si faltan, devolver { warnings: [...] } pero PERMITIR el movimiento.

PUT /api/deals/:id/cerrar
- Recibe: resultado (ganado/perdido), motivo_perdida (obligatorio si perdido)
- Si ganado:
  1. Crear registro en tabla comisiones (calcular con fórmula de config o default 5%)
  2. Actualizar lifecycle empresa → "cliente"
  3. Crear actividad tipo "sistema": "Deal cerrado como ganado"
- Si perdido:
  1. Validar que motivo_perdida NO es vacío
  2. Crear actividad tipo "sistema": "Deal cerrado como perdido. Motivo: [motivo]"
- En ambos: SET resultado, cerrado_en = NOW()

ENDPOINTS DASHBOARD:

GET /api/dashboard/kpis
- Calcula los 5 KPIs (ver sección 6.2 del spec):
  1. pipeline_total: SUM valores deals abiertos + objetivo de config + calcular semáforo
  2. conversion: por cada par de fases, contar entrados vs avanzados este mes
  3. actividad: COUNT por tipo este mes + mismo cálculo mes anterior para variación
  4. deals_riesgo: COUNT deals donde días > tiempo_esperado + empresas con próxima_acción vencida
  5. top5: SELECT deals ORDER BY valor DESC LIMIT 5

GET /api/dashboard/historico
- Últimos 6 meses:
  1. ventas_mes: SUM deals ganados GROUP BY month
  2. leads_mes: COUNT empresas creadas GROUP BY month
  3. tiempo_cierre: AVG(cerrado_en - created_at) deals ganados GROUP BY month
  4. conversion_global: COUNT ganados / COUNT cerrados * 100 GROUP BY month

GET /api/dashboard/drill/:tipo
- Desglose detallado de cada KPI (por vendedor, por fase, etc.)

ENDPOINTS COCKPIT:

GET /api/mis-tareas
- Tareas del vendedor autenticado, ordenadas: URGENTE (vencidas + deals rojos) > ALTA (hoy/mañana) > NORMAL (futuras)
- Incluye origen (manual/sistema), empresa vinculada

PUT /api/tareas/:id/completar
- Marca como completada, crea actividad en la empresa

PUT /api/tareas/:id/posponer
- Cambia fecha_vencimiento

GET /api/mis-kpis
- Pipeline personal, conversión personal, comisiones acumuladas

GET /api/scripts
- Lista ordenada por fase, con búsqueda por título y contenido

Todas las mismas reglas: Zod validation, 3 capas, queries parametrizadas, errores tipados.
```

### Verificar antes de avanzar

- [ ] GET /api/pipeline/1 devuelve deals agrupados con semáforos correctos
- [ ] VetPartners tiene semáforo rojo (18d > 10d esperado)
- [ ] PUT /api/deals/:id/mover crea actividad de cambio_fase
- [ ] PUT /api/deals/:id/cerrar con resultado=ganado genera comisión
- [ ] PUT /api/deals/:id/cerrar con resultado=perdido sin motivo → 400
- [ ] GET /api/dashboard/kpis devuelve los 5 KPIs con valores coherentes
- [ ] GET /api/dashboard/historico devuelve datos de 6 meses
- [ ] GET /api/mis-tareas (como Ignacio) devuelve tareas ordenadas por prioridad
- [ ] GET /api/scripts devuelve 4 scripts

### Commit

```
git add .
git commit -m "feat(api): implementar endpoints pipeline, dashboard, cockpit y notificaciones"
```

---

## SESIÓN 4: Frontend — Pipeline + Ficha

### Qué pasar a Claude Code

- `Autopilot_CRM_Especificacion_Tecnica_Desarrollo.md`
- `Prototipo_MVP_CRM_Flap_RSR.html` (adjuntar como referencia visual)
- Estado: "Backend completo con todos los endpoints funcionando."

### Prompt exacto

```
Construye las pantallas de Pipeline y Ficha de empresa para el frontend React. Adjunto el prototipo HTML como referencia visual exacta del diseño.

Estructura en features:
/frontend/src/features/pipeline/
  components/KanbanBoard.tsx, KanbanColumn.tsx, DealCard.tsx, PipelineFilters.tsx, CreateLeadModal.tsx, QuickActivityForm.tsx
  hooks/usePipeline.ts, useDeals.ts
  services/pipeline.service.ts
  schemas/deal.schema.ts

/frontend/src/features/empresa/
  components/EmpresaPanel.tsx, ContactList.tsx, DealList.tsx, Timeline.tsx, QuickActions.tsx
  hooks/useEmpresa.ts, useActividades.ts
  services/empresa.service.ts

PIPELINE (/pipeline):
- Consume GET /api/pipeline/:id
- Tablero Kanban con columnas = fases. Usa @dnd-kit para drag-and-drop.
- Cada columna: nombre fase, conteo deals, valor total €
- Tarjeta de deal según el prototipo: nombre empresa, valor €, días en fase, próxima acción + fecha, avatar vendedor, semáforo (verde/ámbar/rojo con CSS), tag fuente
- Drag-and-drop: al soltar, PUT /api/deals/:id/mover. Mostrar warnings si hay criterios incumplidos.
- Barra de filtros: vendedor (select), rango valor (min-max)
- Click en empresa → abre panel lateral derecho con ficha (EmpresaPanel)
- Botón "+ Crear" en primera columna → modal con formulario
- Registro rápido: click en tarjeta → iconos llamada/nota/reunión → input → POST actividad
- Semáforo rojo PULSA (CSS animation)

FICHA EMPRESA (panel lateral):
- Consume GET /api/empresas/:id
- Cabecera: nombre, lifecycle badge, vendedor, fuente
- Sección contactos: lista con badge Principal, botón añadir
- Sección deals: activos + cerrados con link
- Timeline: scroll infinito, actividades en orden DESC, inmutable
- Acciones rápidas: 4 botones fijos abajo (llamada, nota, reunión, avanzar fase)

DISEÑO: usa la misma paleta del prototipo HTML adjunto. Tipografía: DM Sans para body, Fraunces para títulos y números. Semáforos: verde #27AE60, ámbar #E2A336, rojo #E24B4A. Accent: #6C5CE7.
```

### Verificar antes de avanzar

- [ ] Pipeline carga con datos reales desde la API
- [ ] Drag-and-drop funciona y persiste tras recargar
- [ ] Filtros filtran correctamente
- [ ] Click en empresa abre panel lateral con datos reales
- [ ] Timeline muestra actividades en orden correcto
- [ ] Botones de acción rápida crean actividades que aparecen en timeline
- [ ] Crear nuevo lead desde modal funciona y aparece en primera columna
- [ ] Semáforo rojo pulsa en VetPartners

### Commit

```
git add .
git commit -m "feat(frontend): implementar pipeline Kanban y ficha empresa con panel lateral"
```

---

## SESIÓN 5: Frontend — Cockpit vendedor

### Qué pasar

- `Prototipo_Cockpit_Vendedor_CRM.html` (referencia visual)
- Estado del proyecto

### Prompt exacto

```
Construye la pantalla del Cockpit del vendedor (/mis-tareas). Adjunto el prototipo HTML como referencia visual.

Estructura:
/frontend/src/features/cockpit/
  components/TaskInbox.tsx, TaskCard.tsx, MiniDashboard.tsx, CommissionBox.tsx, LeadQuickCard.tsx, ScriptLibrary.tsx, ScriptCard.tsx
  hooks/useTareas.ts, useMisKpis.ts, useComisiones.ts, useScripts.ts
  services/cockpit.service.ts

Layout: grid 2 columnas (60% tareas / 40% sidebar) con breakpoint a 1 columna en tablet.

BANDEJA DE TAREAS (izquierda):
- Consume GET /api/mis-tareas
- 3 secciones con header de color: URGENTE (rojo), ALTA (ámbar), NORMAL (verde)
- Cada tarea: barra lateral de color prioridad, empresa, acción, meta (tag auto/manual, fecha, fase, valor)
- Badge "Automática" con icono rayo si origen=sistema
- Botón "Hecho" → PUT /api/tareas/:id/completar → atenuar tarea con transición
- Botón "Posponer" → datepicker → PUT /api/tareas/:id/posponer
- Click en tarea → seleccionar (borde accent) + mostrar ficha rápida en sidebar
- Filtros: chips "Todas", "Urgentes", "Hoy", "Automáticas"

SIDEBAR (derecha):
1. Mini dashboard: 2 cards (pipeline personal € + conversión %) consume GET /api/mis-kpis
2. Comisiones: box destacado con total + lista últimos deals. Consume GET /api/mis-comisiones
3. Ficha rápida: aparece al seleccionar tarea. Nombre contacto, empresa, teléfono, email, valor, fase, última nota. Link "Ver ficha completa →" navega a /empresa/:id
4. Scripts: lista expandible por fase con buscador. Consume GET /api/scripts. Click expande texto completo.
```

### Verificar

- [ ] Tareas cargan ordenadas por prioridad
- [ ] "Hecho" completa la tarea y crea actividad
- [ ] Ficha rápida se actualiza al seleccionar cada tarea
- [ ] Comisiones muestran acumulado correcto
- [ ] Scripts se buscan y expanden
- [ ] Layout responsive funciona en tablet

### Commit

```
git add .
git commit -m "feat(frontend): implementar cockpit vendedor con tareas, KPIs y scripts"
```

---

## SESIÓN 6: Frontend — Dashboard

### Qué pasar

- `Prototipo_Dashboard_Direccion_CRM.html` (referencia visual)

### Prompt exacto

```
Construye la pantalla del Dashboard de dirección (/dashboard). Adjunto el prototipo HTML como referencia visual. Solo accesible por roles admin y dirección.

Estructura:
/frontend/src/features/dashboard/
  components/KpiTile.tsx, KpiSemaphore.tsx, Sparkline.tsx, DrillDownPanel.tsx, HistoricalCard.tsx, HistoricalChart.tsx
  hooks/useDashboardKpis.ts, useHistorico.ts, useDrillDown.ts
  services/dashboard.service.ts

ZONA SUPERIOR — 5 KPI tiles (grid 3 columnas, KPI5 ocupa 2):
- Consume GET /api/dashboard/kpis
- Cada tile: valor, semáforo (badge color), variación % (flecha + badge verde/rojo), sparkline 30d (usa Chart.js o Recharts, línea pequeña sin ejes)
- KPI4 "Deals en riesgo": además del número, listar inline los 3 deals con empresa + días
- Click en tile → panel lateral DrillDownPanel con gráficos detallados (consume GET /api/dashboard/drill/:tipo)
- Usa Chart.js para todos los gráficos de drill-down

Drill-downs:
- Pipeline: barras horizontales por fase + tabla vendedores + barra progreso vs objetivo
- Conversión: barras funnel + tabla transiciones + alerta si alguna < media
- Actividad: 3 cards + stacked bars vendedores + línea diaria 14d
- Deals riesgo: tarjetas expandidas + botón "Notificar" + total valor en riesgo
- Top5: tabla completa + donut por fase

ZONA INFERIOR — 4 KPIs históricos (grid 2x2, separada por border-top):
- Consume GET /api/dashboard/historico
- Ventas cerradas/mes: barras (mes actual verde, anteriores gris)
- Leads nuevos/mes: línea con área sombreada
- Tiempo medio cierre: línea ámbar
- Conversión global: línea + referencia discontinua
- Cada card: título, valor agregado, variación vs semestre anterior, gráfico

Selector período: botones "7 días", "Este mes", "Trimestre". Re-fetch datos al cambiar.
```

### Commit

```
git add .
git commit -m "feat(frontend): implementar dashboard dirección con KPIs actuales e históricos"
```

---

## SESIÓN 7: Frontend — Base de datos

### Qué pasar

- `Prototipo_Base_Datos_CRM.html` (referencia visual)

### Prompt exacto

```
Construye la pantalla de Base de datos (/empresas y /contactos). Adjunto el prototipo HTML como referencia visual.

Estructura:
/frontend/src/features/database/
  components/DatabasePage.tsx, DataTable.tsx, ColumnHeader.tsx, SearchBar.tsx, ViewChips.tsx, BulkActionBar.tsx, InlineEditCell.tsx, ExportButton.tsx
  hooks/useDataTable.ts, useViews.ts
  services/database.service.ts

2 TABS dentro de la misma página:

Tab Empresas:
- Consume GET /api/empresas con cursor pagination
- Tabla con 12 columnas: nombre (link), lifecycle (badge), contacto principal, teléfono (click-to-call), email, vendedor (avatar+nombre), valor total €, deals activos, última actividad (relativa, rojo si >7d), fuente (tag color), provincia, fecha creación
- Búsqueda: input con debounce 300ms, envía param q a la API
- Click en cabecera: toggle sort ASC/DESC, envía param sort
- Vistas guardadas: chips "Todas", "Solo mis cuentas", "Clientes activos", "Leads fríos >7d". Cada chip aplica filtros query params.
- Checkboxes + barra de acciones en bloque (reasignar vendedor, etiquetar, exportar)
- Exportar CSV: genera y descarga archivo
- Click en nombre → navega a /empresa/:id
- Edición inline: click en celda → input → blur = PUT /api/empresas/:id
- Scroll infinito: IntersectionObserver al final de tabla → fetch siguiente página

Tab Contactos:
- Consume GET /api/contactos
- 10 columnas: nombre, empresa (link), cargo, teléfono, email, principal (badge), vendedor, última actividad, lifecycle (heredado), fecha creación
- Vistas: "Todos", "Solo mis contactos", "Decisores", "Contactos principales"
- Mismas funcionalidades de tabla

Botón "+ Nueva empresa" abre modal reutilizado del pipeline (CreateLeadModal).
```

### Commit

```
git add .
git commit -m "feat(frontend): implementar base de datos con tablas, búsqueda, filtros y vistas"
```

---

## SESIÓN 8: Motor de notificaciones

### Prompt exacto

```
Implementa el motor de notificaciones como un servicio backend que se ejecuta periódicamente.

Estructura:
/backend/src/services/notifications/
  notification-engine.ts — orquestador principal
  triggers/seguimiento-vencido.ts — disparador 1
  triggers/deal-estancado.ts — disparador 2  
  triggers/kpi-rojo.ts — disparador 3
  channels/email.channel.ts — envío por email
  channels/slack.channel.ts — envío por Slack webhook
  channels/inapp.channel.ts — notificación in-app

DISPARADOR 1 — Seguimiento vencido:
- Query: empresas con lifecycle IN (lead, contactado) donde MAX(actividades.created_at) > umbral
- Si fuente = ADS: umbral 24h. Otros: umbral 48h (configurables desde notificacion_config)
- NO crear tarea duplicada: verificar que no existe tarea activa del mismo tipo para esa empresa
- Crear tarea con prioridad URGENTE + notificar por canal configurado

DISPARADOR 2 — Deal estancado:
- Query: deals abiertos WHERE NOW() - fecha_entrada_fase > fases.tiempo_esperado
- Mismo patrón: no duplicar, crear tarea + notificar

DISPARADOR 3 — KPI en zona roja:
- Evaluar cada KPI de kpi_config. Si valor cruza umbral rojo Y no estaba ya en rojo: notificar a dirección.
- Mantener un campo "estado_anterior" para detectar transiciones (no notificar si ya estaba en rojo).

CANAL EMAIL: usar nodemailer o similar. Template HTML con datos del deal/empresa.
CANAL SLACK: HTTP POST al webhook URL configurado. Formato bloques Slack.
CANAL IN-APP: INSERT en tabla notificaciones con leido = false. Endpoint GET /api/notificaciones para el frontend.

TODO queda registrado en notificaciones_log (inmutable).

Crear un script /backend/scripts/run-notifications.ts que ejecuta el engine una vez (para cron externo) y un endpoint POST /api/admin/run-notifications (para testing manual, solo admin).

El cron se configura externamente (crontab o similar) para ejecutar cada 15 minutos.
```

### Commit

```
git add .
git commit -m "feat(notifications): implementar motor con 3 disparadores y 3 canales"
```

---

## SESIÓN 9: Navegación, roles y integración

### Prompt exacto

```
Integra todas las pantallas en la aplicación completa:

1. NAVEGACIÓN:
- Barra superior con tabs: Pipeline | Dashboard | Mis tareas | Base de datos
- "Dashboard" solo visible si rol = admin o dirección
- Landing al login: vendedor → /mis-tareas, dirección → /dashboard, admin → /dashboard
- Route guards: /dashboard rechaza vendedor, /admin rechaza no-admin
- Click en empresa desde CUALQUIER pantalla abre la misma ficha

2. ROLES EN FRONTEND:
- Hook useAuth() que devuelve usuario, rol, y permisos
- Componentes condicionales: botón "Notificar" solo para dirección, "Reasignar" solo para dirección+admin
- Pipeline: vendedor ve solo sus deals, dirección ve todos

3. LOGIN:
- Pantalla /login con email + password
- POST /api/auth/login → devuelve JWT + user info
- Almacenar token en httpOnly cookie o secure localStorage
- Redirect automático a landing page según rol

4. FLUJOS END-TO-END que deben funcionar:
- Crear lead en pipeline → aparece en BBDD → genera tarea 24h en cockpit
- Mover deal → timeline se actualiza → dashboard recalcula
- Cerrar deal ganado → comisión en cockpit → histórico en dashboard → lifecycle en BBDD
- Deal estancado → semáforo rojo → tarea urgente en cockpit → KPI4 en dashboard

5. RESPONSIVE:
- Desktop: layout completo
- Tablet (1024px): sidebar del cockpit debajo, Kanban con scroll horizontal
- Móvil (375px): menú hamburguesa, tablas con scroll horizontal
```

### Commit

```
git add .
git commit -m "feat(app): integrar navegación, auth, roles y flujos end-to-end"
```

---

## SESIÓN 10: Testing y datos de demo

### Prompt exacto

```
Prepara la aplicación para la demo final:

1. VERIFICAR estos 6 flujos end-to-end:
- Crear lead → pipeline + BBDD + tarea 24h en cockpit
- Avanzar deal de fase → timeline + semáforo + dashboard
- Cerrar ganado → comisión + lifecycle cliente + dashboard histórico
- Cerrar perdido → motivo obligatorio + sale del pipeline + BBDD mantiene
- Deal estancado → rojo + tarea urgente + dashboard KPI4
- BBDD → buscar + filtrar + exportar CSV

2. CARGAR datos de demo definitivos con este escenario:
- Pipeline con deals distribuidos: 2 nuevos, 2 contactados, 2 en seguimiento, 2 propuesta, 2 negociación, 1 cerrado
- Al menos 1 deal en riesgo visible (VetPartners 18d) y 1 seguimiento vencido (Amor de Gato)
- Al menos 1 comisión generada (Example Veterinaria cerrado por Laura)
- Actividades de los últimos 30 días para que sparklines tengan forma
- Al menos 1 KPI en rojo o ámbar visible en el dashboard

3. LIMPIAR:
- Quitar console.logs de desarrollo
- Verificar que no hay secretos hardcodeados
- Verificar que .env.example tiene todas las variables
- Verificar que README tiene instrucciones completas de setup y deploy

4. DEMO SCRIPT (la demo dura 15 minutos):
- Minuto 0-3: Login como vendedor Ignacio → Cockpit con tareas urgentes
- Minuto 3-5: Completar una tarea → ver cómo se refleja
- Minuto 5-8: Ir al Pipeline → mover un deal → ver semáforo
- Minuto 8-10: Abrir ficha de empresa → ver timeline + contactos
- Minuto 10-12: Login como Rebeca (dirección) → Dashboard con KPIs
- Minuto 12-14: Drill-down de un KPI → ver gráficos
- Minuto 14-15: Base de datos → búsqueda → filtro → exportar
```

### Commit final

```
git add .
git commit -m "feat(demo): preparar datos, verificar flujos y limpiar para demo Rebeca"
git tag v0.1.0-mvp
```

---

## Resumen de sesiones

| Sesión | Qué se construye | Documentos a pasar | Commit |
|--------|------------------|-------------------|--------|
| 0 | Setup proyecto | Spec técnica | `chore(project): inicializar` |
| 1 | Modelo de datos | Spec técnica (si nueva sesión) | `feat(database): migraciones y seed` |
| 2 | API Empresas + Contactos | Spec técnica | `feat(api): CRUD empresas y contactos` |
| 3 | API Deals + Pipeline + Dashboard | Spec técnica | `feat(api): pipeline, dashboard, cockpit` |
| 4 | Frontend Pipeline + Ficha | Spec + Prototipo Pipeline HTML | `feat(frontend): pipeline y ficha` |
| 5 | Frontend Cockpit | Spec + Prototipo Cockpit HTML | `feat(frontend): cockpit vendedor` |
| 6 | Frontend Dashboard | Spec + Prototipo Dashboard HTML | `feat(frontend): dashboard dirección` |
| 7 | Frontend BBDD | Spec + Prototipo BBDD HTML | `feat(frontend): base de datos` |
| 8 | Motor notificaciones | Spec técnica | `feat(notifications): motor + canales` |
| 9 | Navegación + Auth + Integración | Spec técnica | `feat(app): integración completa` |
| 10 | Testing + Demo | Ninguno extra | `feat(demo): listo para presentación` |

---

## Reglas para TODAS las sesiones

1. **Al inicio de cada sesión nueva**, pasa el spec técnico y dile a Claude Code en qué fase estás y qué ya está construido.

2. **Nunca pases a la siguiente sesión sin verificar los criterios** de la actual. Un bug en la API se convierte en 5 bugs en el frontend.

3. **Haz commit al final de cada sesión** con mensaje convencional. Si una sesión es muy larga, haz commits intermedios.

4. **Si Claude Code pierde contexto** (respuestas genéricas, olvida lo anterior), pídele un checkpoint y abre nueva sesión pasando el contexto fresco.

5. **Si algo no funciona**, copia el error completo y dáselo. No digas "no funciona", di "al hacer POST /api/deals, devuelve 500 con este stack trace: [pegar]".

6. **Prioriza que funcione sobre que sea bonito.** Primero datos correctos, luego diseño pixel-perfect.
