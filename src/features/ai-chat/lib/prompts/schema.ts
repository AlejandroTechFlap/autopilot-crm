/**
 * Compact, human-readable summary of the AutopilotCRM data model. Embedded
 * in every role-specific system prompt so the model knows what tables exist,
 * what columns matter, and which tool to call to read them.
 *
 * Optimized for AI consumption (not for humans browsing docs): each table
 * lists the fields the assistant is most likely to use, the relevant
 * RLS/visibility note, and the tool that exposes it. This is intentionally
 * shorter than the generated `database.ts` types — the model doesn't need
 * every nullable timestamp.
 */

export const DB_SCHEMA_SUMMARY = `
## Modelo de datos AutopilotCRM (resumen para el asistente)

Cuando necesites datos concretos sobre cualquier registro, NUNCA inventes
valores. Llama a la herramienta indicada en cada tabla. Las RLS de Supabase
ya filtran lo que el usuario puede leer; un vendedor solo verá su propia
cartera incluso si pides ver más.

### empresas — cuentas (leads y clientes)
  Campos clave:
    id, nombre, lifecycle_stage, prioridad, vendedor_asignado,
    proxima_accion, proxima_accion_fecha, fuente_lead, categoria,
    provincia, notas_internas, etiquetas
  Enums:
    lifecycle_stage: lead | contactado | en_negociacion | cliente |
                     ex_cliente | no_interesa
    prioridad: alta | media | baja
    fuente_lead: ads | organico | referido | bbdd | feria | cold_call | otro
    categoria: mascotas | veterinaria | agro | retail | servicios | otro
  RLS: vendedor solo ve empresas con vendedor_asignado = self
  Herramientas: search_empresas (lista filtrable), get_empresa (detalle
  con contactos + deals abiertos + actividades recientes)

### deals — oportunidades comerciales
  Campos clave:
    id, empresa_id, fase_actual, pipeline_id, valor, vendedor_asignado,
    fecha_entrada_fase, resultado, motivo_perdida, cerrado_en
  resultado: null = abierto, "ganado", "perdido"
  RLS: vendedor solo ve deals con vendedor_asignado = self
  Herramientas: search_deals (filtros: query, fase, resultado, vendedor,
  valor_min, estancados_dias), get_deal (detalle + actividades)

### contactos — personas dentro de las empresas
  Campos clave: id, empresa_id, nombre_completo, email, telefono, cargo,
                es_principal
  RLS: hereda visibilidad de la empresa relacionada
  Herramienta: search_contactos

### tareas — to-dos del vendedor
  Campos clave: id, titulo, descripcion, prioridad, fecha_vencimiento,
                completada, tipo_tarea, vendedor_asignado, deal_id,
                empresa_id, origen
  origen: manual | sistema (las del sistema vienen de reglas de
          notificación o cambios automáticos de fase)
  RLS: vendedor solo ve sus propias tareas
  Herramienta: search_tareas (filtros: query, completada, vencidas_only,
  vendedor, empresa, deal, prioridad)

### scripts — guiones de venta
  Campos clave: id, titulo, contenido, tags, fase_asociada
  Visibilidad: lectura para todos
  Herramientas: search_scripts (devuelve metadatos + extracto de 500
  chars), get_script (contenido completo capado a 5000 chars)

### actividades — log inmutable del CRM
  Campos clave: id, tipo, contenido, empresa_id, deal_id, contacto_id,
                usuario_id, created_at
  tipo: llamada | nota | reunion | cambio_fase | sistema
  RLS: filtrada por la empresa/deal asociados
  Herramienta: get_actividades

### pipelines + fases
  pipelines(id, nombre)
  fases(id, nombre, orden, pipeline_id, tiempo_esperado, criterios_entrada)
  Herramienta: get_pipelines_fases — úsala para mapear el nombre de una
  fase ("negociación", "propuesta") a un fase_id concreto antes de
  llamar a search_deals o search_scripts con fase_id.

### usuarios — vendedores, dirección, admins
  Campos: id, nombre, email, rol, avatar_url
  rol: vendedor | direccion | admin
  Visibilidad: todos pueden listar nombres + roles (necesario para el
  cockpit). NO existe una herramienta dedicada list_users — los nombres
  llegan embebidos en los resultados de otras herramientas (vendedor,
  por_vendedor, etc.).

### comisiones — cálculo mensual de comisiones por vendedor
  Campos: deal_id, vendedor_id, importe_comision, periodo (YYYY-MM),
          porcentaje, valor_deal
  Acceso a través de get_kpis_vendedor (ya las suma del periodo en curso).

### KPIs (vista derivada, no tabla)
  Herramientas:
    get_kpis_vendedor — datos personales del vendedor (embudo, tareas,
      actividades de hoy, ganados del mes, comisión)
    get_kpis_direccion — datos del equipo (embudo total, conversión,
      desglose por vendedor) — SOLO dirección/admin

### Herramientas analíticas (query_database + visualización)

Para preguntas analíticas (agregaciones, tendencias, comparaciones, rankings)
que no se resuelven con las herramientas de búsqueda:

  Herramienta: query_database
    Input: { sql: "SELECT ...", title?: "etiqueta corta" }
    Solo SELECT. No INSERT/UPDATE/DELETE/DDL.
    Se ejecuta con los permisos del usuario (RLS). Límite: 200 filas, 5s.
    Tablas disponibles: empresas, deals, contactos, tareas, scripts,
    actividades, pipelines, fases, usuarios, comisiones, campos_personalizados,
    valores_campos_personalizados, reglas_notificacion, umbrales_kpi, tenant_config
    Esquema: consulta pg_catalog si necesitas confirmar nombres de columna.

  Flujo recomendado:
    1. query_database para obtener datos
    2. render_chart o render_table para presentarlos visualmente

  Herramienta: render_chart
    Input: { type: "bar"|"line"|"area"|"pie", title, data: [{label,value},...], xLabel?, yLabel? }
    Criterio de selección:
      bar   → comparar categorías (ej. deals por fase, vendedores)
      line  → tendencias temporales (ej. ventas por mes)
      area  → volumen acumulado en el tiempo
      pie   → composición / proporción (ej. % por fuente de lead)

  Herramienta: render_table
    Input: { title, columns: [{key,label},...], rows: [{...},...] }
    Úsala cuando los datos tienen muchas columnas o el usuario pide una tabla.

  Reglas de visualización:
    - Siempre llama primero a query_database y DESPUÉS render_chart o render_table
    - Si los datos tienen ≤ 6 categorías y 1 valor, usa un gráfico
    - Si los datos tienen muchas columnas, usa una tabla
    - Títulos y etiquetas en español, breves
    - Puedes combinar texto + gráfico + tabla en la misma respuesta

## Reglas inquebrantables
1. Antes de afirmar cualquier dato concreto (nombre de empresa, cifra,
   estado de un deal, contenido de un script), LLAMA A LA HERRAMIENTA
   adecuada. No inventes UUIDs ni números.
2. Si una herramienta devuelve { error: "..." } o no encuentra nada,
   díselo al usuario honestamente y propón la siguiente acción razonable
   (ej. "no encuentro 'Coca Col' — ¿quieres que busque por categoría?").
3. Respeta los límites: cada llamada acepta limit ≤ 20. Si necesitas más,
   primero filtra mejor.
4. Si el usuario menciona una fase del embudo por nombre, llama a
   get_pipelines_fases primero para resolver el id antes de filtrar.
5. Para preguntas analíticas, usa query_database + render_chart/render_table.
   Nunca construyas tablas manualmente con markdown cuando puedes usar
   render_table — el resultado es más limpio e interactivo.
`.trim();
