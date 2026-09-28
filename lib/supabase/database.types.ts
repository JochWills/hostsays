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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      areas: {
        Row: {
          hero_image_path: string | null
          id: string
          intro: string | null
          is_live: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          hero_image_path?: string | null
          id?: string
          intro?: string | null
          is_live?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          hero_image_path?: string | null
          id?: string
          intro?: string | null
          is_live?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      bookings: {
        Row: {
          alternative_date: string | null
          attribution: Database["public"]["Enums"]["attribution_source"]
          balance_cents: number
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_for_weather: boolean
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          date: string
          decline_reason: string | null
          deposit_cents: number
          experience_id: string
          guest_email: string
          guest_name: string
          guest_notes: string | null
          guest_phone: string
          host_commission_cents: number
          host_commission_status: Database["public"]["Enums"]["commission_status"]
          host_id: string | null
          id: string
          operator_id: string
          paid_at: string | null
          pay_by: string | null
          payout_id: string | null
          people: number
          platform_cents: number
          reference: string
          respond_by: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          token: string
          total_cents: number
          unit_price_cents: number
        }
        Insert: {
          alternative_date?: string | null
          attribution?: Database["public"]["Enums"]["attribution_source"]
          balance_cents: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_for_weather?: boolean
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          date: string
          decline_reason?: string | null
          deposit_cents: number
          experience_id: string
          guest_email: string
          guest_name: string
          guest_notes?: string | null
          guest_phone: string
          host_commission_cents?: number
          host_commission_status?: Database["public"]["Enums"]["commission_status"]
          host_id?: string | null
          id?: string
          operator_id: string
          paid_at?: string | null
          pay_by?: string | null
          payout_id?: string | null
          people: number
          platform_cents: number
          reference: string
          respond_by: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          token: string
          total_cents: number
          unit_price_cents: number
        }
        Update: {
          alternative_date?: string | null
          attribution?: Database["public"]["Enums"]["attribution_source"]
          balance_cents?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_for_weather?: boolean
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          date?: string
          decline_reason?: string | null
          deposit_cents?: number
          experience_id?: string
          guest_email?: string
          guest_name?: string
          guest_notes?: string | null
          guest_phone?: string
          host_commission_cents?: number
          host_commission_status?: Database["public"]["Enums"]["commission_status"]
          host_id?: string | null
          id?: string
          operator_id?: string
          paid_at?: string | null
          pay_by?: string | null
          payout_id?: string | null
          people?: number
          platform_cents?: number
          reference?: string
          respond_by?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          token?: string
          total_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["host_id"]
          },
          {
            foreignKeyName: "bookings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "bookings_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "bookings_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_blackouts: {
        Row: {
          date: string
          experience_id: string
          reason: string | null
        }
        Insert: {
          date: string
          experience_id: string
          reason?: string | null
        }
        Update: {
          date?: string
          experience_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_blackouts_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_blackouts_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_blackouts_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_photos: {
        Row: {
          alt: string
          experience_id: string
          id: string
          path: string
          sort_order: number
        }
        Insert: {
          alt: string
          experience_id: string
          id?: string
          path: string
          sort_order?: number
        }
        Update: {
          alt?: string
          experience_id?: string
          id?: string
          path?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_photos_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_photos_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_photos_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_slots: {
        Row: {
          capacity: number
          experience_id: string
          id: string
          start_time: string
          weekday: number
        }
        Insert: {
          capacity: number
          experience_id: string
          id?: string
          start_time: string
          weekday: number
        }
        Update: {
          capacity?: number
          experience_id?: string
          id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_slots_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_slots_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_slots_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          area_id: string
          category: Database["public"]["Enums"]["category"]
          created_at: string
          description: string
          duration_minutes: number
          featured_rank: number | null
          id: string
          included: string[]
          is_group_price: boolean
          max_people: number
          meeting_point: string
          meeting_point_map_url: string | null
          min_people: number
          operator_cancellation_terms: string | null
          operator_id: string
          pending_changes: Json | null
          price_cents: number
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          summary: string
          title: string
          updated_at: string
          what_to_bring: string[]
        }
        Insert: {
          area_id: string
          category: Database["public"]["Enums"]["category"]
          created_at?: string
          description: string
          duration_minutes: number
          featured_rank?: number | null
          id?: string
          included?: string[]
          is_group_price?: boolean
          max_people: number
          meeting_point: string
          meeting_point_map_url?: string | null
          min_people?: number
          operator_cancellation_terms?: string | null
          operator_id: string
          pending_changes?: Json | null
          price_cents: number
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          summary: string
          title: string
          updated_at?: string
          what_to_bring?: string[]
        }
        Update: {
          area_id?: string
          category?: Database["public"]["Enums"]["category"]
          created_at?: string
          description?: string
          duration_minutes?: number
          featured_rank?: number | null
          id?: string
          included?: string[]
          is_group_price?: boolean
          max_people?: number
          meeting_point?: string
          meeting_point_map_url?: string | null
          min_people?: number
          operator_cancellation_terms?: string | null
          operator_id?: string
          pending_changes?: Json | null
          price_cents?: number
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          summary?: string
          title?: string
          updated_at?: string
          what_to_bring?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "experiences_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "experiences_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "host_cards"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "experiences_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "experiences_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "experiences_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "experiences_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      host_bank_details: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          branch_code: string
          confirmed: boolean
          host_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          branch_code: string
          confirmed?: boolean
          host_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch_code?: string
          confirmed?: boolean
          host_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_bank_details_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "host_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_bank_details_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "host_storefront"
            referencedColumns: ["host_id"]
          },
          {
            foreignKeyName: "host_bank_details_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      host_members: {
        Row: {
          host_id: string
          is_owner: boolean
          user_id: string
        }
        Insert: {
          host_id: string
          is_owner?: boolean
          user_id: string
        }
        Update: {
          host_id?: string
          is_owner?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_members_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_members_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["host_id"]
          },
          {
            foreignKeyName: "host_members_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      host_private: {
        Row: {
          commission_rate: number
          contact_email: string
          contact_phone: string | null
          host_id: string
          listing_url: string
          terms_accepted_at: string | null
        }
        Insert: {
          commission_rate?: number
          contact_email: string
          contact_phone?: string | null
          host_id: string
          listing_url: string
          terms_accepted_at?: string | null
        }
        Update: {
          commission_rate?: number
          contact_email?: string
          contact_phone?: string | null
          host_id?: string
          listing_url?: string
          terms_accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_private_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "host_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_private_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "host_storefront"
            referencedColumns: ["host_id"]
          },
          {
            foreignKeyName: "host_private_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          area_id: string | null
          created_at: string
          featured_rank: number | null
          id: string
          name: string
          photo_path: string | null
          slug: string
          status: Database["public"]["Enums"]["approval_status"]
          type: Database["public"]["Enums"]["host_type"]
          verified_at: string | null
          welcome_note: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          featured_rank?: number | null
          id?: string
          name: string
          photo_path?: string | null
          slug: string
          status?: Database["public"]["Enums"]["approval_status"]
          type: Database["public"]["Enums"]["host_type"]
          verified_at?: string | null
          welcome_note?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string
          featured_rank?: number | null
          id?: string
          name?: string
          photo_path?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["approval_status"]
          type?: Database["public"]["Enums"]["host_type"]
          verified_at?: string | null
          welcome_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hosts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "hosts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "host_cards"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "hosts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["area_id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          host_id: string | null
          operator_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          host_id?: string | null
          operator_id?: string | null
          role: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          host_id?: string | null
          operator_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["host_id"]
          },
          {
            foreignKeyName: "invites_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "invites_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "invites_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_members: {
        Row: {
          is_owner: boolean
          operator_id: string
          user_id: string
        }
        Insert: {
          is_owner?: boolean
          operator_id: string
          user_id: string
        }
        Update: {
          is_owner?: boolean
          operator_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_members_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "operator_members_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "operator_members_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_private: {
        Row: {
          claimed_at: string | null
          contact_email: string
          contact_phone: string | null
          created_by_admin: boolean
          operator_id: string
          terms_accepted_at: string | null
        }
        Insert: {
          claimed_at?: string | null
          contact_email: string
          contact_phone?: string | null
          created_by_admin?: boolean
          operator_id: string
          terms_accepted_at?: string | null
        }
        Update: {
          claimed_at?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_by_admin?: boolean
          operator_id?: string
          terms_accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_private_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: true
            referencedRelation: "experience_cards"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "operator_private_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: true
            referencedRelation: "host_storefront"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "operator_private_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: true
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_strikes: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          operator_id: string
          reason: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          operator_id: string
          reason: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          operator_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_strikes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_strikes_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "operator_strikes_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["operator_id"]
          },
          {
            foreignKeyName: "operator_strikes_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          area_id: string | null
          created_at: string
          description: string | null
          id: string
          is_demo: boolean
          logo_path: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["approval_status"]
          website: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          logo_path?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["approval_status"]
          website?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          logo_path?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["approval_status"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operators_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "operators_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "host_cards"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "operators_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["area_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          id: string
          paystack_fee_cents: number | null
          paystack_reference: string
          raw: Json | null
          refunded_at: string | null
          status: string
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          id?: string
          paystack_fee_cents?: number | null
          paystack_reference: string
          raw?: Json | null
          refunded_at?: string | null
          status: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          id?: string
          paystack_fee_cents?: number | null
          paystack_reference?: string
          raw?: Json | null
          refunded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          booking_count: number
          created_at: string
          host_id: string
          id: string
          paid_at: string | null
          period_month: string
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          amount_cents: number
          booking_count: number
          created_at?: string
          host_id: string
          id?: string
          paid_at?: string | null
          period_month: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          amount_cents?: number
          booking_count?: number
          created_at?: string
          host_id?: string
          id?: string
          paid_at?: string | null
          period_month?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payouts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["host_id"]
          },
          {
            foreignKeyName: "payouts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          experience_id: string
          host_id: string
          id: string
          is_hidden: boolean
          sort_order: number
          tip: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          host_id: string
          id?: string
          is_hidden?: boolean
          sort_order?: number
          tip: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          host_id?: string
          id?: string
          is_hidden?: boolean
          sort_order?: number
          tip?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["host_id"]
          },
          {
            foreignKeyName: "recommendations_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string
          created_at: string
          experience_id: string
          guest_display_name: string | null
          id: string
          is_hidden: boolean
          rating: number
        }
        Insert: {
          body?: string | null
          booking_id: string
          created_at?: string
          experience_id: string
          guest_display_name?: string | null
          id?: string
          is_hidden?: boolean
          rating: number
        }
        Update: {
          body?: string | null
          booking_id?: string
          created_at?: string
          experience_id?: string
          guest_display_name?: string | null
          id?: string
          is_hidden?: boolean
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experience_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_visits: {
        Row: {
          count: number
          day: string
          host_id: string
        }
        Insert: {
          count?: number
          day: string
          host_id: string
        }
        Update: {
          count?: number
          day?: string
          host_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_visits_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_visits_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_storefront"
            referencedColumns: ["host_id"]
          },
          {
            foreignKeyName: "storefront_visits_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      experience_cards: {
        Row: {
          area_id: string | null
          area_name: string | null
          area_slug: string | null
          category: Database["public"]["Enums"]["category"] | null
          created_at: string | null
          duration_minutes: number | null
          featured_rank: number | null
          host_count: number | null
          host_photo_paths: string[] | null
          id: string | null
          is_group_price: boolean | null
          max_people: number | null
          min_people: number | null
          operator_id: string | null
          operator_name: string | null
          operator_slug: string | null
          photo_alt: string | null
          photo_path: string | null
          price_cents: number | null
          rating: number | null
          review_count: number | null
          slug: string | null
          summary: string | null
          title: string | null
        }
        Relationships: []
      }
      host_cards: {
        Row: {
          area_id: string | null
          area_name: string | null
          area_slug: string | null
          featured_rank: number | null
          id: string | null
          name: string | null
          photo_path: string | null
          pick_count: number | null
          slug: string | null
          type: Database["public"]["Enums"]["host_type"] | null
          welcome_note: string | null
        }
        Relationships: []
      }
      host_storefront: {
        Row: {
          area_id: string | null
          area_name: string | null
          area_slug: string | null
          category: Database["public"]["Enums"]["category"] | null
          created_at: string | null
          duration_minutes: number | null
          featured_rank: number | null
          host_count: number | null
          host_id: string | null
          host_photo_paths: string[] | null
          host_slug: string | null
          id: string | null
          is_group_price: boolean | null
          max_people: number | null
          min_people: number | null
          operator_id: string | null
          operator_name: string | null
          operator_slug: string | null
          photo_alt: string | null
          photo_path: string | null
          price_cents: number | null
          rating: number | null
          recommendation_id: string | null
          review_count: number | null
          slug: string | null
          sort_order: number | null
          summary: string | null
          tip: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      complete_signup: {
        Args: {
          p_data: Json
          p_email: string
          p_type: string
          p_user_id: string
        }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      host_bookings: {
        Args: never
        Returns: {
          created_at: string
          date: string
          experience_id: string
          experience_title: string
          guest_first_name: string
          host_commission_cents: number
          host_commission_status: Database["public"]["Enums"]["commission_status"]
          host_id: string
          id: string
          payout_id: string
          people: number
          reference: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      record_storefront_visit: {
        Args: { p_host_id: string }
        Returns: undefined
      }
    }
    Enums: {
      approval_status: "pending" | "verified" | "rejected" | "suspended"
      attribution_source: "storefront" | "ref_link" | "selected" | "none"
      booking_status:
        | "requested"
        | "confirmed"
        | "paid"
        | "completed"
        | "no_show"
        | "declined"
        | "expired"
        | "payment_expired"
        | "cancelled_by_guest_request"
        | "cancelled_guest_refunded"
        | "cancelled_guest_late"
        | "cancelled_by_operator"
      category:
        | "safari"
        | "ocean"
        | "adventure"
        | "food"
        | "culture"
        | "wellness"
      commission_status: "none" | "pending" | "payable" | "paid" | "void"
      host_type:
        | "guesthouse"
        | "bnb"
        | "self_catering"
        | "airbnb"
        | "hotel"
        | "lodge"
        | "other"
      listing_status:
        | "draft"
        | "pending_review"
        | "live"
        | "paused"
        | "rejected"
      payout_status: "draft" | "exported" | "paid"
      user_role: "admin" | "host" | "operator" | "guest"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      approval_status: ["pending", "verified", "rejected", "suspended"],
      attribution_source: ["storefront", "ref_link", "selected", "none"],
      booking_status: [
        "requested",
        "confirmed",
        "paid",
        "completed",
        "no_show",
        "declined",
        "expired",
        "payment_expired",
        "cancelled_by_guest_request",
        "cancelled_guest_refunded",
        "cancelled_guest_late",
        "cancelled_by_operator",
      ],
      category: ["safari", "ocean", "adventure", "food", "culture", "wellness"],
      commission_status: ["none", "pending", "payable", "paid", "void"],
      host_type: [
        "guesthouse",
        "bnb",
        "self_catering",
        "airbnb",
        "hotel",
        "lodge",
        "other",
      ],
      listing_status: ["draft", "pending_review", "live", "paused", "rejected"],
      payout_status: ["draft", "exported", "paid"],
      user_role: ["admin", "host", "operator", "guest"],
    },
  },
} as const
