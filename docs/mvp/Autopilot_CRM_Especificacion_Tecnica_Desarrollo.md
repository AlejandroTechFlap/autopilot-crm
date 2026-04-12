# Autopilot CRM — Especificación técnica para desarrollo
## Commercial Autopilot Essentials · Flap Consulting × RSR Bridge

**Versión:** 2.0 — Abril 2026  
**Destinatario:** Equipo de desarrollo  
**Prototipos de referencia:** 4 archivos HTML interactivos con datos ficticios  

---

# PARTE 1: ESPECIFICACIÓN FUNCIONAL DEL MVP

---

## 1. Visión general del producto

Autopilot CRM es un sistema de gestión comercial diseñado para equipos de ventas sin CRM previo. Se entrega como propiedad del cliente (sin licencias recurrentes de terceros) y es configurable por cada cliente desde un panel de administración sin tocar código.

El MVP contiene 6 módulos, 6 pantallas, 42 funcionalidades y 3 roles de usuario.

### Stack sugerido (no obligatorio)

El producto debe poder desplegarse como self-hosted o white-label. La elección de stack queda a criterio del equipo de desarrollo, pero debe cumplir: tiempo real para actualizaciones de pipeline, soporte para roles y permisos, API para futuras integraciones (Slack webhooks, email), y capacidad de exportar datos a CSV.

---

## 2. Modelo de datos

### 2.1 Objetos principales

El sistema tiene 4 objetos core con relaciones 1:N:

```
EMPRESA (registro maestro central)
  ├── tiene N → CONTACTOS (personas vinculadas)
  ├── tiene N → DEALS (oportunidades de venta)
  └── tiene N → ACTIVIDADES (llamadas, notas, reuniones)

CONTACTO
  └── pertenece a 1 → EMPRESA

DEAL
  ├── pertenece a 1 → EMPRESA
  └── vive en 1 → FASE DEL PIPELINE

ACTIVIDAD
  ├── se vincula a 1 → EMPRESA
  ├── se vincula a 0..1 → CONTACTO
  └── se vincula a 0..1 → DEAL
```

### 2.2 Objeto EMPRESA

La empresa es el registro maestro. Una fila por empresa para siempre: nunca se borra, solo cambia de estado.

| Campo | Tipo | Obligatorio | Alimenta | Notas |
|-------|------|-------------|----------|-------|
| id | UUID/auto | Sí (sistema) | Todo | PK |
| nombre | string | Sí | Pipeline, BBDD, búsqueda | Identificador principal |
| lifecycle_stage | enum | Sí (sistema) | BBDD, KPIs | Lead / Contactado / En negociación / Cliente / Ex-cliente / No interesa. Calculado automáticamente o editable por vendedor. |
| fuente_lead | enum (configurable) | Sí | KPI conversión por fuente | ADS, Orgánico, Referido, BBDD, Feria, etc. Valores configurables por Admin (regla A6). |
| vendedor_asignado | FK → Usuario | Sí | Pipeline, cockpit, notificaciones | Determina a quién llegan las tareas y alertas |
| proxima_accion | string | Sí | Cockpit, pipeline tarjeta | Texto libre: "Enviar catálogo", "Llamar para cerrar" |
| proxima_accion_fecha | date | Sí | Cockpit priorización, notificaciones | Fecha de la próxima acción. Si se supera → tarea vencida. |
| provincia | string | No | Filtro BBDD | Texto libre o select configurable |
| etiquetas | multi-enum | No | Filtro BBDD, pipeline | Valores configurables por Admin |
| notas_internas | text | No | Ficha empresa | Texto largo, visible solo para el equipo |
| prioridad | enum | No | Cockpit ordenación | Alta / Media / Baja |
| fecha_vencimiento | date | No | Cockpit, alertas | Fecha límite de la oportunidad |
| categoria | enum (configurable) | No | Filtro BBDD | Mascotas, Veterinaria, Agro, etc. |
| descripcion | text | No | Ficha empresa | Descripción larga del lead |
| informador | string | No | Ficha empresa | Quién refirió al lead |
| created_at | datetime | Sí (sistema) | BBDD, KPIs | Timestamp de creación |
| updated_at | datetime | Sí (sistema) | BBDD | Timestamp de última modificación |

**Lifecycle stage:** Se actualiza automáticamente según las acciones. Cuando se crea → "Lead". Cuando se registra primera actividad → "Contactado". Cuando un deal entra en negociación → "En negociación". Cuando un deal se cierra como ganado → "Cliente". También editable manualmente. Los valores son configurables por Admin en versión futura.

### 2.3 Objeto CONTACTO

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| id | UUID/auto | Sí (sistema) | PK |
| empresa_id | FK → Empresa | Sí | Vínculo N:1 |
| nombre_completo | string | Sí | Nombre y apellidos |
| cargo | string | No | Director, Comprador, Gerente... |
| telefono | string | Sí | Click-to-call en tabla y ficha |
| email | string | Sí | Click-to-mail en tabla y ficha |
| es_principal | boolean | Sí (default false) | Solo 1 por empresa puede ser true |
| created_at | datetime | Sí (sistema) | |

**Creación simplificada:** Cuando el vendedor crea una nueva empresa, el formulario pide nombre de empresa + datos de la primera persona en un solo paso. El sistema crea Empresa + Contacto (marcado como principal) en una sola transacción. El vendedor no necesita saber que son dos tablas.

