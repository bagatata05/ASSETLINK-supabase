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
      assets: {
        Row: {
          asset_code: string
          category: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          school_id: string | null
          school_name: string | null
          updated_at: string | null
        }
        Insert: {
          asset_code: string
          category?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          school_id?: string | null
          school_name?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_code?: string
          category?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          school_id?: string | null
          school_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tasks: {
        Row: {
          asset_code: string | null
          asset_name: string | null
          assigned_to_email: string | null
          assigned_to_name: string | null
          completed_at: string | null
          completion_photo_url: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          maintenance_notes: string | null
          photo_url: string | null
          priority: string | null
          repair_request_id: string | null
          reported_by_name: string | null
          request_number: string | null
          scheduled_start_date: string | null
          school_name: string | null
          sla_deadline: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          asset_code?: string | null
          asset_name?: string | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          completion_photo_url?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_notes?: string | null
          photo_url?: string | null
          priority?: string | null
          repair_request_id?: string | null
          reported_by_name?: string | null
          request_number?: string | null
          scheduled_start_date?: string | null
          school_name?: string | null
          sla_deadline?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_code?: string | null
          asset_name?: string | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          completion_photo_url?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_notes?: string | null
          photo_url?: string | null
          priority?: string | null
          repair_request_id?: string | null
          reported_by_name?: string | null
          request_number?: string | null
          scheduled_start_date?: string | null
          school_name?: string | null
          sla_deadline?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          employee_id: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          role: string | null
          room_no: string | null
          room_number: string | null
          school_id: string | null
          school_name: string | null
          specialization: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          role?: string | null
          room_no?: string | null
          room_number?: string | null
          school_id?: string | null
          school_name?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: string | null
          room_no?: string | null
          room_number?: string | null
          school_id?: string | null
          school_name?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      repair_requests: {
        Row: {
          actual_cost: number | null
          approved_at: string | null
          approved_by_name: string | null
          asset_code: string | null
          asset_id: string | null
          asset_name: string | null
          assigned_to_email: string | null
          assigned_to_name: string | null
          completed_at: string | null
          completion_photo: string | null
          created_at: string | null
          description: string | null
          id: string
          maintenance_notes: string | null
          materials_used: string | null
          photo_url: string | null
          principal_notes: string | null
          priority: string | null
          reported_by_email: string | null
          reported_by_name: string | null
          request_number: string | null
          scheduled_start_date: string | null
          school_id: string | null
          school_name: string | null
          sla_deadline: string | null
          status: string | null
          teacher_confirmation: boolean | null
          teacher_verification_notes: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          approved_at?: string | null
          approved_by_name?: string | null
          asset_code?: string | null
          asset_id?: string | null
          asset_name?: string | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          completion_photo?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_notes?: string | null
          materials_used?: string | null
          photo_url?: string | null
          principal_notes?: string | null
          priority?: string | null
          reported_by_email?: string | null
          reported_by_name?: string | null
          request_number?: string | null
          scheduled_start_date?: string | null
          school_id?: string | null
          school_name?: string | null
          sla_deadline?: string | null
          status?: string | null
          teacher_confirmation?: boolean | null
          teacher_verification_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          approved_at?: string | null
          approved_by_name?: string | null
          asset_code?: string | null
          asset_id?: string | null
          asset_name?: string | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          completion_photo?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_notes?: string | null
          materials_used?: string | null
          photo_url?: string | null
          principal_notes?: string | null
          priority?: string | null
          reported_by_email?: string | null
          reported_by_name?: string | null
          request_number?: string | null
          scheduled_start_date?: string | null
          school_id?: string | null
          school_name?: string | null
          sla_deadline?: string | null
          status?: string | null
          teacher_confirmation?: boolean | null
          teacher_verification_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_requests_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          division: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          division?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          division?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
