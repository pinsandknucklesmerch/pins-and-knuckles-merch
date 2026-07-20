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
      app_access: {
        Row: {
          access_level: string
          app_key: string
          created_at: string | null
          id: string
          organisation_member_id: string | null
        }
        Insert: {
          access_level: string
          app_key: string
          created_at?: string | null
          id?: string
          organisation_member_id?: string | null
        }
        Update: {
          access_level?: string
          app_key?: string
          created_at?: string | null
          id?: string
          organisation_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_access_organisation_member_id_fkey"
            columns: ["organisation_member_id"]
            isOneToOne: false
            referencedRelation: "organisation_members"
            referencedColumns: ["id"]
          },
        ]
      }
      calculator_fees: {
        Row: {
          amount: number
          applies_per: string
          calculator_profile_id: string
          cost_side: string
          created_at: string
          currency_code: string
          fee_code: string
          fee_label: string
          id: string
          is_active: boolean
          organisation_id: string | null
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          amount: number
          applies_per: string
          calculator_profile_id: string
          cost_side: string
          created_at?: string
          currency_code: string
          fee_code: string
          fee_label: string
          id?: string
          is_active?: boolean
          organisation_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          amount?: number
          applies_per?: string
          calculator_profile_id?: string
          cost_side?: string
          created_at?: string
          currency_code?: string
          fee_code?: string
          fee_label?: string
          id?: string
          is_active?: boolean
          organisation_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calculator_fees_calculator_profile_id_fkey"
            columns: ["calculator_profile_id"]
            isOneToOne: false
            referencedRelation: "calculator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculator_fees_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      calculator_garment_markups: {
        Row: {
          calculator_profile_id: string
          created_at: string
          garment_type: string
          id: string
          is_active: boolean
          markup_value: number
          organisation_id: string | null
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          calculator_profile_id: string
          created_at?: string
          garment_type: string
          id?: string
          is_active?: boolean
          markup_value: number
          organisation_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          calculator_profile_id?: string
          created_at?: string
          garment_type?: string
          id?: string
          is_active?: boolean
          markup_value?: number
          organisation_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calculator_garment_markups_calculator_profile_id_fkey"
            columns: ["calculator_profile_id"]
            isOneToOne: false
            referencedRelation: "calculator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculator_garment_markups_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      calculator_pricing_sets: {
        Row: {
          code: string
          created_at: string
          currency_code: string
          is_active: boolean
          price_kind: string
          region: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency_code: string
          is_active?: boolean
          price_kind: string
          region: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency_code?: string
          is_active?: boolean
          price_kind?: string
          region?: string
          updated_at?: string
        }
        Relationships: []
      }
      calculator_profile_price_sets: {
        Row: {
          calculator_profile_id: string
          created_at: string
          currency_code: string
          id: string
          price_kind: string
          pricing_set_code: string
          region: string
        }
        Insert: {
          calculator_profile_id: string
          created_at?: string
          currency_code: string
          id?: string
          price_kind: string
          pricing_set_code: string
          region: string
        }
        Update: {
          calculator_profile_id?: string
          created_at?: string
          currency_code?: string
          id?: string
          price_kind?: string
          pricing_set_code?: string
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "calculator_profile_price_sets_calculator_profile_id_fkey"
            columns: ["calculator_profile_id"]
            isOneToOne: false
            referencedRelation: "calculator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculator_profile_price_sets_pricing_set_fk"
            columns: [
              "pricing_set_code",
              "price_kind",
              "region",
              "currency_code",
            ]
            isOneToOne: false
            referencedRelation: "calculator_pricing_sets"
            referencedColumns: ["code", "price_kind", "region", "currency_code"]
          },
          {
            foreignKeyName: "calculator_profile_price_sets_profile_region_currency_fk"
            columns: ["calculator_profile_id", "region", "currency_code"]
            isOneToOne: false
            referencedRelation: "calculator_profiles"
            referencedColumns: ["id", "region", "currency_code"]
          },
        ]
      }
      calculator_profiles: {
        Row: {
          code: string
          copy_formatter_code: string
          created_at: string
          currency_code: string
          id: string
          is_active: boolean
          is_deferred: boolean
          max_colours: number | null
          max_quantity: number | null
          min_quantity: number
          name: string
          organisation_id: string | null
          region: string
          supports_delivery: boolean
          supports_embroidery: boolean
          supports_pk_markup: boolean
          supports_screen_setup: boolean
          tier_strategy: string
          updated_at: string
          vat_rate: number | null
        }
        Insert: {
          code: string
          copy_formatter_code: string
          created_at?: string
          currency_code: string
          id?: string
          is_active?: boolean
          is_deferred?: boolean
          max_colours?: number | null
          max_quantity?: number | null
          min_quantity: number
          name: string
          organisation_id?: string | null
          region: string
          supports_delivery?: boolean
          supports_embroidery?: boolean
          supports_pk_markup?: boolean
          supports_screen_setup?: boolean
          tier_strategy: string
          updated_at?: string
          vat_rate?: number | null
        }
        Update: {
          code?: string
          copy_formatter_code?: string
          created_at?: string
          currency_code?: string
          id?: string
          is_active?: boolean
          is_deferred?: boolean
          max_colours?: number | null
          max_quantity?: number | null
          min_quantity?: number
          name?: string
          organisation_id?: string | null
          region?: string
          supports_delivery?: boolean
          supports_embroidery?: boolean
          supports_pk_markup?: boolean
          supports_screen_setup?: boolean
          tier_strategy?: string
          updated_at?: string
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calculator_profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_rates: {
        Row: {
          cost_per_box: number
          country: string
          created_at: string
          currency_code: string
          delivery_time: string
          id: string
          is_active: boolean
          organisation_id: string | null
          price_kind: string
          pricing_set_code: string
          region: string
          updated_at: string
          valid_from: string
          valid_to: string | null
          vat_rate: number
        }
        Insert: {
          cost_per_box: number
          country: string
          created_at?: string
          currency_code?: string
          delivery_time: string
          id?: string
          is_active?: boolean
          organisation_id?: string | null
          price_kind?: string
          pricing_set_code: string
          region?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          vat_rate?: number
        }
        Update: {
          cost_per_box?: number
          country?: string
          created_at?: string
          currency_code?: string
          delivery_time?: string
          id?: string
          is_active?: boolean
          organisation_id?: string | null
          price_kind?: string
          pricing_set_code?: string
          region?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_rates_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_rates_pricing_set_fk"
            columns: [
              "pricing_set_code",
              "price_kind",
              "region",
              "currency_code",
            ]
            isOneToOne: false
            referencedRelation: "calculator_pricing_sets"
            referencedColumns: ["code", "price_kind", "region", "currency_code"]
          },
        ]
      }
      eu_embroidery_pricing: {
        Row: {
          created_at: string
          currency_code: string
          customer_unit_price: number
          id: string
          is_active: boolean
          label: string
          organisation_id: string | null
          price_kind: string
          pricing_set_code: string
          production_unit_price: number
          region: string
          size_code: string
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          currency_code?: string
          customer_unit_price: number
          id?: string
          is_active?: boolean
          label: string
          organisation_id?: string | null
          price_kind?: string
          pricing_set_code: string
          production_unit_price: number
          region?: string
          size_code: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          currency_code?: string
          customer_unit_price?: number
          id?: string
          is_active?: boolean
          label?: string
          organisation_id?: string | null
          price_kind?: string
          pricing_set_code?: string
          production_unit_price?: number
          region?: string
          size_code?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eu_embroidery_pricing_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eu_embroidery_pricing_pricing_set_fk"
            columns: [
              "pricing_set_code",
              "price_kind",
              "region",
              "currency_code",
            ]
            isOneToOne: false
            referencedRelation: "calculator_pricing_sets"
            referencedColumns: ["code", "price_kind", "region", "currency_code"]
          },
        ]
      }
      eu_print_price_tiers: {
        Row: {
          colour_count: number
          created_at: string
          currency_code: string
          customer_unit_price: number
          id: string
          is_active: boolean
          organisation_id: string | null
          price_kind: string
          pricing_set_code: string
          production_unit_price: number
          quantity_max: number
          quantity_min: number
          region: string
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          colour_count: number
          created_at?: string
          currency_code?: string
          customer_unit_price: number
          id?: string
          is_active?: boolean
          organisation_id?: string | null
          price_kind?: string
          pricing_set_code: string
          production_unit_price: number
          quantity_max: number
          quantity_min: number
          region?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          colour_count?: number
          created_at?: string
          currency_code?: string
          customer_unit_price?: number
          id?: string
          is_active?: boolean
          organisation_id?: string | null
          price_kind?: string
          pricing_set_code?: string
          production_unit_price?: number
          quantity_max?: number
          quantity_min?: number
          region?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eu_print_price_tiers_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eu_print_price_tiers_pricing_set_fk"
            columns: [
              "pricing_set_code",
              "price_kind",
              "region",
              "currency_code",
            ]
            isOneToOne: false
            referencedRelation: "calculator_pricing_sets"
            referencedColumns: ["code", "price_kind", "region", "currency_code"]
          },
        ]
      }
      garments: {
        Row: {
          alt_code: string
          brand_name: string
          code: string
          colour: string
          created_at: string
          eur_base_price: number | null
          extra_size_cost: number | null
          garment_type: string
          gbp_price: number | null
          id: string
          is_active: boolean
          name: string
          organisation_id: string | null
          tags: string
          updated_at: string
        }
        Insert: {
          alt_code?: string
          brand_name?: string
          code: string
          colour?: string
          created_at?: string
          eur_base_price?: number | null
          extra_size_cost?: number | null
          garment_type: string
          gbp_price?: number | null
          id?: string
          is_active?: boolean
          name: string
          organisation_id?: string | null
          tags?: string
          updated_at?: string
        }
        Update: {
          alt_code?: string
          brand_name?: string
          code?: string
          colour?: string
          created_at?: string
          eur_base_price?: number | null
          extra_size_cost?: number | null
          garment_type?: string
          gbp_price?: number | null
          id?: string
          is_active?: boolean
          name?: string
          organisation_id?: string | null
          tags?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_members: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisation_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_kpi_member_months: {
        Row: {
          converted: number | null
          created_at: string
          data_source: string
          id: string
          month: number
          orders_processed: number | null
          organisation_id: string | null
          profit: number | null
          quotes_done: number | null
          sales_inbox_enquiries: number | null
          team_member_key: string
          team_member_name: string
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          converted?: number | null
          created_at?: string
          data_source?: string
          id?: string
          month: number
          orders_processed?: number | null
          organisation_id?: string | null
          profit?: number | null
          quotes_done?: number | null
          sales_inbox_enquiries?: number | null
          team_member_key: string
          team_member_name: string
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          converted?: number | null
          created_at?: string
          data_source?: string
          id?: string
          month?: number
          orders_processed?: number | null
          organisation_id?: string | null
          profit?: number | null
          quotes_done?: number | null
          sales_inbox_enquiries?: number | null
          team_member_key?: string
          team_member_name?: string
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_kpi_member_months_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_kpi_member_months_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_kpi_months: {
        Row: {
          converted: number | null
          created_at: string
          data_source: string
          id: string
          month: number
          monthly_profit: number | null
          notes: string | null
          orders_processed: number | null
          organisation_id: string | null
          quotes_done: number | null
          sales_inbox_enquiries: number | null
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          converted?: number | null
          created_at?: string
          data_source?: string
          id?: string
          month: number
          monthly_profit?: number | null
          notes?: string | null
          orders_processed?: number | null
          organisation_id?: string | null
          quotes_done?: number | null
          sales_inbox_enquiries?: number | null
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          converted?: number | null
          created_at?: string
          data_source?: string
          id?: string
          month?: number
          monthly_profit?: number | null
          notes?: string | null
          orders_processed?: number | null
          organisation_id?: string | null
          quotes_done?: number | null
          sales_inbox_enquiries?: number | null
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_kpi_months_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_kpi_months_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_kpi_targets: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          metric_code: string
          organisation_id: string | null
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          metric_code: string
          organisation_id?: string | null
          target_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          metric_code?: string
          organisation_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_kpi_targets_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      uk_trade_embroidery_pricing: {
        Row: {
          created_at: string
          currency_code: string
          id: string
          is_active: boolean
          is_extra_1000_stitches: boolean
          organisation_id: string | null
          price_kind: string
          pricing_set_code: string
          quantity_tier: number
          region: string
          stitch_count: number
          unit_price: number
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          currency_code?: string
          id?: string
          is_active?: boolean
          is_extra_1000_stitches?: boolean
          organisation_id?: string | null
          price_kind?: string
          pricing_set_code: string
          quantity_tier: number
          region?: string
          stitch_count: number
          unit_price: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: string
          is_active?: boolean
          is_extra_1000_stitches?: boolean
          organisation_id?: string | null
          price_kind?: string
          pricing_set_code?: string
          quantity_tier?: number
          region?: string
          stitch_count?: number
          unit_price?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uk_trade_embroidery_pricing_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uk_trade_embroidery_pricing_pricing_set_fk"
            columns: [
              "pricing_set_code",
              "price_kind",
              "region",
              "currency_code",
            ]
            isOneToOne: false
            referencedRelation: "calculator_pricing_sets"
            referencedColumns: ["code", "price_kind", "region", "currency_code"]
          },
        ]
      }
      uk_trade_print_price_tiers: {
        Row: {
          colour_count: number | null
          created_at: string
          currency_code: string
          id: string
          is_active: boolean
          organisation_id: string | null
          position_code: string
          price_kind: string
          pricing_set_code: string
          quantity_tier: number
          region: string
          setup_screen_count_strategy: string
          unit_price: number
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          colour_count?: number | null
          created_at?: string
          currency_code?: string
          id?: string
          is_active?: boolean
          organisation_id?: string | null
          position_code: string
          price_kind?: string
          pricing_set_code: string
          quantity_tier: number
          region?: string
          setup_screen_count_strategy?: string
          unit_price: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          colour_count?: number | null
          created_at?: string
          currency_code?: string
          id?: string
          is_active?: boolean
          organisation_id?: string | null
          position_code?: string
          price_kind?: string
          pricing_set_code?: string
          quantity_tier?: number
          region?: string
          setup_screen_count_strategy?: string
          unit_price?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uk_trade_print_price_tiers_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uk_trade_print_price_tiers_pricing_set_fk"
            columns: [
              "pricing_set_code",
              "price_kind",
              "region",
              "currency_code",
            ]
            isOneToOne: false
            referencedRelation: "calculator_pricing_sets"
            referencedColumns: ["code", "price_kind", "region", "currency_code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_pins_hub_access: {
        Args: { required_access_level?: string }
        Returns: boolean
      }
      is_organisation_member: {
        Args: { target_organisation_id: string }
        Returns: boolean
      }
      is_own_organisation_membership: {
        Args: { target_member_id: string }
        Returns: boolean
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