### 2.4 Objeto DEAL

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| id | UUID/auto | Sí (sistema) | PK |
| empresa_id | FK → Empresa | Sí | |
| pipeline_id | FK → Pipeline | Sí | Soporta múltiples pipelines (regla A5) |
| fase_actual | FK → Fase | Sí | Columna del Kanban |
| valor | decimal (EUR) | Sí | Valor de la oportunidad |
| vendedor_asignado | FK → Usuario | Sí | Puede diferir del vendedor de la empresa |
| fecha_entrada_fase | datetime | Sí (sistema) | Se resetea al cambiar de fase. Para calcular "días en fase". |
| motivo_perdida | enum (configurable) | Sí si cerrado perdido | Valores de regla A4 |
| cerrado_en | datetime | Null si abierto | Fecha de cierre |
| resultado | enum | Null si abierto | ganado / perdido |
| created_at | datetime | Sí (sistema) | |

**Días en fase** = NOW - fecha_entrada_fase. Se compara con el campo `tiempo_esperado` de la fase para calcular el semáforo.

### 2.5 Objeto ACTIVIDAD

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| id | UUID/auto | Sí (sistema) | PK |
| empresa_id | FK → Empresa | Sí | Siempre vinculada a empresa |
| contacto_id | FK → Contacto | No | Opcionalmente a un contacto específico |
| deal_id | FK → Deal | No | Opcionalmente a un deal |
| tipo | enum | Sí | llamada / nota / reunion / cambio_fase / sistema |
| contenido | text | No | Descripción o nota de la actividad |
| usuario_id | FK → Usuario | Sí | Quién la registró (o "sistema" si automática) |
| created_at | datetime | Sí (sistema) | INMUTABLE: no se puede editar ni borrar |

**Inmutabilidad:** Las actividades son el historial. Nunca se borran ni se editan. Solo se pueden añadir nuevas. Retención mínima 12 meses. Esto es una regla blindada del sistema.

### 2.6 Objetos de configuración

| Objeto | Descripción | Quién lo gestiona |
|--------|-------------|-------------------|
| Pipeline | Nombre + configuración. Un cliente puede tener N pipelines. | Admin |
| Fase | Nombre, orden, tiempo_esperado (días), criterios_entrada (JSON con campos requeridos). Pertenece a 1 Pipeline. | Admin |
| Usuario | Nombre, email, rol (admin/direccion/vendedor), avatar. | Admin |
| Script | Título, fase asociada, contenido, tags. | Dirección |
| Notificación_config | Disparador activo/inactivo, umbrales, canal, destinatario, horario. | Admin |
| KPI_config | Tipo de KPI, umbral verde, umbral ámbar, objetivo, período. | Admin |

---

## 3. Roles y permisos

| Acción | Admin | Dirección | Vendedor |
|--------|-------|-----------|----------|
| Configurar fases del pipeline | ✅ | ❌ | ❌ |
| Configurar KPIs y umbrales | ✅ | ❌ | ❌ |
| Configurar notificaciones | ✅ | ❌ | ❌ |
| Configurar comisiones | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Ver dashboard dirección | ✅ | ✅ | ❌ |
| Ver pipeline (todos) | ✅ | ✅ | ❌ |
| Ver pipeline (propios) | ✅ | ✅ | ✅ |
| Crear/editar deals | ✅ | ✅ | ✅ (propios) |
| Crear/editar empresas | ✅ | ✅ | ✅ |
| Registrar actividades | ✅ | ✅ | ✅ |
| Gestionar scripts | ✅ | ✅ | ❌ (solo leer) |
| Reasignar deals | ✅ | ✅ | ❌ |
| Crear tareas para otros | ✅ | ✅ | ❌ |
| Editar objetivos/targets | ✅ | ✅ | ❌ |
| Ver cockpit (propio) | ✅ | ✅ | ✅ |
| Ver base de datos (todas) | ✅ | ✅ | ✅ (leer) |
| Editar BBDD (propias) | ✅ | ✅ | ✅ |
| Exportar CSV | ✅ | ✅ | ✅ |

---

## 4. Pantalla: Pipeline (/pipeline)

### 4.1 Qué es

Vista Kanban de deals activos. Cada columna es una fase del proceso de venta. Cada tarjeta es un deal. Es la pantalla principal para Dirección.

### 4.2 De dónde vienen los datos

| Dato | Fuente |
|------|--------|
| Columnas | Tabla `fases` filtrada por `pipeline_id` activo, ordenada por `orden` |
| Tarjetas | Tabla `deals` WHERE `resultado IS NULL` (abiertos), ordenadas por `valor DESC` dentro de cada fase |
| Nombre empresa | `deals.empresa_id` → `empresas.nombre` |
| Valor | `deals.valor` |
| Días en fase | `NOW() - deals.fecha_entrada_fase` |
| Próxima acción | `empresas.proxima_accion` + `empresas.proxima_accion_fecha` |
| Vendedor | `deals.vendedor_asignado` → `usuarios.nombre` |
| Semáforo | Cálculo: días_en_fase vs `fases.tiempo_esperado`. Verde ≤70%, Ámbar 70-100%, Rojo >100% |
| Fuente | `empresas.fuente_lead` |
| Contadores columna | `COUNT(deals)` y `SUM(deals.valor)` por fase |

### 4.3 Funcionalidades

