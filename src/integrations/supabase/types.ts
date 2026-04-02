export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      agent_knowledge: {
        Row: {
          agent_id: string | null;
          created_at: string;
          id: string;
          knowledge_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string;
          id?: string;
          knowledge_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string;
          id?: string;
          knowledge_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_knowledge_id_fkey";
            columns: ["knowledge_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_documents";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_training_examples: {
        Row: {
          agent_id: string;
          ai_response: string;
          corrected_response: string;
          created_at: string;
          id: string;
          is_processed: boolean;
          user_id: string;
          user_message: string;
        };
        Insert: {
          agent_id: string;
          ai_response: string;
          corrected_response: string;
          created_at?: string;
          id?: string;
          is_processed?: boolean;
          user_id: string;
          user_message: string;
        };
        Update: {
          agent_id?: string;
          ai_response?: string;
          corrected_response?: string;
          created_at?: string;
          id?: string;
          is_processed?: boolean;
          user_id?: string;
          user_message?: string;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          background_denoising_enabled: boolean | null;
          background_sound:
            | Database["public"]["Enums"]["background_sound_enum"]
            | null;
          call_timing: Json | null;
          created_at: string | null;
          elevenlabs_agent_id: string | null;
          end_call_message: string | null;
          end_call_phrases: string[] | null;
          first_message: string | null;
          first_message_mode:
            | Database["public"]["Enums"]["first_message_mode_enum"]
            | null;
          flow: Json | null;
          humor_level: number | null;
          id: string;
          interaction_type: string[] | null;
          is_active: boolean | null;
          knowledge_ids: string[] | null;
          language: string | null;
          last_trained_at: string | null;
          max_duration_seconds: number | null;
          maxDurationSeconds: number | null;
          mermaid_chart: string | null;
          model_config: Json | null;
          name: string;
          objective: string | null;
          primary_phone_number_id: string | null;
          role: Database["public"]["Enums"]["agent_role"] | null;
          silence_timeout_message: string | null;
          speaking_behavior: Json | null;
          training_examples: Json | null;
          training_status:
            | Database["public"]["Enums"]["training_status_enum"]
            | null;
          training_webhook_url: string | null;
          transcriber_config: Json | null;
          trieve_dataset_id: string | null;
          updated_at: string | null;
          user_id: string | null;
          v_agent_id: string | null;
          vapi_file_ids: string[] | null;
          vapi_knowledge_base_id: string | null;
          voice_config: Json | null;
          voice_id: string | null;
          workspace_id: string | null;
        };
        Insert: {
          background_denoising_enabled?: boolean | null;
          background_sound?:
            | Database["public"]["Enums"]["background_sound_enum"]
            | null;
          call_timing?: Json | null;
          created_at?: string | null;
          elevenlabs_agent_id?: string | null;
          end_call_message?: string | null;
          end_call_phrases?: string[] | null;
          first_message?: string | null;
          first_message_mode?:
            | Database["public"]["Enums"]["first_message_mode_enum"]
            | null;
          flow?: Json | null;
          humor_level?: number | null;
          id?: string;
          interaction_type?: string[] | null;
          is_active?: boolean | null;
          knowledge_ids?: string[] | null;
          language?: string | null;
          last_trained_at?: string | null;
          max_duration_seconds?: number | null;
          maxDurationSeconds?: number | null;
          mermaid_chart?: string | null;
          model_config?: Json | null;
          name: string;
          objective?: string | null;
          primary_phone_number_id?: string | null;
          role?: Database["public"]["Enums"]["agent_role"] | null;
          silence_timeout_message?: string | null;
          speaking_behavior?: Json | null;
          training_examples?: Json | null;
          training_status?:
            | Database["public"]["Enums"]["training_status_enum"]
            | null;
          training_webhook_url?: string | null;
          transcriber_config?: Json | null;
          trieve_dataset_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          v_agent_id?: string | null;
          vapi_file_ids?: string[] | null;
          vapi_knowledge_base_id?: string | null;
          voice_config?: Json | null;
          voice_id?: string | null;
          workspace_id?: string | null;
        };
        Update: {
          background_denoising_enabled?: boolean | null;
          background_sound?:
            | Database["public"]["Enums"]["background_sound_enum"]
            | null;
          call_timing?: Json | null;
          created_at?: string | null;
          elevenlabs_agent_id?: string | null;
          end_call_message?: string | null;
          end_call_phrases?: string[] | null;
          first_message?: string | null;
          first_message_mode?:
            | Database["public"]["Enums"]["first_message_mode_enum"]
            | null;
          flow?: Json | null;
          humor_level?: number | null;
          id?: string;
          interaction_type?: string[] | null;
          is_active?: boolean | null;
          knowledge_ids?: string[] | null;
          language?: string | null;
          last_trained_at?: string | null;
          max_duration_seconds?: number | null;
          maxDurationSeconds?: number | null;
          mermaid_chart?: string | null;
          model_config?: Json | null;
          name?: string;
          objective?: string | null;
          primary_phone_number_id?: string | null;
          role?: Database["public"]["Enums"]["agent_role"] | null;
          silence_timeout_message?: string | null;
          speaking_behavior?: Json | null;
          training_examples?: Json | null;
          training_status?:
            | Database["public"]["Enums"]["training_status_enum"]
            | null;
          training_webhook_url?: string | null;
          transcriber_config?: Json | null;
          trieve_dataset_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          v_agent_id?: string | null;
          vapi_file_ids?: string[] | null;
          vapi_knowledge_base_id?: string | null;
          voice_config?: Json | null;
          voice_id?: string | null;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agents_primary_phone_number_id_fkey";
            columns: ["primary_phone_number_id"];
            isOneToOne: false;
            referencedRelation: "phone_numbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agents_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_documents: {
        Row: {
          created_at: string;
          description: string | null;
          file_path: string;
          file_size: number;
          file_type: string;
          id: string;
          title: string;
          trieve_dataset_id: string | null;
          updated_at: string;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          file_path: string;
          file_size: number;
          file_type: string;
          id?: string;
          title: string;
          trieve_dataset_id?: string | null;
          updated_at?: string;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          file_path?: string;
          file_size?: number;
          file_type?: string;
          id?: string;
          title?: string;
          trieve_dataset_id?: string | null;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [];
      };
      lead_activities: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          lead_id: string;
          new_value: string | null;
          old_value: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          lead_id: string;
          new_value?: string | null;
          old_value?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          lead_id?: string;
          new_value?: string | null;
          old_value?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_notes: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          lead_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          lead_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          lead_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_tags: {
        Row: {
          created_at: string;
          lead_id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          lead_id: string;
          tag_id: string;
        };
        Update: {
          created_at?: string;
          lead_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_variables: {
        Row: {
          created_at: string;
          id: string;
          lead_id: string;
          name: string;
          updated_at: string;
          value: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          lead_id: string;
          name: string;
          updated_at?: string;
          value?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          lead_id?: string;
          name?: string;
          updated_at?: string;
          value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_variables_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          pipeline_id: string | null;
          status: string | null;
          updated_at: string;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          pipeline_id?: string | null;
          status?: string | null;
          updated_at?: string;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          pipeline_id?: string | null;
          status?: string | null;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "pipelines";
            referencedColumns: ["id"];
          },
        ];
      };
      phone_numbers: {
        Row: {
          area_code: string | null;
          capabilities: Json | null;
          country_code: string | null;
          created_at: string | null;
          friendly_name: string | null;
          id: string;
          inbound_agent_id: string | null;
          monthly_cost: number | null;
          outbound_agent_id: string | null;
          status: string | null;
          twilio_phone_number: string;
          twilio_sid: string;
          updated_at: string | null;
          vapi_phone_number_id: string | null;
          workspace_id: string;
        };
        Insert: {
          area_code?: string | null;
          capabilities?: Json | null;
          country_code?: string | null;
          created_at?: string | null;
          friendly_name?: string | null;
          id?: string;
          inbound_agent_id?: string | null;
          monthly_cost?: number | null;
          outbound_agent_id?: string | null;
          status?: string | null;
          twilio_phone_number: string;
          twilio_sid: string;
          updated_at?: string | null;
          vapi_phone_number_id?: string | null;
          workspace_id: string;
        };
        Update: {
          area_code?: string | null;
          capabilities?: Json | null;
          country_code?: string | null;
          created_at?: string | null;
          friendly_name?: string | null;
          id?: string;
          inbound_agent_id?: string | null;
          monthly_cost?: number | null;
          outbound_agent_id?: string | null;
          status?: string | null;
          twilio_phone_number?: string;
          twilio_sid?: string;
          updated_at?: string | null;
          vapi_phone_number_id?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "phone_numbers_inbound_agent_id_fkey";
            columns: ["inbound_agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "phone_numbers_outbound_agent_id_fkey";
            columns: ["outbound_agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "phone_numbers_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      pipelines: {
        Row: {
          columns: Json;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          columns?: Json;
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          columns?: Json;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          business_type: string | null;
          created_at: string;
          current_workspace_id: string | null;
          email: string | null;
          employee_count: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          onboarding_completed: boolean | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          business_type?: string | null;
          created_at?: string;
          current_workspace_id?: string | null;
          email?: string | null;
          employee_count?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          onboarding_completed?: boolean | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          business_type?: string | null;
          created_at?: string;
          current_workspace_id?: string | null;
          email?: string | null;
          employee_count?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          onboarding_completed?: boolean | null;
          username?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          color: Database["public"]["Enums"]["tag_color"] | null;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          color?: Database["public"]["Enums"]["tag_color"] | null;
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          color?: Database["public"]["Enums"]["tag_color"] | null;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [];
      };
      voice_previews: {
        Row: {
          created_at: string | null;
          id: string;
          preview_url: string;
          updated_at: string | null;
          voice_id: string;
          voice_name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          preview_url: string;
          updated_at?: string | null;
          voice_id: string;
          voice_name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          preview_url?: string;
          updated_at?: string | null;
          voice_id?: string;
          voice_name?: string;
        };
        Relationships: [];
      };
      workspace_integrations: {
        Row: {
          id: string;
          workspace_id: string;
          provider: string;
          account_sid: string | null;
          auth_token: string | null;
          is_connected: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          provider?: string;
          account_sid?: string | null;
          auth_token?: string | null;
          is_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          provider?: string;
          account_sid?: string | null;
          auth_token?: string | null;
          is_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_integrations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          created_at: string;
          role: string;
          updated_at: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          role?: string;
          updated_at?: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          role?: string;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_member: {
        Args: { workspace_id: string; user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      activity_type:
        | "note"
        | "status_change"
        | "contact_update"
        | "name_update"
        | "variable_add";
      agent_role:
        | "receptionist"
        | "sales_agent"
        | "customer_support"
        | "technical_advisor"
        | "appointment_scheduler"
        | "product_specialist"
        | "virtual_assistant";
      background_sound_enum: "off" | "office" | "cafe" | "nature";
      first_message_mode_enum: "assistant-speaks-first" | "user-speaks-first";
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost";
      tag_color:
        | "gray"
        | "red"
        | "yellow"
        | "green"
        | "blue"
        | "purple"
        | "pink";
      training_status_enum: "not_started" | "in_progress" | "completed";
      workspace_role: "owner" | "admin" | "member";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

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
      background_sound_enum: ["off", "office", "cafe", "nature"],
      first_message_mode_enum: ["assistant-speaks-first", "user-speaks-first"],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      tag_color: ["gray", "red", "yellow", "green", "blue", "purple", "pink"],
      training_status_enum: ["not_started", "in_progress", "completed"],
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const;
