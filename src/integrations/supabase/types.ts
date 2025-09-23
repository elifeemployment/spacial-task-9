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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_members: {
        Row: {
          admin_type: string | null
          created_at: string | null
          id: string
          mobile: string
          name: string
          panchayath: string
          role: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          admin_type?: string | null
          created_at?: string | null
          id?: string
          mobile: string
          name: string
          panchayath: string
          role?: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          admin_type?: string | null
          created_at?: string | null
          id?: string
          mobile?: string
          name?: string
          panchayath?: string
          role?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "admin_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coordinators: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          mobile_number: string
          name: string
          panchayath_id: string
          rating: number | null
          updated_at: string | null
          ward: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mobile_number: string
          name: string
          panchayath_id: string
          rating?: number | null
          updated_at?: string | null
          ward: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mobile_number?: string
          name?: string
          panchayath_id?: string
          rating?: number | null
          updated_at?: string | null
          ward?: number
        }
        Relationships: [
          {
            foreignKeyName: "coordinators_panchayath_id_fkey"
            columns: ["panchayath_id"]
            isOneToOne: false
            referencedRelation: "panchayaths"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_notes: {
        Row: {
          activity: string | null
          created_at: string
          date: string
          id: string
          is_leave: boolean
          mobile_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activity?: string | null
          created_at?: string
          date: string
          id?: string
          is_leave?: boolean
          mobile_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activity?: string | null
          created_at?: string
          date?: string
          id?: string
          is_leave?: boolean
          mobile_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      group_leaders: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          mobile_number: string
          name: string
          panchayath_id: string
          supervisor_id: string
          updated_at: string | null
          ward: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mobile_number: string
          name: string
          panchayath_id: string
          supervisor_id: string
          updated_at?: string | null
          ward: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mobile_number?: string
          name?: string
          panchayath_id?: string
          supervisor_id?: string
          updated_at?: string | null
          ward?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_leaders_panchayath_id_fkey"
            columns: ["panchayath_id"]
            isOneToOne: false
            referencedRelation: "panchayaths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_leaders_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisors"
            referencedColumns: ["id"]
          },
        ]
      }
      officers: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          mobile_number: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mobile_number: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          mobile_number?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      panchayaths: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          number_of_wards: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          number_of_wards: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          number_of_wards?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panchayaths_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
        ]
      }
      pros: {
        Row: {
          created_at: string | null
          created_by: string | null
          group_leader_id: string
          id: string
          mobile_number: string
          name: string
          panchayath_id: string
          updated_at: string | null
          ward: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          group_leader_id: string
          id?: string
          mobile_number: string
          name: string
          panchayath_id: string
          updated_at?: string | null
          ward: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          group_leader_id?: string
          id?: string
          mobile_number?: string
          name?: string
          panchayath_id?: string
          updated_at?: string | null
          ward?: number
        }
        Relationships: [
          {
            foreignKeyName: "pros_group_leader_id_fkey"
            columns: ["group_leader_id"]
            isOneToOne: false
            referencedRelation: "group_leaders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pros_panchayath_id_fkey"
            columns: ["panchayath_id"]
            isOneToOne: false
            referencedRelation: "panchayaths"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string | null
          id: string
          name: string
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      supervisor_wards: {
        Row: {
          id: string
          supervisor_id: string
          ward: number
        }
        Insert: {
          id?: string
          supervisor_id: string
          ward: number
        }
        Update: {
          id?: string
          supervisor_id?: string
          ward?: number
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_wards_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisors"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisors: {
        Row: {
          coordinator_id: string
          created_at: string | null
          created_by: string | null
          id: string
          mobile_number: string
          name: string
          panchayath_id: string
          updated_at: string | null
        }
        Insert: {
          coordinator_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          mobile_number: string
          name: string
          panchayath_id: string
          updated_at?: string | null
        }
        Update: {
          coordinator_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          mobile_number?: string
          name?: string
          panchayath_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisors_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisors_panchayath_id_fkey"
            columns: ["panchayath_id"]
            isOneToOne: false
            referencedRelation: "panchayaths"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonial_questions: {
        Row: {
          created_at: string
          display_order: number | null
          id: number
          is_active: boolean | null
          question: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          question: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonial_responses: {
        Row: {
          agent_id: string | null
          agent_type: string | null
          created_at: string
          id: number
          panchayath_id: string | null
          question_id: number | null
          respondent_contact: string | null
          respondent_name: string | null
          response: string
          score: number | null
        }
        Insert: {
          agent_id?: string | null
          agent_type?: string | null
          created_at?: string
          id?: number
          panchayath_id?: string | null
          question_id?: number | null
          respondent_contact?: string | null
          respondent_name?: string | null
          response: string
          score?: number | null
        }
        Update: {
          agent_id?: string | null
          agent_type?: string | null
          created_at?: string
          id?: number
          panchayath_id?: string | null
          question_id?: number | null
          respondent_contact?: string | null
          respondent_name?: string | null
          response?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_responses_panchayath_id_fkey"
            columns: ["panchayath_id"]
            isOneToOne: false
            referencedRelation: "panchayaths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonial_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "testimonial_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          finished_at: string | null
          id: string
          reassigned_to_coordinator: string | null
          reassigned_to_supervisor: string | null
          remarks: string | null
          status: string
          text: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          finished_at?: string | null
          id?: string
          reassigned_to_coordinator?: string | null
          reassigned_to_supervisor?: string | null
          remarks?: string | null
          status?: string
          text: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          finished_at?: string | null
          id?: string
          reassigned_to_coordinator?: string | null
          reassigned_to_supervisor?: string | null
          remarks?: string | null
          status?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_reassigned_to_coordinator_fkey"
            columns: ["reassigned_to_coordinator"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_reassigned_to_supervisor_fkey"
            columns: ["reassigned_to_supervisor"]
            isOneToOne: false
            referencedRelation: "supervisors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      hierarchy_view: {
        Row: {
          coordinator_mobile: string | null
          coordinator_name: string | null
          coordinator_rating: number | null
          coordinator_ward: number | null
          group_leader_mobile: string | null
          group_leader_name: string | null
          group_leader_ward: number | null
          number_of_wards: number | null
          panchayath_name: string | null
          pro_mobile: string | null
          pro_name: string | null
          pro_ward: number | null
          supervisor_mobile: string | null
          supervisor_name: string | null
          supervisor_wards: number[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_agent_by_mobile: {
        Args: { mobile_num: string }
        Returns: {
          agent_id: string
          agent_name: string
          agent_type: string
          panchayath_id: string
        }[]
      }
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