| Feature | Detalle técnico |
|---------|-----------------|
| **Drag-and-drop** | Al mover tarjeta: UPDATE `deals.fase_actual` + reset `deals.fecha_entrada_fase` = NOW(). Crear ACTIVIDAD tipo "cambio_fase". Validar `fases.criterios_entrada` (JSON): si hay campos requeridos vacíos → warning (no bloqueo en MVP). |
| **Filtros** | Barra superior con: vendedor (select), sector (select), rango valor (min-max EUR). Se aplican como WHERE sobre la query de deals. Combinables con AND. Filtros activos se reflejan en contadores. |
| **Crear nuevo lead** | Botón "+ Crear" en columna 1. Abre formulario con los 7 campos obligatorios de Empresa + nombre/teléfono/email del Contacto. Crea Empresa + Contacto + Deal en una transacción. |
| **Registro rápido actividad** | Click en tarjeta → iconos de acción (llamada/nota/reunión). Abre input mínimo (texto + guardar). Crea registro en tabla `actividades`. Máximo 2 clics. |
| **Semáforo** | Calculado en frontend o backend. Si `días_en_fase / tiempo_esperado > 1.0` → rojo + pulsar CSS. Si > 0.7 → ámbar. Else → verde. Si `tiempo_esperado` es NULL para esa fase → no mostrar semáforo. |

### 4.4 Conexiones con otras pantallas

| Acción en pipeline | Navega a |
|--------------------|----------|
| Click en nombre empresa de tarjeta | `/empresa/:id` (panel lateral o nueva página) |
| Deal cambia de fase | Actualiza datos del Dashboard (KPI pipeline, KPI conversión) |
| Deal pasa a rojo (semáforo) | Dispara notificación M5, aparece en cockpit M4 como tarea urgente, aparece en dashboard M3 KPI4 |
| Deal cerrado como ganado | Actualiza lifecycle empresa → "Cliente", calcula comisión en cockpit, sale del pipeline |
| Deal cerrado como perdido | Pide motivo (regla A4), sale del pipeline, empresa permanece en BBDD |

---

## 5. Pantalla: Ficha de empresa (/empresa/:id)

### 5.1 Qué es

Vista detallada de una empresa. Se accede desde pipeline, base de datos, o cockpit del vendedor. Es el "expediente completo" del lead/cliente.

### 5.2 De dónde vienen los datos

| Sección de la ficha | Fuente |
|---------------------|--------|
| Datos generales (nombre, fuente, provincia, etc.) | Tabla `empresas` WHERE `id = :id` |
| Contactos | Tabla `contactos` WHERE `empresa_id = :id` |
| Deals activos | Tabla `deals` WHERE `empresa_id = :id AND resultado IS NULL` |
| Deals cerrados | Tabla `deals` WHERE `empresa_id = :id AND resultado IS NOT NULL` |
| Historial/timeline | Tabla `actividades` WHERE `empresa_id = :id` ORDER BY `created_at DESC` |

### 5.3 Secciones de la ficha

1. **Cabecera:** Nombre empresa, lifecycle badge, vendedor, valor total, fuente.
2. **Datos generales:** Los 15 campos de la empresa en formato label/valor. Editables inline por el vendedor asignado.
3. **Contactos:** Lista de contactos vinculados. Cada uno con nombre, cargo, teléfono, email, badge "Principal". Botón "+ Añadir contacto".
4. **Oportunidades:** Deals activos y cerrados en dos secciones. Cada deal muestra nombre, valor, fase, vendedor. Click navega al deal en el pipeline.
5. **Timeline:** Historial cronológico inverso (más reciente arriba). Cada entrada muestra: icono tipo, texto, usuario, datetime. Inmutable.
6. **Acciones rápidas:** Botones "Registrar llamada", "Añadir nota", "Registrar reunión", "Avanzar fase". Cada uno crea un registro en `actividades` y puede actualizar el deal.

### 5.4 Conexiones con otras pantallas

| Acción en ficha | Efecto |
|-----------------|--------|
| Registrar actividad | Se añade al timeline, actualiza `última_actividad` en BBDD, puede resolver tarea vencida en cockpit |
| Avanzar fase | Mueve el deal en el pipeline, actualiza semáforo, puede disparar notificación |
| Click en deal | Navega al pipeline con ese deal destacado |
| Editar campos | Actualiza tabla `empresas`, se refleja en BBDD y pipeline |

---

## 6. Pantalla: Dashboard de dirección (/dashboard)

### 6.1 Qué es

Panel de control para dirección con 5 KPIs actuales (parte superior) y 4 KPIs históricos (parte inferior). Solo accesible por roles Admin y Dirección.

### 6.2 KPIs actuales (5 tiles superiores)

Cada tile muestra: valor actual, semáforo (verde/ámbar/rojo), variación % vs período anterior, sparkline 30 días, y es clickable para drill-down.

