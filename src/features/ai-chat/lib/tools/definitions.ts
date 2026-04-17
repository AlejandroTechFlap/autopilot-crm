/**
 * Gemini function declarations for every AI tool.
 *
 * These describe the tools to the model so it knows when and how to invoke
 * them. Descriptions are written in Spanish because all model output is
 * Spanish — keeping prompts and tool docs in the same language tends to
 * produce more consistent tool selection.
 *
 * The actual tool implementations live alongside this file (one file per
 * domain) and are dispatched in `./index.ts`.
 */

import { Type, type FunctionDeclaration } from '@google/genai';

const LIFECYCLE_VALUES = [
  'lead',
  'contactado',
  'en_negociacion',
  'cliente',
  'ex_cliente',
  'no_interesa',
];
const PRIORIDAD_VALUES = ['alta', 'media', 'baja'];
const ACTIVIDAD_VALUES = ['llamada', 'nota', 'reunion', 'cambio_fase', 'sistema'];

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'search_empresas',
    description:
      'Busca empresas (clientes y leads) por nombre, etapa del ciclo, vendedor asignado o prioridad. Usa fuzzy search — tolera typos y coincidencias parciales. Prefiere esta herramienta antes de responder cualquier pregunta sobre empresas concretas.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Nombre o parte del nombre de la empresa. Tolera typos.',
        },
        lifecycle_stage: {
          type: Type.STRING,
          enum: LIFECYCLE_VALUES,
          description: 'Filtra por etapa del ciclo de vida.',
        },
        vendedor_id: {
          type: Type.STRING,
          description: 'UUID del vendedor asignado.',
        },
        prioridad: {
          type: Type.STRING,
          enum: PRIORIDAD_VALUES,
          description: 'Filtra por prioridad de la cuenta.',
        },
        sin_vendedor: {
          type: Type.BOOLEAN,
          description: 'Si true, devuelve solo empresas sin vendedor asignado.',
        },
        limit: {
          type: Type.INTEGER,
          description: 'Máximo de resultados (1-20). Por defecto 10.',
        },
      },
    },
  },
  {
    name: 'get_empresa',
    description:
      'Devuelve el detalle completo de una empresa por su UUID, junto con sus contactos, deals abiertos y últimas actividades. Usa esta herramienta cuando el usuario pida un análisis profundo de una cuenta concreta.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'UUID de la empresa.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_deals',
    description:
      'Busca oportunidades (deals). Filtros: query (nombre de empresa), fase, resultado (open/ganado/perdido), vendedor, valor mínimo, días estancado en la fase. Útil para "deals en riesgo", "negocios estancados", "mi mejor deal", etc.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Parte del nombre de la empresa.' },
        fase_id: { type: Type.STRING, description: 'UUID de la fase del embudo.' },
        pipeline_id: { type: Type.STRING, description: 'UUID del embudo.' },
        resultado: {
          type: Type.STRING,
          enum: ['open', 'ganado', 'perdido'],
          description:
            '"open" para deals abiertos (resultado null), "ganado" o "perdido" para cerrados.',
        },
        vendedor_id: { type: Type.STRING, description: 'UUID del vendedor asignado.' },
        empresa_id: { type: Type.STRING, description: 'UUID de la empresa.' },
        valor_min: {
          type: Type.NUMBER,
          description: 'Valor mínimo del deal en €.',
        },
        estancados_dias: {
          type: Type.INTEGER,
          description:
            'Si se indica, solo deals abiertos cuya fecha_entrada_fase es anterior a hoy − N días.',
        },
        limit: { type: Type.INTEGER, description: 'Máximo de resultados (1-20).' },
      },
    },
  },
  {
    name: 'get_deal',
    description:
      'Devuelve el detalle completo de un deal por UUID, incluyendo empresa, vendedor, fase actual y últimas 10 actividades.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'UUID del deal.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_contactos',
    description:
      'Busca contactos por nombre o email. Soporta fuzzy match. Útil para "encuentra el contacto principal de X" o "qué contactos tengo en Y empresa".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Nombre o email parcial.' },
        empresa_id: { type: Type.STRING, description: 'UUID de la empresa.' },
        es_principal: {
          type: Type.BOOLEAN,
          description: 'Filtra solo contactos marcados como principales.',
        },
        limit: { type: Type.INTEGER, description: 'Máximo de resultados (1-20).' },
      },
    },
  },
  {
    name: 'search_tareas',
    description:
      'Busca tareas. Filtros: query (título), completada, vencidas_only, vendedor, empresa, deal, prioridad. Imprescindible para responder "qué tengo pendiente", "qué tareas vencidas tiene Rebeca", etc.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Parte del título de la tarea.' },
        completada: {
          type: Type.BOOLEAN,
          description: 'true = completadas, false = pendientes.',
        },
        vencidas_only: {
          type: Type.BOOLEAN,
          description: 'Si true, solo tareas no completadas con fecha pasada.',
        },
        vendedor_id: { type: Type.STRING, description: 'UUID del vendedor asignado.' },
        empresa_id: { type: Type.STRING, description: 'UUID de la empresa.' },
        deal_id: { type: Type.STRING, description: 'UUID del deal.' },
        prioridad: { type: Type.STRING, enum: PRIORIDAD_VALUES },
        limit: { type: Type.INTEGER, description: 'Máximo de resultados (1-20).' },
      },
    },
  },
  {
    name: 'search_scripts',
    description:
      'Busca scripts de venta por título, fase asociada o tag. Devuelve metadatos + extracto de 500 chars. Para el contenido completo usa get_script.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Parte del título del script.' },
        fase_id: { type: Type.STRING, description: 'UUID de la fase asociada.' },
        tag: { type: Type.STRING, description: 'Etiqueta exacta a filtrar.' },
        limit: { type: Type.INTEGER, description: 'Máximo de resultados (1-20).' },
      },
    },
  },
  {
    name: 'get_script',
    description:
      'Devuelve el contenido completo de un script por UUID (capado a 5000 caracteres). Úsalo después de search_scripts cuando el usuario pida el guion entero.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'UUID del script.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_actividades',
    description:
      'Devuelve el log de actividades (llamadas, notas, reuniones, cambios de fase, eventos del sistema) filtrado por empresa, deal, contacto, usuario, tipo o fecha.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        empresa_id: { type: Type.STRING },
        deal_id: { type: Type.STRING },
        contacto_id: { type: Type.STRING },
        usuario_id: { type: Type.STRING },
        tipo: {
          type: Type.STRING,
          enum: ACTIVIDAD_VALUES,
          description: 'Tipo de actividad.',
        },
        since: {
          type: Type.STRING,
          description: 'Fecha ISO desde la cual buscar (created_at >= since).',
        },
        limit: { type: Type.INTEGER, description: 'Máximo de resultados (1-20).' },
      },
    },
  },
  {
    name: 'get_kpis_vendedor',
    description:
      'Devuelve los KPIs personales de un vendedor: embudo, tareas pendientes/vencidas, actividades de hoy, deals ganados del mes, comisión del mes. Sin parámetros, devuelve los del usuario actual.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        vendedor_id: {
          type: Type.STRING,
          description: 'UUID del vendedor. Por defecto, el usuario actual.',
        },
      },
    },
  },
  {
    name: 'get_kpis_direccion',
    description:
      'Devuelve KPIs del equipo entero (solo para dirección/admin): embudo total, deals abiertos, ganados/perdidos del periodo, tasa de conversión, ticket medio, actividades, tareas vencidas, y desglose por vendedor.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        periodo: {
          type: Type.STRING,
          enum: ['7d', 'month', 'quarter'],
          description:
            'Ventana temporal: 7d (últimos 7 días), month (mes en curso), quarter (trimestre en curso). Por defecto month.',
        },
      },
    },
  },
  {
    name: 'get_pipelines_fases',
    description:
      'Lista todos los pipelines y sus fases (id, nombre, orden, tiempo_esperado). Úsalo cuando necesites mapear un nombre de fase mencionado por el usuario (ej. "negociación") a un fase_id real para llamar a otras herramientas.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },

  // -- Phase 11: AI Analytics tools ------------------------------------------

  {
    name: 'query_database',
    description:
      'Ejecuta una consulta SQL SELECT contra la base de datos del CRM. Úsala para consultas analíticas: agregaciones (COUNT, SUM, AVG, GROUP BY), tendencias temporales, comparaciones entre vendedores, etc. La consulta se ejecuta con los permisos del usuario (RLS) — un vendedor solo verá sus propios datos. REGLAS: (1) Solo SELECT, nunca INSERT/UPDATE/DELETE. (2) Usa las tablas y columnas del esquema que conoces. (3) Siempre incluye alias legibles. (4) Después de obtener datos, usa render_chart o render_table para visualizarlos.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        sql: {
          type: Type.STRING,
          description:
            'Consulta SELECT válida. Ejemplos: "SELECT fase_actual, COUNT(*) as total FROM deals WHERE resultado IS NULL GROUP BY fase_actual", "SELECT DATE_TRUNC(\'month\', cerrado_en) as mes, SUM(valor) as total FROM deals WHERE resultado = \'ganado\' GROUP BY 1 ORDER BY 1".',
        },
        title: {
          type: Type.STRING,
          description:
            'Etiqueta corta para la cita de datos, ej. "Deals por fase", "Ventas mensuales".',
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'render_chart',
    description:
      'Renderiza un gráfico interactivo en el chat. Llama a esta herramienta DESPUÉS de obtener datos con query_database u otra herramienta. Tipos: bar (comparar categorías), line (tendencias temporales), area (volumen temporal), pie (composición/proporción). Los datos deben ser un array de {label, value}. Para series múltiples, incluye el campo "series".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['bar', 'line', 'area', 'pie'],
          description: 'Tipo de gráfico.',
        },
        title: {
          type: Type.STRING,
          description: 'Título del gráfico (ej. "Deals por fase").',
        },
        data: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: 'Etiqueta del eje X o categoría.' },
              value: { type: Type.NUMBER, description: 'Valor numérico.' },
              series: { type: Type.STRING, description: 'Nombre de la serie (opcional, para gráficos multi-serie).' },
            },
            required: ['label', 'value'],
          },
          description: 'Datos del gráfico.',
        },
        xLabel: { type: Type.STRING, description: 'Etiqueta del eje X (opcional).' },
        yLabel: { type: Type.STRING, description: 'Etiqueta del eje Y (opcional).' },
      },
      required: ['type', 'title', 'data'],
    },
  },
  {
    name: 'render_table',
    description:
      'Renderiza una tabla de datos formateada en el chat. Llama a esta herramienta DESPUÉS de obtener datos con query_database. Útil cuando los datos tienen muchas columnas o el usuario pide una vista tabular.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Título de la tabla.',
        },
        columns: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING, description: 'Nombre de la columna en los datos.' },
              label: { type: Type.STRING, description: 'Etiqueta visible de la columna.' },
            },
            required: ['key', 'label'],
          },
          description: 'Definición de columnas.',
        },
        rows: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: {} },
          description: 'Filas de datos (array de objetos con claves que coinciden con columns[].key).',
        },
      },
      required: ['title', 'columns', 'rows'],
    },
  },
];
