export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_knowledge: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          knowledge_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          knowledge_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          knowledge_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_knowledge_knowledge_id_fkey"
            columns: ["knowledge_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_training_examples: {
        Row: {
          agent_id: string
          ai_response: string
          corrected_response: string
          created_at: string
          id: string
          is_processed: boolean
          user_id: string
          user_message: string
        }
        Insert: {
          agent_id: string
          ai_response: string
          corrected_response: string
          created_at?: string
          id?: string
          is_processed?: boolean
          user_id: string
          user_message: string
        }
        Update: {
          agent_id?: string
          ai_response?: string
          corrected_response?: string
          created_at?: string
          id?: string
          is_processed?: boolean
          user_id?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_training_examples_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          creation_mode: string | null
          elevenlabs_agent_id: string | null
          flow: Json | null
          humor_level: number | null
          id: string
          interaction_type: string[]
          is_active: boolean | null
          knowledge_ids: string[] | null
          knowledgeBaseId: string | null
          language: string | null
          mermaid_chart: string | null
          name: string
          objective: string
          role: Database["public"]["Enums"]["agent_role"]
          user_id: string
          v_agent_id: string | null
          voice_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          creation_mode?: string | null
          elevenlabs_agent_id?: string | null
          flow?: Json | null
          humor_level?: number | null
          id?: string
          interaction_type?: string[]
          is_active?: boolean | null
          knowledge_ids?: string[] | null
          knowledgeBaseId?: string | null
          language?: string | null
          mermaid_chart?: string | null
          name: string
          objective: string
          role: Database["public"]["Enums"]["agent_role"]
          user_id: string
          v_agent_id?: string | null
          voice_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          creation_mode?: string | null
          elevenlabs_agent_id?: string | null
          flow?: Json | null
          humor_level?: number | null
          id?: string
          interaction_type?: string[]
          is_active?: boolean | null
          knowledge_ids?: string[] | null
          knowledgeBaseId?: string | null
          language?: string | null
          mermaid_chart?: string | null
          name?: string
          objective?: string
          role?: Database["public"]["Enums"]["agent_role"]
          user_id?: string
          v_agent_id?: string | null
          voice_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          created_at: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_variables: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          name: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          name: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          name?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_variables_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          pipeline_id: string | null
          status: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          pipeline_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          pipeline_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          columns: Json
          created_at: string
          id: string
          name: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          columns?: Json
          created_at?: string
          id?: string
          name: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          columns?: Json
          created_at?: string
          id?: string
          name?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_type: string | null
          created_at: string
          current_workspace_id: string | null
          email: string | null
          employee_count: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string
          current_workspace_id?: string | null
          email?: string | null
          employee_count?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string
          current_workspace_id?: string | null
          email?: string | null
          employee_count?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_workspace_id_fkey"
            columns: ["current_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: Database["public"]["Enums"]["tag_color"] | null
          created_at: string
          id: string
          name: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          color?: Database["public"]["Enums"]["tag_color"] | null
          created_at?: string
          id?: string
          name: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          color?: Database["public"]["Enums"]["tag_color"] | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_previews: {
        Row: {
          created_at: string | null
          id: string
          preview_url: string
          updated_at: string | null
          voice_id: string
          voice_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preview_url: string
          updated_at?: string | null
          voice_id: string
          voice_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preview_url?: string
          updated_at?: string | null
          voice_id?: string
          voice_name?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_workspace_member: {
        Args: { workspace_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "note"
        | "status_change"
        | "contact_update"
        | "name_update"
        | "variable_add"
      agent_role:
        | "receptionist"
        | "sales_agent"
        | "customer_support"
        | "technical_advisor"
        | "appointment_scheduler"
        | "product_specialist"
        | "virtual_assistant"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      tag_color:
        | "gray"
        | "red"
        | "yellow"
        | "green"
        | "blue"
        | "purple"
        | "pink"
      workspace_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "note",
        "status_change",
        "contact_update",
        "name_update",
        "variable_add",
      ],
      agent_role: [
        "receptionist",
        "sales_agent",
        "customer_support",
        "technical_advisor",
        "appointment_scheduler",
        "product_specialist",
        "virtual_assistant",
      ],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      tag_color: ["gray", "red", "yellow", "green", "blue", "purple", "pink"],
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const