| KPI | Cálculo | Fuente de datos | Semáforo |
|-----|---------|-----------------|----------|
| **Pipeline activo (€)** | `SUM(deals.valor) WHERE resultado IS NULL` | Tabla deals | vs objetivo configurable (A8). Verde ≥80%, Ámbar 60-80%, Rojo <60% |
| **Conversión por etapa (%)** | Para cada par de fases consecutivas: deals que avanzaron / deals que estaban en la fase anterior, en el mes actual | Tabla actividades tipo "cambio_fase" del periodo | Configurable por fase (A7) |
| **Actividad del equipo** | `COUNT(actividades) WHERE tipo IN (llamada, reunion, propuesta) AND created_at >= inicio_periodo` | Tabla actividades | vs mínimo configurable (A8) |
| **Deals en riesgo** | `COUNT(deals) WHERE días_en_fase > fases.tiempo_esperado` + deals con tareas vencidas | Cálculo deals + tareas | Verde 0-2, Ámbar 3-5, Rojo >5 |
| **Top 5 oportunidades** | `SELECT * FROM deals WHERE resultado IS NULL ORDER BY valor DESC LIMIT 5` con JOIN a empresas para nombre, fase, vendedor | Deals + Empresas | Sin semáforo (informativo) |

**Sparkline:** Para cada KPI, guardar un snapshot diario del valor (tabla `kpi_snapshots` con fecha + kpi_tipo + valor). La sparkline son los últimos 30 snapshots.

**Variación:** `(valor_actual - valor_periodo_anterior) / valor_periodo_anterior * 100`. El período de comparación es configurable (A10): mes vs mes, trimestre, año.

### 6.3 Drill-down (un nivel)

Click en cada tile abre panel lateral con detalle:

| KPI | Contenido del drill-down |
|-----|--------------------------|
| Pipeline | Gráfico barras por fase + tabla desglose por vendedor (deals, valor, %) + barra de progreso vs objetivo |
| Conversión | Gráfico funnel + tabla conversión por transición (fase→fase, entran, avanzan, %) + alerta automática si alguna transición está por debajo de la media |
| Actividad | 3 tarjetas resumen (llamadas, reuniones, propuestas) + gráfico stacked por vendedor + evolución diaria 14 días |
| Deals en riesgo | Tarjetas expandidas de cada deal en riesgo con empresa, valor, días estancado, vendedor, última actividad + botón "Notificar" + total valor en riesgo |
| Top 5 | Tabla completa de todos los deals ordenados por valor + gráfico donut distribución por fase |

### 6.4 KPIs históricos (4 tarjetas inferiores)

Sección "Rendimiento histórico" debajo de los 5 tiles. Muestra tendencias de los últimos 6 meses.

| KPI histórico | Cálculo | Tipo gráfico |
|---------------|---------|--------------|
| **Ventas cerradas por mes** | `SUM(deals.valor) WHERE resultado = 'ganado' GROUP BY MONTH(cerrado_en)` últimos 6 meses | Barras (mes actual destacado en verde, anteriores en gris) |
| **Leads nuevos por mes** | `COUNT(empresas) GROUP BY MONTH(created_at)` últimos 6 meses | Línea con puntos + área sombreada |
| **Tiempo medio de cierre (días)** | `AVG(cerrado_en - created_at) FROM deals WHERE resultado = 'ganado' GROUP BY MONTH(cerrado_en)` | Línea (tendencia ascendente = malo, descendente = bueno) |
| **Tasa de conversión global** | `COUNT(deals WHERE ganado) / COUNT(deals WHERE cerrado) * 100 GROUP BY MONTH` + línea horizontal de media del sector como referencia | Línea + línea de referencia discontinua |

Cada tarjeta muestra: título, valor agregado actual (total o media), variación vs semestre anterior, y gráfico.

### 6.5 Conexiones con otras pantallas

| Acción en dashboard | Efecto |
|--------------------|--------|
| Click en deal del drill-down | Navega a `/empresa/:id` |
| Click "Notificar" en deal en riesgo | Envía notificación inmediata al vendedor (M5) |
| KPI cruza umbral rojo | Disparador 3 del motor de notificaciones: alerta al director |
| Datos se actualizan cuando... | Se crea/cierra un deal (pipeline), se registra actividad (ficha/cockpit), se mueve un deal de fase |

---

## 7. Pantalla: Cockpit del vendedor (/mis-tareas)

### 7.1 Qué es

Pantalla de trabajo diario del vendedor. Se divide en: bandeja de tareas (60% izquierda), sidebar con KPIs personales + comisiones + ficha rápida + scripts (40% derecha). Es la landing page al login para el rol Vendedor.

### 7.2 Bandeja de tareas — de dónde vienen

Las tareas provienen de 2 fuentes:

**Tareas automáticas (generadas por M5):**

| Disparador | Crea tarea |
|------------|------------|
| Seguimiento vencido (>24h ADS, >48h no responde) | "Seguimiento vencido: contactar a [empresa]" → prioridad URGENTE |
| Deal estancado (semáforo rojo) | "Deal estancado: [empresa] lleva [X]d en [fase]" → prioridad URGENTE |
| KPI en rojo | No crea tarea al vendedor (notifica a dirección) |

Las tareas automáticas tienen un campo `origen = 'sistema'` y se distinguen visualmente.

**Tareas manuales:**

| Creador | Cómo |
|---------|------|
| El propio vendedor | Desde ficha de empresa o desde la bandeja: "Nueva tarea" |
| Dirección | Desde panel de dirección: asignar tarea a vendedor con fecha y prioridad |

### 7.3 Ordenación de la bandeja

La bandeja se ordena automáticamente por prioridad:

1. **URGENTE (rojo):** Tareas donde `vencida = true` (fecha pasada) O deals con semáforo rojo
2. **ALTA (ámbar):** Tareas con fecha_vencimiento = hoy o mañana
3. **NORMAL (verde):** Tareas con fecha futura

