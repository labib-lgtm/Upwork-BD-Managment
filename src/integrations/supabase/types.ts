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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      bd_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          bd_profile_id: string | null
          closes_target: number | null
          created_at: string | null
          fiscal_year: number
          id: string
          month: number
          proposal_target: number | null
          revenue_target: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bd_profile_id?: string | null
          closes_target?: number | null
          created_at?: string | null
          fiscal_year: number
          id?: string
          month: number
          proposal_target?: number | null
          revenue_target?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bd_profile_id?: string | null
          closes_target?: number | null
          created_at?: string | null
          fiscal_year?: number
          id?: string
          month?: number
          proposal_target?: number | null
          revenue_target?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_bd_profile_id_fkey"
            columns: ["bd_profile_id"]
            isOneToOne: false
            referencedRelation: "bd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      proposals: {
        Row: {
          boosted: boolean | null
          boosted_connects: number
          budget: number | null
          client_country: string | null
          client_hire_count: number | null
          client_rating: number | null
          client_reviews: number | null
          client_total_spent: number | null
          competition_bucket: string | null
          connects_used: number | null
          created_at: string
          created_by: string | null
          date_submitted: string | null
          deal_value: number | null
          id: string
          interviewing_at_submission: number | null
          invite_sent: number | null
          is_new_client: boolean
          job_link: string | null
          job_title: string
          job_type: string
          last_viewed_text: string | null
          loss_reason: string | null
          notes: string | null
          payment_status: string
          profile_name: string
          proposed_amount: number | null
          refund_amount: number | null
          returned_connects: number
          status: string
          updated_at: string
          updated_by: string | null
          user_id: string
          video_sent: boolean | null
          win_factor: string | null
        }
        Insert: {
          boosted?: boolean | null
          boosted_connects?: number
          budget?: number | null
          client_country?: string | null
          client_hire_count?: number | null
          client_rating?: number | null
          client_reviews?: number | null
          client_total_spent?: number | null
          competition_bucket?: string | null
          connects_used?: number | null
          created_at?: string
          created_by?: string | null
          date_submitted?: string | null
          deal_value?: number | null
          id?: string
          interviewing_at_submission?: number | null
          invite_sent?: number | null
          is_new_client?: boolean
          job_link?: string | null
          job_title: string
          job_type?: string
          last_viewed_text?: string | null
          loss_reason?: string | null
          notes?: string | null
          payment_status?: string
          profile_name: string
          proposed_amount?: number | null
          refund_amount?: number | null
          returned_connects?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
          video_sent?: boolean | null
          win_factor?: string | null
        }
        Update: {
          boosted?: boolean | null
          boosted_connects?: number
          budget?: number | null
          client_country?: string | null
          client_hire_count?: number | null
          client_rating?: number | null
          client_reviews?: number | null
          client_total_spent?: number | null
          competition_bucket?: string | null
          connects_used?: number | null
          created_at?: string
          created_by?: string | null
          date_submitted?: string | null
          deal_value?: number | null
          id?: string
          interviewing_at_submission?: number | null
          invite_sent?: number | null
          is_new_client?: boolean
          job_link?: string | null
          job_title?: string
          job_type?: string
          last_viewed_text?: string | null
          loss_reason?: string | null
          notes?: string | null
          payment_status?: string
          profile_name?: string
          proposed_amount?: number | null
          refund_amount?: number | null
          returned_connects?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          video_sent?: boolean | null
          win_factor?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          has_access: boolean
          id: string
          role: string
          tab_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          has_access?: boolean
          id?: string
          role: string
          tab_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          has_access?: boolean
          id?: string
          role?: string
          tab_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      user_profile_access: {
        Row: {
          bd_profile_id: string
          created_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          bd_profile_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          bd_profile_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_access_bd_profile_id_fkey"
            columns: ["bd_profile_id"]
            isOneToOne: false
            referencedRelation: "bd_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_accessible_profile_names: {
        Args: { _user_id: string }
        Returns: string[]
      }
      has_profile_access: {
        Args: { _bd_profile_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      redeem_invitation: {
        Args: { _token: string; _user_id: string }
        Returns: boolean
      }
      validate_invitation: {
        Args: { _token: string }
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string
          used_by: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "bd_member"
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
      app_role: ["admin", "manager", "bd_member"],
    },
  },
} as const
