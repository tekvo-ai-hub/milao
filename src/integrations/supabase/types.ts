export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      speech_recordings: {
        Row: {
          analysis_data: Json | null
          audio_url: string | null
          clarity_score: number | null
          created_at: string
          duration: number
          filler_words_count: number | null
          id: string
          overall_score: number | null
          pace: number | null
          primary_tone: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          audio_url?: string | null
          clarity_score?: number | null
          created_at?: string
          duration: number
          filler_words_count?: number | null
          id?: string
          overall_score?: number | null
          pace?: number | null
          primary_tone?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          audio_url?: string | null
          clarity_score?: number | null
          created_at?: string
          duration?: number
          filler_words_count?: number | null
          id?: string
          overall_score?: number | null
          pace?: number | null
          primary_tone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accent_challenges: string[] | null
          age: number | null
          confidence_level: string | null
          created_at: string
          display_name: string | null
          feedback_style: string | null
          fluency_level: string | null
          gamification_enabled: boolean | null
          id: string
          learning_style: string | null
          location: string | null
          native_language: string | null
          practice_frequency: string | null
          preferred_format: string | null
          recording_consent: boolean | null
          reminders_enabled: boolean | null
          role_models: string | null
          scenario: string | null
          speaking_goal: string | null
          target_audience: string | null
          tone_preference: string | null
          updated_at: string
          user_id: string
          vocabulary_level: string | null
        }
        Insert: {
          accent_challenges?: string[] | null
          age?: number | null
          confidence_level?: string | null
          created_at?: string
          display_name?: string | null
          feedback_style?: string | null
          fluency_level?: string | null
          gamification_enabled?: boolean | null
          id?: string
          learning_style?: string | null
          location?: string | null
          native_language?: string | null
          practice_frequency?: string | null
          preferred_format?: string | null
          recording_consent?: boolean | null
          reminders_enabled?: boolean | null
          role_models?: string | null
          scenario?: string | null
          speaking_goal?: string | null
          target_audience?: string | null
          tone_preference?: string | null
          updated_at?: string
          user_id: string
          vocabulary_level?: string | null
        }
        Update: {
          accent_challenges?: string[] | null
          age?: number | null
          confidence_level?: string | null
          created_at?: string
          display_name?: string | null
          feedback_style?: string | null
          fluency_level?: string | null
          gamification_enabled?: boolean | null
          id?: string
          learning_style?: string | null
          location?: string | null
          native_language?: string | null
          practice_frequency?: string | null
          preferred_format?: string | null
          recording_consent?: boolean | null
          reminders_enabled?: boolean | null
          role_models?: string | null
          scenario?: string | null
          speaking_goal?: string | null
          target_audience?: string | null
          tone_preference?: string | null
          updated_at?: string
          user_id?: string
          vocabulary_level?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          account_status: string
          id: string
          notes: string | null
          recording_enabled: boolean
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          account_status?: string
          id?: string
          notes?: string | null
          recording_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          account_status?: string
          id?: string
          notes?: string | null
          recording_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          active_users_today: number
          total_recordings: number
          total_recording_duration: number
        }[]
      }
      get_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          display_name: string
          created_at: string
          last_login: string
          login_count: number
          recording_count: number
          total_recording_duration: number
          recording_enabled: boolean
          account_status: string
          notes: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_activity_type: string
          p_activity_data?: Json
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