Dentro de cada nivel, se ordena por fecha_vencimiento ASC (las más próximas primero).

### 7.4 Acciones por tarea

| Acción | Efecto técnico |
|--------|----------------|
| **"Hecho"** | Marca tarea como completada. Crea ACTIVIDAD en la empresa vinculada (tipo según la tarea). Actualiza `última_actividad` de la empresa. Si la tarea era un seguimiento vencido, resuelve la alerta. |
| **"Posponer"** | Cambia `fecha_vencimiento` de la tarea a la nueva fecha seleccionada. |
| **Click en tarea** | Muestra mini-ficha del lead en la sidebar (datos clave + última nota) |

### 7.5 Sidebar — Mini dashboard personal

| Métrica | Cálculo |
|---------|---------|
| Pipeline personal (€) | `SUM(deals.valor) WHERE vendedor = yo AND resultado IS NULL` |
| Conversión personal (%) | `COUNT(deals ganados por mí este mes) / COUNT(deals cerrados por mí este mes) * 100` |
| Comisiones acumuladas (€) | `SUM(comisiones) WHERE vendedor = yo AND periodo = actual` |

**Comisiones:** Se calculan automáticamente cuando un deal se cierra como ganado. Fórmula configurable por Admin (regla A16). Se almacenan en tabla `comisiones` con: deal_id, vendedor_id, valor_deal, porcentaje, importe_comision, fecha, periodo.

### 7.6 Sidebar — Repositorio de scripts

Tabla `scripts` con: id, titulo, fase_asociada (FK → Fase, opcional), contenido (texto largo), tags, created_by, created_at.

Se muestran como tarjetas expandibles organizadas por fase. Buscador filtra por título y contenido. Solo Dirección y Admin pueden crear/editar. Vendedores solo lectura.

### 7.7 Sidebar — Ficha rápida del lead

Cuando el vendedor selecciona una tarea, la sidebar muestra los datos del lead sin navegar:

| Dato | Fuente |
|------|--------|
| Nombre contacto principal | `contactos WHERE empresa_id = X AND es_principal = true` |
| Empresa, cargo | Tabla contactos + empresas |
| Teléfono, email | Tabla contactos |
| Provincia, fuente | Tabla empresas |
| Valor deal activo | Tabla deals |
| Fase actual + días | Tabla deals + fases |
| Última nota | `actividades WHERE empresa_id = X ORDER BY created_at DESC LIMIT 1` |

Incluye link "Ver ficha completa →" que navega a `/empresa/:id`.

### 7.8 Conexiones con otras pantallas

| Acción en cockpit | Efecto |
|-------------------|--------|
| Completar tarea | Crea actividad → se refleja en timeline de ficha, puede cambiar semáforo en pipeline |
| "Ver ficha completa" | Navega a `/empresa/:id` |
| Comisión se genera | Cuando un deal se cierra en el pipeline como ganado |
| Tarea automática aparece | Cuando M5 detecta seguimiento vencido o deal estancado |

---

## 8. Pantalla: Base de datos (/empresas, /contactos)

### 8.1 Qué es

Registro histórico completo de todas las empresas y contactos. Dos tabs dentro de la misma pantalla. A diferencia del pipeline (que muestra solo deals activos), la BBDD muestra TODO: empresas contactadas hace meses, clientes activos, leads descartados.

### 8.2 Tab Empresas (/empresas)

**Query base:** `SELECT * FROM empresas ORDER BY updated_at DESC`

| Columna | Fuente | Ordenable | Filtrable |
|---------|--------|-----------|-----------|
| Nombre empresa | empresas.nombre | Sí | Sí (búsqueda texto) |
| Lifecycle stage | empresas.lifecycle_stage | Sí | Sí (enum) |
| Contacto principal | contactos WHERE empresa_id = X AND es_principal = true → nombre | Sí | Sí |
| Teléfono | contacto_principal.telefono | No | Sí (búsqueda) |
| Email | contacto_principal.email | No | Sí (búsqueda) |
| Vendedor | usuarios WHERE id = empresas.vendedor_asignado | Sí | Sí (select) |
| Valor total | SUM(deals.valor WHERE empresa_id = X AND resultado = 'ganado') | Sí | Sí (rango) |
| Deals activos | COUNT(deals WHERE empresa_id = X AND resultado IS NULL) | Sí | Sí |
| Última actividad | MAX(actividades.created_at WHERE empresa_id = X) → fecha relativa | Sí | Sí (rango fecha) |
| Fuente | empresas.fuente_lead | Sí | Sí (enum) |
| Provincia | empresas.provincia | Sí | Sí (select) |
| Fecha creación | empresas.created_at | Sí | Sí (rango fecha) |

**Vistas guardadas predefinidas:**

| Vista | Filtro SQL equivalente |
|-------|----------------------|
| Todas las empresas | Sin filtro |
| Solo mis cuentas | WHERE vendedor_asignado = current_user |
| Clientes activos | WHERE lifecycle_stage = 'cliente' |
| Leads fríos (>7d) | WHERE última_actividad < NOW() - 7 días |
| Ex-clientes | WHERE lifecycle_stage = 'ex-cliente' |

