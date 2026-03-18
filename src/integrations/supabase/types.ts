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
      advertiser_leads: {
        Row: {
          budget_range: string
          company_name: string
          contact_email: string
          created_at: string
          id: string
          message: string | null
          status: string
          website: string | null
        }
        Insert: {
          budget_range?: string
          company_name: string
          contact_email: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          website?: string | null
        }
        Update: {
          budget_range?: string
          company_name?: string
          contact_email?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          website?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      creator_payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          status: string
          stripe_transfer_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
          user_id?: string
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
          referral_code: string | null
          stripe_connect_id: string | null
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
          referral_code?: string | null
          stripe_connect_id?: string | null
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
          referral_code?: string | null
          stripe_connect_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      push_vapid_keys: {
        Row: {
          created_at: string
          id: number
          private_key: string
          public_key: string
        }
        Insert: {
          created_at?: string
          id?: number
          private_key: string
          public_key: string
        }
        Update: {
          created_at?: string
          id?: number
          private_key?: string
          public_key?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          rewarded: boolean
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          rewarded?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          rewarded?: boolean
        }
        Relationships: []
      }
      rekindles: {
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
            foreignKeyName: "rekindles_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          signal_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          signal_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          signal_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_exposures: {
        Row: {
          first_seen_at: string
          id: string
          signal_id: string
          user_id: string
        }
        Insert: {
          first_seen_at?: string
          id?: string
          signal_id: string
          user_id: string
        }
        Update: {
          first_seen_at?: string
          id?: string
          signal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seed_exposures_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
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
          heat_level: string
          id: string
          last_engagement_at: string | null
          media_url: string | null
          song_clip_url: string | null
          song_title: string | null
          stitch_word: string | null
          stitch_word_pos: Json | null
          storage_path: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          heat_level?: string
          id?: string
          last_engagement_at?: string | null
          media_url?: string | null
          song_clip_url?: string | null
          song_title?: string | null
          stitch_word?: string | null
          stitch_word_pos?: Json | null
          storage_path?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          heat_level?: string
          id?: string
          last_engagement_at?: string | null
          media_url?: string | null
          song_clip_url?: string | null
          song_title?: string | null
          stitch_word?: string | null
          stitch_word_pos?: Json | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          referral_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          referral_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          referral_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio_word: string | null
          created_at: string | null
          display_name: string | null
          interests: string[] | null
          qr_code: string | null
          referral_code: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio_word?: string | null
          created_at?: string | null
          display_name?: string | null
          interests?: string[] | null
          qr_code?: string | null
          referral_code?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio_word?: string | null
          created_at?: string | null
          display_name?: string | null
          interests?: string[] | null
          qr_code?: string | null
          referral_code?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_aura_ranked_following: {
        Args: { p_user_id: string }
        Returns: {
          aura_score: number
          following_id: string
        }[]
      }
      get_engagement_ranked_signals: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          engagement_score: number
          expires_at: string
          signal_id: string
          signal_type: string
          signal_user_id: string
          song_clip_url: string
          song_title: string
          stitch_word: string
          storage_path: string
        }[]
      }
      get_profiles_by_ids: {
        Args: { p_user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          interests: string[]
          qr_code: string
          user_id: string
        }[]
      }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          bio_word: string
          created_at: string
          display_name: string
          interests: string[]
          qr_code: string
          referral_code: string
          user_id: string
        }[]
      }
      get_vibe_counts: {
        Args: { p_vibes: string[] }
        Returns: {
          ember_count: number
          vibe: string
        }[]
      }
      get_vibe_top_embers: {
        Args: { p_vibes: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          vibe: string
        }[]
      }
      get_waitlist_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_interest_search: {
        Args: { p_term: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      search_profiles: {
        Args: { requesting_user_id: string; search_term: string }
        Returns: {
          avatar_url: string
          display_name: string
          interests: string[]
          qr_code: string
          user_id: string
        }[]
      }
      update_signal_heat_levels: { Args: never; Returns: undefined }
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
