-- ============================================
-- Autopilot CRM — Migration 001
-- Enums and usuarios table
-- ============================================

-- Custom types (enums)
CREATE TYPE rol_usuario AS ENUM ('admin', 'direccion', 'vendedor');
CREATE TYPE lifecycle_stage AS ENUM ('lead', 'contactado', 'en_negociacion', 'cliente', 'ex_cliente', 'no_interesa');
CREATE TYPE fuente_lead AS ENUM ('ads', 'organico', 'referido', 'bbdd', 'feria', 'cold_call', 'otro');
CREATE TYPE prioridad AS ENUM ('alta', 'media', 'baja');
CREATE TYPE tipo_actividad AS ENUM ('llamada', 'nota', 'reunion', 'cambio_fase', 'sistema');
CREATE TYPE resultado_deal AS ENUM ('ganado', 'perdido');
CREATE TYPE categoria_empresa AS ENUM ('mascotas', 'veterinaria', 'agro', 'retail', 'servicios', 'otro');
CREATE TYPE origen_tarea AS ENUM ('manual', 'sistema');
CREATE TYPE canal_notificacion AS ENUM ('in_app', 'email', 'slack');
CREATE TYPE estado_notificacion AS ENUM ('enviada', 'fallida', 'pendiente');

-- Usuarios table (extends auth.users)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol rol_usuario NOT NULL DEFAULT 'vendedor',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE usuarios IS 'CRM user profiles linked to Supabase Auth';