**Vistas personalizadas:** El usuario puede guardar cualquier combinación de filtros + columnas como vista con nombre. Se almacenan en tabla `vistas_guardadas` con: usuario_id, nombre, tab (empresas/contactos), filtros (JSON), columnas (JSON array), compartida (boolean).

### 8.3 Tab Contactos (/contactos)

**Query base:** `SELECT contactos.*, empresas.nombre AS empresa_nombre, empresas.lifecycle_stage FROM contactos JOIN empresas ON contactos.empresa_id = empresas.id ORDER BY contactos.created_at DESC`

| Columna | Fuente | Ordenable | Filtrable |
|---------|--------|-----------|-----------|
| Nombre completo | contactos.nombre_completo | Sí | Sí (búsqueda) |
| Empresa | empresas.nombre (link) | Sí | Sí (búsqueda) |
| Cargo | contactos.cargo | Sí | Sí (búsqueda) |
| Teléfono | contactos.telefono | No | Sí (búsqueda) |
| Email | contactos.email | No | Sí (búsqueda) |
| Principal | contactos.es_principal (badge) | Sí | Sí (boolean) |
| Vendedor | empresas.vendedor_asignado → usuarios | Sí | Sí (select) |
| Última actividad | MAX(actividades.created_at WHERE contacto_id = X o empresa_id = contacto.empresa_id) | Sí | Sí |
| Lifecycle | empresas.lifecycle_stage (heredado) | Sí | Sí (enum) |
| Fecha creación | contactos.created_at | Sí | Sí |

### 8.4 Funcionalidades de ambas tablas

| Feature | Detalle técnico |
|---------|-----------------|
| **Búsqueda global** | Input que filtra en tiempo real. Busca en: nombre empresa/contacto, teléfono, email. Query con ILIKE '%term%' o fulltext search. |
| **Filtros combinables** | Cada columna filtrable tiene un dropdown/input en la cabecera. Múltiples filtros = AND. Se guardan como vista. |
| **Ordenar** | Click en cabecera = toggle ASC/DESC. Aplica ORDER BY sobre toda la tabla, no solo los registros visibles. |
| **Columnas configurables** | Modal "Editar columnas" con checkboxes + drag-and-drop para reordenar. Se persiste por usuario (tabla vistas_guardadas o localStorage). |
| **Exportar CSV** | Botón que exporta la vista actual (con filtros aplicados). Solo los campos visibles. Genera archivo y descarga. |
| **Edición inline** | Click en celda editable → input/select inline. Al guardar → UPDATE en la tabla correspondiente. No todas las celdas son editables: nombre sí, fecha_creación no. |
| **Acciones en bloque** | Checkboxes por fila. Al seleccionar N filas → barra de acciones: reasignar vendedor (UPDATE masivo), cambiar etiqueta, exportar selección. |
| **Scroll infinito** | No paginación clásica. Al acercarse al final del scroll → cargar siguiente batch (20-50 filas). Usar offset/cursor pagination en backend. |
| **Importar CSV** | Botón para carga masiva. Upload de archivo → preview con mapeo de columnas → validación → INSERT batch. Detectar duplicados por email. |

### 8.5 Conexiones con otras pantallas

| Acción en BBDD | Efecto |
|----------------|--------|
| Click en nombre empresa | Navega a `/empresa/:id` (ficha completa) |
| Crear nueva empresa | Crea empresa + contacto + opcionalmente deal → aparece en pipeline |
| Editar lifecycle manualmente | Actualiza badge en BBDD, puede afectar filtros de vistas guardadas |
| Editar vendedor | Reasigna la cuenta, las tareas futuras irán al nuevo vendedor |
| Datos se actualizan cuando... | Se crea/cierra deal (pipeline), se registra actividad (ficha/cockpit), se edita cualquier campo |

---

## 9. Motor de notificaciones (M5 — transversal)

### 9.1 Qué es

No es una pantalla sino un servicio backend que monitoriza condiciones y dispara acciones. Se ejecuta periódicamente (cron cada 5-15 min) o en tiempo real (event-driven cuando se registra una actividad o cambia un deal).

### 9.2 Los 3 disparadores del MVP

**Disparador 1: Seguimiento vencido**

```
CADA 15 minutos:
  PARA CADA empresa WHERE lifecycle_stage IN ('lead', 'contactado'):
    SI fuente = 'ADS' AND última_actividad > 24h → crear tarea URGENTE
    SI última_actividad > 48h (cualquier fuente) → crear tarea URGENTE
  ENVIAR notificación al vendedor_asignado por canal configurado
```

**Disparador 2: Deal estancado**

```
CADA 15 minutos:
  PARA CADA deal WHERE resultado IS NULL:
    dias_en_fase = NOW() - fecha_entrada_fase
    SI dias_en_fase > fases.tiempo_esperado:
      SI no existe tarea_activa para este deal de tipo 'estancado':
        crear tarea URGENTE para vendedor_asignado
        ENVIAR notificación
```

**Disparador 3: KPI en zona roja**

```
CADA hora (o al recalcular KPIs):
  PARA CADA kpi_config WHERE activo = true:
    valor_actual = calcular_kpi(tipo)
    SI valor_actual cruza umbral_rojo AND estado_anterior != 'rojo':
      ENVIAR notificación al destinatario configurado
      REGISTRAR en log de notificaciones
```

### 9.3 Canales

