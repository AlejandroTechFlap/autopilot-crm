export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      actividades: {
        Row: {
          contacto_id: string | null
          contenido: string | null
          created_at: string
          deal_id: string | null
          empresa_id: string
          id: string
          tipo: Database["public"]["Enums"]["tipo_actividad"]
          usuario_id: string
        }
        Insert: {
          contacto_id?: string | null
          contenido?: string | null
          created_at?: string
          deal_id?: string | null
          empresa_id: string
          id?: string
          tipo: Database["public"]["Enums"]["tipo_actividad"]
          usuario_id: string
        }
        Update: {
          contacto_id?: string | null
          contenido?: string | null
          created_at?: string
          deal_id?: string | null
          empresa_id?: string
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_actividad"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividades_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings_diarios: {
        Row: {
          contenido: string
          fecha: string
          generated_at: string
          user_id: string
        }
        Insert: {
          contenido: string
          fecha: string
          generated_at?: string
          user_id: string
        }
        Update: {
          contenido?: string
          fecha?: string
          generated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_diarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      campos_personalizados: {
        Row: {
          clave: string
          created_at: string
          entidad: Database["public"]["Enums"]["entidad_personalizable"]
          etiqueta: string
          id: string
          obligatorio: boolean
          opciones: Json | null
          orden: number
          tipo: Database["public"]["Enums"]["tipo_campo_personalizado"]
        }
        Insert: {
          clave: string
          created_at?: string
          entidad: Database["public"]["Enums"]["entidad_personalizable"]
          etiqueta: string
          id?: string
          obligatorio?: boolean
          opciones?: Json | null
          orden?: number
          tipo: Database["public"]["Enums"]["tipo_campo_personalizado"]
        }
        Update: {
          clave?: string
          created_at?: string
          entidad?: Database["public"]["Enums"]["entidad_personalizable"]
          etiqueta?: string
          id?: string
          obligatorio?: boolean
          opciones?: Json | null
          orden?: number
          tipo?: Database["public"]["Enums"]["tipo_campo_personalizado"]
        }
        Relationships: []
      }
      comisiones: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          importe_comision: number
          periodo: string | null
          porcentaje: number
          valor_deal: number
          vendedor_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          importe_comision: number
          periodo?: string | null
          porcentaje?: number
          valor_deal: number
          vendedor_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          importe_comision?: number
          periodo?: string | null
          porcentaje?: number
          valor_deal?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comisiones_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comisiones_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_tenant: {
        Row: {
          color_acento: string
          color_primario: string
          direccion: string | null
          email_contacto: string | null
          feat_admin_kpis: boolean
          feat_admin_scripts: boolean
          feat_ai_chat: boolean
          feat_command_palette: boolean
          feat_dashboard_historico: boolean
          feat_empresa_task_cal: boolean
          feat_morning_summary: boolean
          feat_notifications: boolean
          id: string
          logo_url: string | null
          nombre_empresa: string
          telefono: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color_acento?: string
          color_primario?: string
          direccion?: string | null
          email_contacto?: string | null
          feat_admin_kpis?: boolean
          feat_admin_scripts?: boolean
          feat_ai_chat?: boolean
          feat_command_palette?: boolean
          feat_dashboard_historico?: boolean
          feat_empresa_task_cal?: boolean
          feat_morning_summary?: boolean
          feat_notifications?: boolean
          id?: string
          logo_url?: string | null
          nombre_empresa?: string
          telefono?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color_acento?: string
          color_primario?: string
          direccion?: string | null
          email_contacto?: string | null
          feat_admin_kpis?: boolean
          feat_admin_scripts?: boolean
          feat_ai_chat?: boolean
          feat_command_palette?: boolean
          feat_dashboard_historico?: boolean
          feat_empresa_task_cal?: boolean
          feat_morning_summary?: boolean
          feat_notifications?: boolean
          id?: string
          logo_url?: string | null
          nombre_empresa?: string
          telefono?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_tenant_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos: {
        Row: {
          campos_personalizados: Json
          cargo: string | null
          created_at: string
          email: string | null
          empresa_id: string
          es_principal: boolean
          id: string
          nombre_completo: string
          telefono: string | null
        }
        Insert: {
          campos_personalizados?: Json
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          es_principal?: boolean
          id?: string
          nombre_completo: string
          telefono?: string | null
        }
        Update: {
          campos_personalizados?: Json
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          es_principal?: boolean
          id?: string
          nombre_completo?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contactos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          campos_personalizados: Json
          cerrado_en: string | null
          created_at: string
          empresa_id: string
          fase_actual: string
          fecha_entrada_fase: string
          id: string
          motivo_perdida: string | null
          pipeline_id: string
          resultado: Database["public"]["Enums"]["resultado_deal"] | null
          valor: number
          vendedor_asignado: string
        }
        Insert: {
          campos_personalizados?: Json
          cerrado_en?: string | null
          created_at?: string
          empresa_id: string
          fase_actual: string
          fecha_entrada_fase?: string
          id?: string
          motivo_perdida?: string | null
          pipeline_id: string
          resultado?: Database["public"]["Enums"]["resultado_deal"] | null
          valor?: number
          vendedor_asignado: string
        }
        Update: {
          campos_personalizados?: Json
          cerrado_en?: string | null
          created_at?: string
          empresa_id?: string
          fase_actual?: string
          fecha_entrada_fase?: string
          id?: string
          motivo_perdida?: string | null
          pipeline_id?: string
          resultado?: Database["public"]["Enums"]["resultado_deal"] | null
          valor?: number
          vendedor_asignado?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_fase_actual_fkey"
            columns: ["fase_actual"]
            isOneToOne: false
            referencedRelation: "fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_vendedor_asignado_fkey"
            columns: ["vendedor_asignado"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          campos_personalizados: Json
          categoria: Database["public"]["Enums"]["categoria_empresa"] | null
          created_at: string
          descripcion: string | null
          etiquetas: string[] | null
          fuente_lead: Database["public"]["Enums"]["fuente_lead"]
          id: string
          informador: string | null
          lifecycle_stage: Database["public"]["Enums"]["lifecycle_stage"]
          nombre: string
          notas_internas: string | null
          prioridad: Database["public"]["Enums"]["prioridad"] | null
          provincia: string | null
          proxima_accion: string | null
          proxima_accion_fecha: string | null
          updated_at: string
          vendedor_asignado: string
        }
        Insert: {
          campos_personalizados?: Json
          categoria?: Database["public"]["Enums"]["categoria_empresa"] | null
          created_at?: string
          descripcion?: string | null
          etiquetas?: string[] | null
          fuente_lead?: Database["public"]["Enums"]["fuente_lead"]
          id?: string
          informador?: string | null
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          nombre: string
          notas_internas?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad"] | null
          provincia?: string | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          updated_at?: string
          vendedor_asignado: string
        }
        Update: {
          campos_personalizados?: Json
          categoria?: Database["public"]["Enums"]["categoria_empresa"] | null
          created_at?: string
          descripcion?: string | null
          etiquetas?: string[] | null
          fuente_lead?: Database["public"]["Enums"]["fuente_lead"]
          id?: string
          informador?: string | null
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          nombre?: string
          notas_internas?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad"] | null
          provincia?: string | null
          proxima_accion?: string | null
          proxima_accion_fecha?: string | null
          updated_at?: string
          vendedor_asignado?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_vendedor_asignado_fkey"
            columns: ["vendedor_asignado"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      fases: {
        Row: {
          created_at: string
          criterios_entrada: Json | null
          id: string
          nombre: string
          orden: number
          pipeline_id: string
          tiempo_esperado: number | null
        }
        Insert: {
          created_at?: string
          criterios_entrada?: Json | null
          id?: string
          nombre: string
          orden: number
          pipeline_id: string
          tiempo_esperado?: number | null
        }
        Update: {
          created_at?: string
          criterios_entrada?: Json | null
          id?: string
          nombre?: string
          orden?: number
          pipeline_id?: string
          tiempo_esperado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fases_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_config: {
        Row: {
          id: string
          objetivo: number | null
          periodo: string | null
          tipo: string
          umbral_ambar: number | null
          umbral_verde: number | null
        }
        Insert: {
          id?: string
          objetivo?: number | null
          periodo?: string | null
          tipo: string
          umbral_ambar?: number | null
          umbral_verde?: number | null
        }
        Update: {
          id?: string
          objetivo?: number | null
          periodo?: string | null
          tipo?: string
          umbral_ambar?: number | null
          umbral_verde?: number | null
        }
        Relationships: []
      }
      kpi_snapshots: {
        Row: {
          fecha: string
          id: string
          kpi_tipo: string
          valor: number
        }
        Insert: {
          fecha?: string
          id?: string
          kpi_tipo: string
          valor: number
        }
        Update: {
          fecha?: string
          id?: string
          kpi_tipo?: string
          valor?: number
        }
        Relationships: []
      }
      notificacion_config: {
        Row: {
          activo: boolean
          canal: Database["public"]["Enums"]["canal_notificacion"]
          destinatario_id: string | null
          disparador_tipo: string
          horario_fin: string | null
          horario_inicio: string | null
          id: string
          umbral_horas: number | null
        }
        Insert: {
          activo?: boolean
          canal?: Database["public"]["Enums"]["canal_notificacion"]
          destinatario_id?: string | null
          disparador_tipo: string
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          umbral_horas?: number | null
        }
        Update: {
          activo?: boolean
          canal?: Database["public"]["Enums"]["canal_notificacion"]
          destinatario_id?: string | null
          disparador_tipo?: string
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          umbral_horas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacion_config_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          contenido: string | null
          created_at: string
          id: string
          leido: boolean
          referencia_id: string | null
          tipo: string | null
          titulo: string
          usuario_id: string
        }
        Insert: {
          contenido?: string | null
          created_at?: string
          id?: string
          leido?: boolean
          referencia_id?: string | null
          tipo?: string | null
          titulo: string
          usuario_id: string
        }
        Update: {
          contenido?: string | null
          created_at?: string
          id?: string
          leido?: boolean
          referencia_id?: string | null
          tipo?: string | null
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones_log: {
        Row: {
          canal: Database["public"]["Enums"]["canal_notificacion"]
          created_at: string
          deal_id: string | null
          destinatario_id: string | null
          disparador_tipo: string
          empresa_id: string | null
          error_msg: string | null
          estado: Database["public"]["Enums"]["estado_notificacion"]
          id: string
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal_notificacion"]
          created_at?: string
          deal_id?: string | null
          destinatario_id?: string | null
          disparador_tipo: string
          empresa_id?: string | null
          error_msg?: string | null
          estado?: Database["public"]["Enums"]["estado_notificacion"]
          id?: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_notificacion"]
          created_at?: string
          deal_id?: string | null
          destinatario_id?: string | null
          disparador_tipo?: string
          empresa_id?: string | null
          error_msg?: string | null
          estado?: Database["public"]["Enums"]["estado_notificacion"]
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_log_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_log_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          contenido: string
          created_at: string
          created_by: string
          fase_asociada: string | null
          id: string
          tags: string[] | null
          titulo: string
        }
        Insert: {
          contenido: string
          created_at?: string
          created_by: string
          fase_asociada?: string | null
          id?: string
          tags?: string[] | null
          titulo: string
        }
        Update: {
          contenido?: string
          created_at?: string
          created_by?: string
          fase_asociada?: string | null
          id?: string
          tags?: string[] | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_fase_asociada_fkey"
            columns: ["fase_asociada"]
            isOneToOne: false
            referencedRelation: "fases"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          completada: boolean
          created_at: string
          deal_id: string | null
          descripcion: string | null
          empresa_id: string | null
          fecha_vencimiento: string | null
          id: string
          origen: Database["public"]["Enums"]["origen_tarea"]
          prioridad: Database["public"]["Enums"]["prioridad"]
          tipo_tarea: string | null
          titulo: string
          updated_at: string
          vendedor_asignado: string
        }
        Insert: {
          completada?: boolean
          created_at?: string
          deal_id?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          fecha_vencimiento?: string | null
          id?: string
          origen?: Database["public"]["Enums"]["origen_tarea"]
          prioridad?: Database["public"]["Enums"]["prioridad"]
          tipo_tarea?: string | null
          titulo: string
          updated_at?: string
          vendedor_asignado: string
        }
        Update: {
          completada?: boolean
          created_at?: string
          deal_id?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          fecha_vencimiento?: string | null
          id?: string
          origen?: Database["public"]["Enums"]["origen_tarea"]
          prioridad?: Database["public"]["Enums"]["prioridad"]
          tipo_tarea?: string | null
          titulo?: string
          updated_at?: string
          vendedor_asignado?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_vendedor_asignado_fkey"
            columns: ["vendedor_asignado"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: []
      }
      vistas_guardadas: {
        Row: {
          columnas: Json | null
          compartida: boolean
          created_at: string
          filtros: Json | null
          id: string
          nombre: string
          tab: string
          usuario_id: string
        }
        Insert: {
          columnas?: Json | null
          compartida?: boolean
          created_at?: string
          filtros?: Json | null
          id?: string
          nombre: string
          tab: string
          usuario_id: string
        }
        Update: {
          columnas?: Json | null
          compartida?: boolean
          created_at?: string
          filtros?: Json | null
          id?: string
          nombre?: string
          tab?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vistas_guardadas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      delete_campo_personalizado: {
        Args: { p_id: string }
        Returns: number
      }
    }
    Enums: {
      canal_notificacion: "in_app" | "email" | "slack"
      categoria_empresa:
        | "mascotas"
        | "veterinaria"
        | "agro"
        | "retail"
        | "servicios"
        | "otro"
      entidad_personalizable: "empresa" | "contacto" | "deal"
      estado_notificacion: "enviada" | "fallida" | "pendiente"
      fuente_lead:
        | "ads"
        | "organico"
        | "referido"
        | "bbdd"
        | "feria"
        | "cold_call"
        | "otro"
      lifecycle_stage:
        | "lead"
        | "contactado"
        | "en_negociacion"
        | "cliente"
        | "ex_cliente"
        | "no_interesa"
      origen_tarea: "manual" | "sistema"
      prioridad: "alta" | "media" | "baja"
      resultado_deal: "ganado" | "perdido"
      rol_usuario: "admin" | "direccion" | "vendedor"
      tipo_actividad: "llamada" | "nota" | "reunion" | "cambio_fase" | "sistema"
      tipo_campo_personalizado:
        | "texto"
        | "numero"
        | "seleccion"
        | "fecha"
        | "booleano"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      canal_notificacion: ["in_app", "email", "slack"],
      categoria_empresa: [
        "mascotas",
        "veterinaria",
        "agro",
        "retail",
        "servicios",
        "otro",
      ],
      entidad_personalizable: ["empresa", "contacto", "deal"],
      estado_notificacion: ["enviada", "fallida", "pendiente"],
      fuente_lead: [
        "ads",
        "organico",
        "referido",
        "bbdd",
        "feria",
        "cold_call",
        "otro",
      ],
      lifecycle_stage: [
        "lead",
        "contactado",
        "en_negociacion",
        "cliente",
        "ex_cliente",
        "no_interesa",
      ],
      origen_tarea: ["manual", "sistema"],
      prioridad: ["alta", "media", "baja"],
      resultado_deal: ["ganado", "perdido"],
      rol_usuario: ["admin", "direccion", "vendedor"],
      tipo_actividad: ["llamada", "nota", "reunion", "cambio_fase", "sistema"],
      tipo_campo_personalizado: [
        "texto",
        "numero",
        "seleccion",
        "fecha",
        "booleano",
      ],
    },
  },
} as const
