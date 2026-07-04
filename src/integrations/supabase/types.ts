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
      alabama_partners: {
        Row: {
          county: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          type: string
          website: string | null
        }
        Insert: {
          county?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          type?: string
          website?: string | null
        }
        Update: {
          county?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          type?: string
          website?: string | null
        }
        Relationships: []
      }
      alert_boosts: {
        Row: {
          amount_cents: number | null
          created_at: string
          duration_days: number
          expired_notified_at: string | null
          expires_at: string
          expiring_soon_notified_at: string | null
          id: string
          purchased_at: string
          radius_miles: number
          stripe_price_id: string | null
          stripe_session_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          duration_days?: number
          expired_notified_at?: string | null
          expires_at: string
          expiring_soon_notified_at?: string | null
          id?: string
          purchased_at?: string
          radius_miles?: number
          stripe_price_id?: string | null
          stripe_session_id?: string | null
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          duration_days?: number
          expired_notified_at?: string | null
          expires_at?: string
          expiring_soon_notified_at?: string | null
          id?: string
          purchased_at?: string
          radius_miles?: number
          stripe_price_id?: string | null
          stripe_session_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          message: string | null
          status: string
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          status?: string
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          status?: string
          stripe_session_id?: string | null
          user_id?: string | null
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
      found_pets: {
        Row: {
          breed: string | null
          color: string
          created_at: string
          date_found: string
          description: string | null
          found_address: string | null
          found_lat: number | null
          found_lng: number | null
          holding_location: string | null
          id: string
          photos: string[] | null
          shelter_id: string | null
          species: string
          status: string
          updated_at: string
          user_id: string
          video: string | null
        }
        Insert: {
          breed?: string | null
          color: string
          created_at?: string
          date_found: string
          description?: string | null
          found_address?: string | null
          found_lat?: number | null
          found_lng?: number | null
          holding_location?: string | null
          id?: string
          photos?: string[] | null
          shelter_id?: string | null
          species: string
          status?: string
          updated_at?: string
          user_id: string
          video?: string | null
        }
        Update: {
          breed?: string | null
          color?: string
          created_at?: string
          date_found?: string
          description?: string | null
          found_address?: string | null
          found_lat?: number | null
          found_lng?: number | null
          holding_location?: string | null
          id?: string
          photos?: string[] | null
          shelter_id?: string | null
          species?: string
          status?: string
          updated_at?: string
          user_id?: string
          video?: string | null
        }
        Relationships: []
      }
      lost_pet_contacts: {
        Row: {
          contact_email: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          pet_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          pet_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          pet_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_pet_contacts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: true
            referencedRelation: "lost_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_pets: {
        Row: {
          age: string | null
          boosted: boolean | null
          boosted_at: string | null
          breed: string | null
          color: string
          created_at: string
          date_lost: string
          description: string | null
          gender: string | null
          id: string
          last_seen_address: string | null
          last_seen_lat: number | null
          last_seen_lng: number | null
          microchip: string | null
          pet_name: string
          photos: string[] | null
          species: string
          status: string
          updated_at: string
          user_id: string
          video: string | null
        }
        Insert: {
          age?: string | null
          boosted?: boolean | null
          boosted_at?: string | null
          breed?: string | null
          color: string
          created_at?: string
          date_lost: string
          description?: string | null
          gender?: string | null
          id?: string
          last_seen_address?: string | null
          last_seen_lat?: number | null
          last_seen_lng?: number | null
          microchip?: string | null
          pet_name: string
          photos?: string[] | null
          species: string
          status?: string
          updated_at?: string
          user_id: string
          video?: string | null
        }
        Update: {
          age?: string | null
          boosted?: boolean | null
          boosted_at?: string | null
          breed?: string | null
          color?: string
          created_at?: string
          date_lost?: string
          description?: string | null
          gender?: string | null
          id?: string
          last_seen_address?: string | null
          last_seen_lat?: number | null
          last_seen_lng?: number | null
          microchip?: string | null
          pet_name?: string
          photos?: string[] | null
          species?: string
          status?: string
          updated_at?: string
          user_id?: string
          video?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          pet_id: string | null
          photo_url: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          pet_id?: string | null
          photo_url?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          pet_id?: string | null
          photo_url?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_radius_miles: number | null
          created_at: string
          device_token: string | null
          email: string | null
          home_address: string | null
          id: string
          name: string
          notification_prefs: Json
          phone: string | null
          profile_photo: string | null
          state: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_radius_miles?: number | null
          created_at?: string
          device_token?: string | null
          email?: string | null
          home_address?: string | null
          id?: string
          name?: string
          notification_prefs?: Json
          phone?: string | null
          profile_photo?: string | null
          state?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_radius_miles?: number | null
          created_at?: string
          device_token?: string | null
          email?: string | null
          home_address?: string | null
          id?: string
          name?: string
          notification_prefs?: Json
          phone?: string | null
          profile_photo?: string | null
          state?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rural_partners: {
        Row: {
          county: string | null
          created_at: string
          email: string | null
          hunting_area: string | null
          id: string
          name: string
          trail_cam_uploads: string[] | null
          user_id: string
        }
        Insert: {
          county?: string | null
          created_at?: string
          email?: string | null
          hunting_area?: string | null
          id?: string
          name: string
          trail_cam_uploads?: string[] | null
          user_id: string
        }
        Update: {
          county?: string | null
          created_at?: string
          email?: string | null
          hunting_area?: string | null
          id?: string
          name?: string
          trail_cam_uploads?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      shelters: {
        Row: {
          address: string
          approved: boolean | null
          created_at: string
          email: string | null
          id: string
          logo: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address: string
          approved?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string
          approved?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      sightings: {
        Row: {
          created_at: string
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          pet_id: string | null
          photo: string | null
          seen_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          pet_id?: string | null
          photo?: string | null
          seen_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          pet_id?: string | null
          photo?: string | null
          seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          approved: boolean | null
          business_name: string
          created_at: string
          email: string | null
          id: string
          logo: string | null
          tier: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          approved?: boolean | null
          business_name: string
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          tier?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          approved?: boolean | null
          business_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          tier?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          availability: string | null
          county: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          skills: string | null
          user_id: string
        }
        Insert: {
          availability?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          skills?: string | null
          user_id: string
        }
        Update: {
          availability?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          skills?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      sponsors_public: {
        Row: {
          business_name: string | null
          created_at: string | null
          id: string | null
          logo: string | null
          tier: string | null
          website: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string | null
          id?: string | null
          logo?: string | null
          tier?: string | null
          website?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string | null
          id?: string | null
          logo?: string | null
          tier?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_profile_display_name: {
        Args: { _user_id: string }
        Returns: {
          name: string
          profile_photo: string
          user_id: string
        }[]
      }
      get_profile_display_names: {
        Args: { _user_ids: string[] }
        Returns: {
          name: string
          profile_photo: string
          user_id: string
        }[]
      }
      get_public_alabama_partners: {
        Args: never
        Returns: {
          county: string
          created_at: string
          id: string
          name: string
          type: string
          website: string
        }[]
      }
      get_public_rural_partners: {
        Args: never
        Returns: {
          county: string
          created_at: string
          hunting_area: string
          id: string
          name: string
          trail_cam_count: number
        }[]
      }
      get_public_volunteers: {
        Args: never
        Returns: {
          availability: string
          county: string
          created_at: string
          id: string
          name: string
          skills: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
    }
    Enums: {
      app_role:
        | "user"
        | "shelter"
        | "volunteer"
        | "rural_partner"
        | "sponsor"
        | "admin"
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
      app_role: [
        "user",
        "shelter",
        "volunteer",
        "rural_partner",
        "sponsor",
        "admin",
      ],
    },
  },
} as const