| Canal | Implementación MVP | Notas |
|-------|-------------------|-------|
| Email | Servicio email (SendGrid, AWS SES, o SMTP) | Template HTML con datos del deal/empresa |
| Slack | Webhook HTTP POST al canal configurado | Formato: bloques Slack con botón de acción |
| In-app | Badge/counter en topbar + item en lista de notificaciones | Persiste hasta que el usuario la marca como leída |

### 9.4 Log de notificaciones

Tabla `notificaciones_log`: id, disparador_tipo, empresa_id, deal_id, destinatario_id, canal, estado (enviada/fallida), error_msg, created_at. Inmutable.

---

## 10. Arquitectura de reglas configurables

### 10.1 Reglas configurables por Admin (18)

**Pipeline (6):** A1: Fases (número, nombre, orden). A2: Tiempo esperado por fase. A3: Criterios de entrada por fase. A4: Motivos de pérdida. A5: Múltiples pipelines. A6: Etiquetas, categorías, sectores.

**Dashboard (4):** A7: Umbrales semáforo por KPI. A8: Objetivos/targets por período. A9: Selección de KPIs visibles (v2). A10: Período de comparación.

**Notificaciones (5):** A11: Activar/desactivar disparadores. A12: Tiempos por disparador. A13: Canal por disparador. A14: Destinatario por alerta. A15: Horario de envío.

**Comisiones y campos (3):** A16: Fórmula de comisión. A17: Campos personalizados. A18: Valores de dropdowns.

### 10.2 Reglas configurables por Dirección (4)

D1: Scripts comerciales (CRUD). D2: Crear tareas manuales para vendedores. D3: Reasignar deals. D4: Editar objetivos.

### 10.3 Reglas blindadas del sistema (10)

B1: Historial inmutable (no delete, no update en actividades). B2: Retención 12 meses mínimo. B3: Siempre existe fase inicial y final. B4: Deal perdido requiere motivo. B5: 7 campos base siempre obligatorios. B6: Máximo 5 KPIs en dashboard principal. B7: Semáforo siempre verde/ámbar/rojo. B8: Log de notificaciones siempre activo. B9: Audit trail de cambios de config. B10: Separación de roles inviolable.

---

## 11. Navegación y flujo entre pantallas

```
┌─────────────────────────────────────────────────────────────────┐
│                    Barra de navegación principal                 │
├────────────┬────────────┬────────────┬──────────┬──────────────┤
│  Pipeline  │  Dashboard │ Mis tareas │   BBDD   │    Admin     │
│  /pipeline │ /dashboard │/mis-tareas │/empresas │   /admin     │
│ Dir + Vend │  Dir only  │  Vendedor  │  Todos   │ Admin only   │
└─────┬──────┴──────┬─────┴─────┬──────┴────┬─────┴──────────────┘
      │             │           │           │
      │    ┌────────┘           │           │
      │    │                    │           │
      ▼    ▼                    ▼           ▼
  /empresa/:id            Mini-ficha    /empresa/:id
  (ficha completa)        inline        (ficha completa)
  Accesible desde:        (en sidebar   Accesible desde:
  - Pipeline (click)      del cockpit)  - BBDD (click nombre)
  - BBDD (click nombre)
  - Cockpit (ver ficha)
```

### Flujo de datos entre pantallas

| Evento | Pantallas que se actualizan |
|--------|----------------------------|
| Se crea nuevo lead | Pipeline (nueva tarjeta), BBDD (nueva fila), Dashboard (KPI pipeline) |
| Se registra actividad | Ficha (timeline), BBDD (última actividad), Cockpit (puede resolver tarea), Dashboard (KPI actividad) |
| Deal cambia de fase | Pipeline (tarjeta se mueve), Ficha (timeline), Dashboard (KPI conversión), si semáforo cambia → Cockpit (tarea) |
| Deal se cierra ganado | Pipeline (sale), BBDD (lifecycle → Cliente, valor total +), Dashboard (KPIs + histórico ventas), Cockpit (comisión +) |
| Deal se cierra perdido | Pipeline (sale), BBDD (lifecycle puede cambiar), Dashboard (KPI conversión), Ficha (motivo en timeline) |
| Seguimiento vence | Cockpit (tarea urgente), Pipeline (semáforo ámbar/rojo), Dashboard (KPI4 deals en riesgo) |
| KPI cruza umbral rojo | Dashboard (semáforo rojo), M5 (notificación a dirección) |

---

# PARTE 2: CONTEXTO DEL PROYECTO

---

## 12. Origen del producto

El producto nace de la colaboración entre Flap Consulting y RSR Bridge. Flap propuso un "Commercial Autopilot Essentials" con 4 módulos (CRM + Notificaciones, Dashboard Dirección, Dashboard Vendedor, Inteligencia). RSR (a través de Rebeca Sánchez) envió requisitos detallados con capturas de su proceso actual (basado en Jira + Slack), incluyendo fases de venta retail, campos de ficha de lead, reglas de seguimiento, y un módulo ERP completo.

---

## 13. Análisis Flap vs RSR — Alineamiento

### Lo que coincide (17 requisitos)

Pipeline Kanban, dashboard con 5 KPIs y semáforos, notificaciones automáticas, tarjetas de lead con info clave, ficha de empresa con historial, bandeja de tareas priorizada, indicador de envejecimiento, filtros por vendedor/sector/valor, regla de 24h para clientes ADS, regla de 48h para "no responde", registro rápido de actividad, tendencia + variación + sparkline 30 días, drill-down un nivel, contactos múltiples por empresa, oportunidades activas/cerradas, disparadores automáticos, alertas de oportunidades en riesgo.

