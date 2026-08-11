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
      cron_run_history: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          job_name: string
          metadata: Json
          organisation_id: string
          reporting_month: number
          reporting_year: number
          started_at: string
          status: string
          summary: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name: string
          metadata?: Json
          organisation_id: string
          reporting_month: number
          reporting_year: number
          started_at?: string
          status?: string
          summary?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name?: string
          metadata?: Json
          organisation_id?: string
          reporting_month?: number
          reporting_year?: number
          started_at?: string
          status?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cron_run_history_organisation_id_fkey"
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
      developer_diagnostic_issues: {
        Row: {
          affected_item_id: string | null
          affected_member_key: string | null
          created_at: string
          developer_notes: string | null
          first_detected_at: string
          id: string
          issue_key: string
          issue_type: string
          last_detected_at: string
          no_longer_detected_at: string | null
          occurrence_count: number
          organisation_id: string
          reporting_month: number
          reporting_year: number
          resolved_at: string | null
          resolved_by: string | null
          source: string
          status: string
          summary: string
          updated_at: string
        }
        Insert: {
          affected_item_id?: string | null
          affected_member_key?: string | null
          created_at?: string
          developer_notes?: string | null
          first_detected_at?: string
          id?: string
          issue_key: string
          issue_type: string
          last_detected_at?: string
          no_longer_detected_at?: string | null
          occurrence_count?: number
          organisation_id: string
          reporting_month: number
          reporting_year: number
          resolved_at?: string | null
          resolved_by?: string | null
          source: string
          status?: string
          summary: string
          updated_at?: string
        }
        Update: {
          affected_item_id?: string | null
          affected_member_key?: string | null
          created_at?: string
          developer_notes?: string | null
          first_detected_at?: string
          id?: string
          issue_key?: string
          issue_type?: string
          last_detected_at?: string
          no_longer_detected_at?: string | null
          occurrence_count?: number
          organisation_id?: string
          reporting_month?: number
          reporting_year?: number
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          status?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_diagnostic_issues_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_diagnostic_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          alt_code: string | null
          brand_name: string | null
          code: string
          colour: string | null
          created_at: string
          eur_base_price: number | null
          extra_size_cost: number | null
          garment_type: string
          gbp_price: number | null
          id: string
          is_active: boolean
          name: string
          organisation_id: string | null
          product_type_id: string | null
          tags: string | null
          updated_at: string
        }
        Insert: {
          alt_code?: string | null
          brand_name?: string | null
          code: string
          colour?: string | null
          created_at?: string
          eur_base_price?: number | null
          extra_size_cost?: number | null
          garment_type: string
          gbp_price?: number | null
          id?: string
          is_active?: boolean
          name: string
          organisation_id?: string | null
          product_type_id?: string | null
          tags?: string | null
          updated_at?: string
        }
        Update: {
          alt_code?: string | null
          brand_name?: string | null
          code?: string
          colour?: string | null
          created_at?: string
          eur_base_price?: number | null
          extra_size_cost?: number | null
          garment_type?: string
          gbp_price?: number | null
          id?: string
          is_active?: boolean
          name?: string
          organisation_id?: string | null
          product_type_id?: string | null
          tags?: string | null
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
          {
            foreignKeyName: "garments_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_feedback_reports: {
        Row: {
          attempted_action: string | null
          comment: string
          created_at: string
          developer_notes: string | null
          id: string
          issue_type: string
          organisation_id: string
          page_route: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          submitted_by: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          attempted_action?: string | null
          comment: string
          created_at?: string
          developer_notes?: string | null
          id?: string
          issue_type: string
          organisation_id: string
          page_route: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          submitted_by: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          attempted_action?: string | null
          comment?: string
          created_at?: string
          developer_notes?: string | null
          id?: string
          issue_type?: string
          organisation_id?: string
          page_route?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          submitted_by?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_feedback_reports_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_feedback_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_feedback_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_companies: {
        Row: {
          address_line_1: string
          address_line_2: string
          city: string
          company_name: string
          contact_name: string
          country: string
          created_at: string
          email: string
          eori: string
          id: string
          is_active: boolean
          label: string
          notes: string
          organisation_id: string
          postal_code: string
          region: string
          tax_id: string
          telephone: string
          updated_at: string
          vat_number: string
        }
        Insert: {
          address_line_1?: string
          address_line_2?: string
          city?: string
          company_name: string
          contact_name?: string
          country?: string
          created_at?: string
          email?: string
          eori?: string
          id?: string
          is_active?: boolean
          label: string
          notes?: string
          organisation_id: string
          postal_code?: string
          region?: string
          tax_id?: string
          telephone?: string
          updated_at?: string
          vat_number?: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string
          city?: string
          company_name?: string
          contact_name?: string
          country?: string
          created_at?: string
          email?: string
          eori?: string
          id?: string
          is_active?: boolean
          label?: string
          notes?: string
          organisation_id?: string
          postal_code?: string
          region?: string
          tax_id?: string
          telephone?: string
          updated_at?: string
          vat_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_companies_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_products: {
        Row: {
          commodity_code: string
          country_of_origin: string
          created_at: string
          currency_code: string | null
          default_cost: number | null
          description: string
          id: string
          is_active: boolean
          notes: string
          organisation_id: string
          product_code: string
          product_name: string
          type_material: string
          updated_at: string
        }
        Insert: {
          commodity_code: string
          country_of_origin?: string
          created_at?: string
          currency_code?: string | null
          default_cost?: number | null
          description?: string
          id?: string
          is_active?: boolean
          notes?: string
          organisation_id: string
          product_code: string
          product_name: string
          type_material?: string
          updated_at?: string
        }
        Update: {
          commodity_code?: string
          country_of_origin?: string
          created_at?: string
          currency_code?: string | null
          default_cost?: number | null
          description?: string
          id?: string
          is_active?: boolean
          notes?: string
          organisation_id?: string
          product_code?: string
          product_name?: string
          type_material?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_products_organisation_id_fkey"
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
          is_active: boolean
          monday_member_id: string | null
          organisation_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          monday_member_id?: string | null
          organisation_id?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          monday_member_id?: string | null
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
      product_types: {
        Row: {
          commodity_code: string
          country_of_origin: string
          created_at: string
          default_invoice_cost: number | null
          id: string
          invoice_currency_code: string | null
          invoice_description: string
          is_active: boolean
          name: string
          pricing_category: string
          updated_at: string
        }
        Insert: {
          commodity_code?: string
          country_of_origin?: string
          created_at?: string
          default_invoice_cost?: number | null
          id?: string
          invoice_currency_code?: string | null
          invoice_description?: string
          is_active?: boolean
          name: string
          pricing_category: string
          updated_at?: string
        }
        Update: {
          commodity_code?: string
          country_of_origin?: string
          created_at?: string
          default_invoice_cost?: number | null
          id?: string
          invoice_currency_code?: string | null
          invoice_description?: string
          is_active?: boolean
          name?: string
          pricing_category?: string
          updated_at?: string
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
          last_active_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_active_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_dashboard_tv_settings: {
        Row: {
          display_order: number
          duration_seconds: number
          is_enabled: boolean
          organisation_id: string
          slide_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          display_order: number
          duration_seconds?: number
          is_enabled?: boolean
          organisation_id: string
          slide_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          display_order?: number
          duration_seconds?: number
          is_enabled?: boolean
          organisation_id?: string
          slide_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_dashboard_tv_settings_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_dashboard_tv_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_kpi_member_months: {
        Row: {
          converted: number | null
          created_at: string
          data_source: string
          epcc_source_metadata: Json | null
          id: string
          member_classification: string
          monday_source_metadata: Json | null
          month: number
          orders_processed: number | null
          organisation_id: string | null
          pk_tax: number | null
          profit: number | null
          quotes_done: number | null
          sales_inbox_enquiries: number | null
          snuggle_profit: number | null
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
          epcc_source_metadata?: Json | null
          id?: string
          member_classification?: string
          monday_source_metadata?: Json | null
          month: number
          orders_processed?: number | null
          organisation_id?: string | null
          pk_tax?: number | null
          profit?: number | null
          quotes_done?: number | null
          sales_inbox_enquiries?: number | null
          snuggle_profit?: number | null
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
          epcc_source_metadata?: Json | null
          id?: string
          member_classification?: string
          monday_source_metadata?: Json | null
          month?: number
          orders_processed?: number | null
          organisation_id?: string | null
          pk_tax?: number | null
          profit?: number | null
          quotes_done?: number | null
          sales_inbox_enquiries?: number | null
          snuggle_profit?: number | null
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
      sales_kpi_monday_sync_locks: {
        Row: {
          expires_at: string
          lock_token: string
          locked_at: string
          month: number
          organisation_id: string
          year: number
        }
        Insert: {
          expires_at: string
          lock_token: string
          locked_at?: string
          month: number
          organisation_id: string
          year: number
        }
        Update: {
          expires_at?: string
          lock_token?: string
          locked_at?: string
          month?: number
          organisation_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_kpi_monday_sync_locks_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_kpi_month_final_values: {
        Row: {
          final_value: number
          id: string
          metric_code: string
          month: number
          organisation_id: string | null
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          final_value: number
          id?: string
          metric_code: string
          month: number
          organisation_id?: string | null
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          final_value?: number
          id?: string
          metric_code?: string
          month?: number
          organisation_id?: string | null
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_kpi_month_final_values_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_kpi_month_final_values_updated_by_fkey"
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
          monday_sync_metadata: Json | null
          month: number
          monthly_profit: number | null
          monthly_profit_source: string | null
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
          monday_sync_metadata?: Json | null
          month: number
          monthly_profit?: number | null
          monthly_profit_source?: string | null
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
          monday_sync_metadata?: Json | null
          month?: number
          monthly_profit?: number | null
          monthly_profit_source?: string | null
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
      sales_kpi_profit_email_ingestions: {
        Row: {
          gmail_message_id: string
          id: string
          organisation_id: string
          outcome: string
          processed_at: string
          received_at: string
          report_end: string
          report_month: number
          report_start: string
          report_year: number
          sender: string
          source_hash: string
          subject: string
          total_pk_tax: number
          total_profit: number
          total_sales: number
        }
        Insert: {
          gmail_message_id: string
          id?: string
          organisation_id: string
          outcome?: string
          processed_at?: string
          received_at: string
          report_end: string
          report_month: number
          report_start: string
          report_year: number
          sender: string
          source_hash: string
          subject: string
          total_pk_tax: number
          total_profit: number
          total_sales: number
        }
        Update: {
          gmail_message_id?: string
          id?: string
          organisation_id?: string
          outcome?: string
          processed_at?: string
          received_at?: string
          report_end?: string
          report_month?: number
          report_start?: string
          report_year?: number
          sender?: string
          source_hash?: string
          subject?: string
          total_pk_tax?: number
          total_profit?: number
          total_sales?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_kpi_profit_email_ingestions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_kpi_profit_email_sources: {
        Row: {
          aggregation_rule: string
          created_at: string
          id: string
          message_id: string
          organisation_id: string | null
          parsed_row_count: number
          received_at: string
          report_month: number
          report_year: number
          sender: string
          source_hash: string
          subject: string
        }
        Insert: {
          aggregation_rule: string
          created_at?: string
          id?: string
          message_id: string
          organisation_id?: string | null
          parsed_row_count: number
          received_at: string
          report_month: number
          report_year: number
          sender: string
          source_hash: string
          subject: string
        }
        Update: {
          aggregation_rule?: string
          created_at?: string
          id?: string
          message_id?: string
          organisation_id?: string | null
          parsed_row_count?: number
          received_at?: string
          report_month?: number
          report_year?: number
          sender?: string
          source_hash?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_kpi_profit_email_sources_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
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
      has_pins_hub_access_for_organisation: {
        Args: { required_access_level?: string; target_organisation_id: string }
        Returns: boolean
      }
      has_pins_hub_developer_access: { Args: never; Returns: boolean }
      has_pins_hub_developer_access_for_organisation: {
        Args: { target_organisation_id: string }
        Returns: boolean
      }
      ingest_epcc_monthly_profit: {
        Args: {
          p_message_id: string
          p_month: number
          p_organisation_id: string
          p_received_at: string
          p_report_end: string
          p_report_start: string
          p_sender: string
          p_source_hash: string
          p_subject: string
          p_total_pk_tax: number
          p_total_profit: number
          p_total_sales: number
          p_year: number
        }
        Returns: string
      }
      ingest_epcc_monthly_profit_and_members: {
        Args: {
          p_member_rows: Json
          p_message_id: string
          p_month: number
          p_organisation_id: string
          p_received_at: string
          p_report_end: string
          p_report_start: string
          p_sender: string
          p_source_hash: string
          p_subject: string
          p_total_pk_tax: number
          p_total_profit: number
          p_total_sales: number
          p_year: number
        }
        Returns: string
      }
      is_canonical_pins_knuckles_organisation: {
        Args: { target_organisation_id: string }
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
      read_epcc_profit_ingestion_audit: {
        Args: { p_month: number; p_source_hash?: string; p_year: number }
        Returns: {
          outcome: string
          processed_at: string
          received_at: string
          report_end: string
          report_month: number
          report_start: string
          report_year: number
          source_hash_matches: boolean
          source_hash_present: boolean
        }[]
      }
      release_monday_sales_sync_lock: {
        Args: {
          p_lock_token: string
          p_month: number
          p_organisation_id: string
          p_year: number
        }
        Returns: undefined
      }
      reset_sales_dashboard_tv_settings: {
        Args: { p_organisation_id: string }
        Returns: undefined
      }
      save_sales_dashboard_tv_settings: {
        Args: { p_organisation_id: string; p_settings: Json }
        Returns: undefined
      }
      submit_hub_feedback_report: {
        Args: {
          p_attempted_action: string
          p_comment: string
          p_issue_type: string
          p_page_route: string
          p_user_agent: string
        }
        Returns: string
      }
      try_acquire_monday_sales_sync_lock: {
        Args: {
          p_lock_token: string
          p_month: number
          p_organisation_id: string
          p_year: number
        }
        Returns: boolean
      }
      update_developer_diagnostic_issue: {
        Args: { p_developer_notes: string; p_id: string; p_status: string }
        Returns: undefined
      }
      update_hub_feedback_report: {
        Args: { p_developer_notes: string; p_id: string; p_status: string }
        Returns: undefined
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
