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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ad_impressions: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          placement: string
          revenue: number
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          placement?: string
          revenue?: number
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          placement?: string
          revenue?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          active: boolean | null
          company_name: string
          cost_per_impression: number | null
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string | null
          headline: string
          id: string
          media_type: string
          media_url: string
          target_interests: string[] | null
        }
        Insert: {
          active?: boolean | null
          company_name: string
          cost_per_impression?: number | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          headline: string
          id?: string
          media_type?: string
          media_url: string
          target_interests?: string[] | null
        }
        Update: {
          active?: boolean | null
          company_name?: string
          cost_per_impression?: number | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          headline?: string
          id?: string
          media_type?: string
          media_url?: string
          target_interests?: string[] | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          word?: string
        }
        Relationships: []
      }
      felts: {
        Row: {
          created_at: string
          id: string
          signal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "felts_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      interest_searches: {
        Row: {
          created_at: string
          id: string
          search_count: number
          term: string
        }
        Insert: {
          created_at?: string
          id?: string
          search_count?: number
          term: string
        }
        Update: {
          created_at?: string
          id?: string
          search_count?: number
          term?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          read: boolean
          signal_id: string | null
          type: string
          user_id: string
          word: string | null
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          read?: boolean
          signal_id?: string | null
          type?: string
          user_id: string
          word?: string | null
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          read?: boolean
          signal_id?: string | null
          type?: string
          user_id?: string
          word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio_word: string | null
          created_at: string
          display_name: string
          id: string
          interests: string[] | null
          phone: string | null
          qr_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio_word?: string | null
          created_at?: string
          display_name?: string
          id?: string
          interests?: string[] | null
          phone?: string | null
          qr_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio_word?: string | null
          created_at?: string
          display_name?: string
          id?: string
          interests?: string[] | null
          phone?: string | null
          qr_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signal_owner_views: {
        Row: {
          created_at: string
          id: string
          signal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_owner_views_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_views: {
        Row: {
          created_at: string
          id: string
          signal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_views_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          song_clip_url: string | null
          song_title: string | null
          stitch_word: string | null
          storage_path: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          song_clip_url?: string | null
          song_title?: string | null
          stitch_word?: string | null
          storage_path?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          song_clip_url?: string | null
          song_title?: string | null
          stitch_word?: string | null
          storage_path?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      stitches: {
        Row: {
          created_at: string
          id: string
          signal_id: string
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_id: string
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_id?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "stitches_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_aura_ranked_following: {
        Args: { p_user_id: string }
        Returns: {
          aura_score: number
          following_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