### Lo que se adaptó con criterio (6 requisitos)

| Original | Adaptación | Justificación |
|----------|------------|---------------|
| 18+ fases pipeline | 6 fases default + configuración libre por admin | Mercado recomienda 5-8. Con regla A1, RSR configura sus 18+. |
| 8-9 campos obligatorios | 7 campos obligatorios | Cada campo extra reduce adopción (validado por mercado). |
| Notificaciones WhatsApp | Email + Slack | WhatsApp Business API = alta complejidad para MVP. |
| KPIs: Rentabilidad, DSO, Renovación | "Deals en riesgo" como KPI4 | Los otros requieren datos de facturación/ERP no disponibles en MVP. |
| 5 KPIs diagnóstico en ficha | No incluido en MVP | Requiere definir KPIs por tipo de cliente. Fase 2. |
| Integración Jira | Slack webhook | Más estándar y ligero para MVP. |

### Lo que no se incluyó (diferido)

- Módulo ERP completo (E1 SKU, E2 Compras, E3 Contratos) → versión completa
- Chat IA / lenguaje natural → versión completa (necesita datos históricos)
- WhatsApp Business → versión completa (requiere API + aprobación Meta)
- Marketing automation → versión completa
- Lead scoring con IA → versión completa
- Reporting avanzado / BI → versión completa

---

## 14. Investigación de mercado — Hallazgos clave

### Estadísticas

- 50-70% de las implementaciones CRM fallan (Gartner, Forrester)
- Causa #1 de fracaso: baja adopción de usuarios
- Recomendación de mercado: 3-4 módulos core para un MVP

### Must-have probados

Pipeline Kanban con drag-and-drop y aging indicators. Ficha de contacto rica con historial. Dashboard con máximo 5-8 KPIs por vista. Alertas proactivas multicanal. Registro de actividad fácil (máximo 2 clics). Gestión de tareas priorizada. UX simple (curva de aprendizaje mínima).

### Trampas a evitar

Over-customization desde día 1. Big bang implementation (lanzar todo de golpe). Ignorar la perspectiva del vendedor. Demasiados campos obligatorios. Dashboard que no dispara acción.

### Referencia de CRM analizados

Pipedrive (pipeline visual, simplicidad), HubSpot (objetos + lifecycle + pipelines configurables), Salesforce (customización avanzada, leads vs contactos separados). El modelo elegido para Autopilot CRM es HubSpot simplificado: un solo objeto Empresa con lifecycle stage, sin la conversión Lead→Contact de Salesforce.

---

## 15. Requisitos de Rebeca pendientes para fase 2

| Requisito | Prioridad | Detalle |
|-----------|-----------|---------|
| Workflow de facturación | Alta | Enviar acuerdo → firma → solicitar factura vía Slack → adjuntar PDF firmado |
| Gestión documental | Alta | Adjuntar archivos (PDF, imágenes) a deals y fichas de empresa |
| Fase "Solicitar pedido" | Media | Notificación automática al cliente cuando el flujo de venta está completo |
| WhatsApp como canal | Media | Requiere WhatsApp Business API + aprobación Meta |
| 5 KPIs diagnóstico en ficha | Media | KPIs configurables por tipo de cliente dentro de la ficha de empresa |
| Módulo ERP (SKU, stock, compras) | Baja (v. completa) | E1 + E2 + E3 con las 4 reglas de negocio de RSR |
| Chat IA | Baja (v. completa) | Consultas en lenguaje natural sobre el CRM |

---

## 16. Prototipos HTML de referencia

| # | Archivo | Cubre |
|---|---------|-------|
| 1 | `Prototipo_MVP_CRM_Flap_RSR.html` | Pipeline Kanban + Ficha de lead (panel lateral) |
| 2 | `Prototipo_Dashboard_Direccion_CRM.html` | Dashboard con 5 KPIs + 4 históricos + drill-down |
| 3 | `Prototipo_Cockpit_Vendedor_CRM.html` | Bandeja tareas + KPIs personales + comisiones + scripts + ficha rápida |
| 4 | `Prototipo_Base_Datos_CRM.html` | Tabla empresas + tabla contactos con búsqueda, filtros, vistas, exportar |

Los 4 comparten datos ficticios coherentes (11 empresas, 15 contactos, sector retail mascotas/veterinario) y están enlazados por la navegación. Abrir en navegador sin dependencias.

---

## 17. Orden de implementación sugerido

| Fase | Módulo | Razón |
|------|--------|-------|
| 1 | Modelo de datos + BBDD | Es la base. Sin tablas no hay nada. |
| 2 | Ficha empresa (/empresa/:id) | Es la interfaz CRUD del modelo de datos. |
| 3 | Pipeline (/pipeline) | Visualiza los deals sobre el modelo de datos. |
| 4 | Motor notificaciones | Automatiza alertas sobre los datos. |
| 5 | Cockpit vendedor (/mis-tareas) | Consume datos del pipeline + notificaciones. |
| 6 | Dashboard (/dashboard) | Mide todo lo anterior. Necesita datos históricos para tener sentido. |
| 7 | Base de datos (/empresas, /contactos) | Es una vista de tabla sobre datos que ya existen. Se puede hacer en paralelo. |
