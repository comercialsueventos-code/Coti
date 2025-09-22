// Database types for Supabase
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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: number
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: number
          created_at: string | null
          email: string | null
          id: number
          is_primary: boolean
          name: string
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: number
          created_at?: string | null
          email?: string | null
          id?: number
          is_primary?: boolean
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: number
          created_at?: string | null
          email?: string | null
          id?: number
          is_primary?: boolean
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          advance_payment_percentage: number | null
          city: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: number
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms_days: number | null
          phone: string | null
          requires_advance_payment: boolean | null
          tax_id: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          advance_payment_percentage?: number | null
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          requires_advance_payment?: boolean | null
          tax_id?: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          advance_payment_percentage?: number | null
          city?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          requires_advance_payment?: boolean | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      disposable_items: {
        Row: {
          category: string
          cost_price: number
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          is_active: boolean
          is_biodegradable: boolean | null
          is_recyclable: boolean | null
          minimum_quantity: number
          name: string
          sale_price: number
          shelf_life_days: number | null
          storage_requirements: string | null
          subcategory: string | null
          supplier_info: Json | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          is_biodegradable?: boolean | null
          is_recyclable?: boolean | null
          minimum_quantity?: number
          name: string
          sale_price?: number
          shelf_life_days?: number | null
          storage_requirements?: string | null
          subcategory?: string | null
          supplier_info?: Json | null
          unit?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          is_biodegradable?: boolean | null
          is_recyclable?: boolean | null
          minimum_quantity?: number
          name?: string
          sale_price?: number
          shelf_life_days?: number | null
          storage_requirements?: string | null
          subcategory?: string | null
          supplier_info?: Json | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_availability: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          employee_id: number | null
          end_time: string | null
          event_id: number | null
          id: number
          notes: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["availability_status"] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          employee_id?: number | null
          end_time?: string | null
          event_id?: number | null
          id?: number
          notes?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["availability_status"] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          employee_id?: number | null
          end_time?: string | null
          event_id?: number | null
          id?: number
          notes?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["availability_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_categories: {
        Row: {
          availability_restrictions: Json | null
          category_type: string
          color: string | null
          created_at: string | null
          default_arl_provider: string | null
          default_certifications: Json | null
          default_has_arl: boolean | null
          default_hourly_rates: Json
          description: string | null
          equipment_access: Json | null
          flat_rate: number | null
          icon: string | null
          id: number
          is_active: boolean | null
          min_experience_months: number | null
          name: string
          pricing_type: string | null
          required_certifications: Json | null
          requires_certification: boolean | null
          special_skills: Json | null
          updated_at: string | null
        }
        Insert: {
          availability_restrictions?: Json | null
          category_type: string
          color?: string | null
          created_at?: string | null
          default_arl_provider?: string | null
          default_certifications?: Json | null
          default_has_arl?: boolean | null
          default_hourly_rates?: Json
          description?: string | null
          equipment_access?: Json | null
          flat_rate?: number | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          min_experience_months?: number | null
          name: string
          pricing_type?: string | null
          required_certifications?: Json | null
          requires_certification?: boolean | null
          special_skills?: Json | null
          updated_at?: string | null
        }
        Update: {
          availability_restrictions?: Json | null
          category_type?: string
          color?: string | null
          created_at?: string | null
          default_arl_provider?: string | null
          default_certifications?: Json | null
          default_has_arl?: boolean | null
          default_hourly_rates?: Json
          description?: string | null
          equipment_access?: Json | null
          flat_rate?: number | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          min_experience_months?: number | null
          name?: string
          pricing_type?: string | null
          required_certifications?: Json | null
          requires_certification?: boolean | null
          special_skills?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_shifts: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          employee_id: number | null
          id: number
          notes: string | null
          quote_id: number | null
          quote_item_id: number | null
          replacement_for_employee_id: number | null
          shift_end_time: string | null
          shift_start_time: string | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          status: Database["public"]["Enums"]["availability_status"] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          employee_id?: number | null
          id?: number
          notes?: string | null
          quote_id?: number | null
          quote_item_id?: number | null
          replacement_for_employee_id?: number | null
          shift_end_time?: string | null
          shift_start_time?: string | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          status?: Database["public"]["Enums"]["availability_status"] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          employee_id?: number | null
          id?: number
          notes?: string | null
          quote_id?: number | null
          quote_item_id?: number | null
          replacement_for_employee_id?: number | null
          shift_end_time?: string | null
          shift_start_time?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"]
          status?: Database["public"]["Enums"]["availability_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shifts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shifts_quote_item_id_fkey"
            columns: ["quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shifts_replacement_for_employee_id_fkey"
            columns: ["replacement_for_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          arl_provider: string | null
          category_id: number | null
          certifications: string[] | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          employee_type: Database["public"]["Enums"]["employee_type"]
          has_arl: boolean | null
          hourly_rates: Json | null
          id: number
          identification_number: string | null
          is_active: boolean | null
          name: string
          phone: string | null
          profile_picture_url: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          arl_provider?: string | null
          category_id?: number | null
          certifications?: string[] | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          employee_type: Database["public"]["Enums"]["employee_type"]
          has_arl?: boolean | null
          hourly_rates?: Json | null
          id?: number
          identification_number?: string | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          arl_provider?: string | null
          category_id?: number | null
          certifications?: string[] | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          employee_type?: Database["public"]["Enums"]["employee_type"]
          has_arl?: boolean | null
          hourly_rates?: Json | null
          id?: number
          identification_number?: string | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "employee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "employee_categories_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: number
          category: string
          subcategory: string | null
          name: string
          description: string | null
          base_price: number
          unit: string
          requires_equipment: boolean
          equipment_needed: string[] | null
          preparation_time_minutes: number | null
          shelf_life_hours: number | null
          ingredients: string[] | null
          allergens: string[] | null
          nutritional_info: Record<string, any> | null
          supplier_info: Record<string, any> | null
          cost_price: number | null
          minimum_order: number
          is_seasonal: boolean
          seasonal_months: number[] | null
          is_active: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          category: string
          subcategory?: string | null
          name: string
          description?: string | null
          base_price: number
          unit: string
          requires_equipment?: boolean
          equipment_needed?: string[] | null
          preparation_time_minutes?: number | null
          shelf_life_hours?: number | null
          ingredients?: string[] | null
          allergens?: string[] | null
          nutritional_info?: Record<string, any> | null
          supplier_info?: Record<string, any> | null
          cost_price?: number | null
          minimum_order?: number
          is_seasonal?: boolean
          seasonal_months?: number[] | null
          is_active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          category?: string
          subcategory?: string | null
          name?: string
          description?: string | null
          base_price?: number
          unit?: string
          requires_equipment?: boolean
          equipment_needed?: string[] | null
          preparation_time_minutes?: number | null
          shelf_life_hours?: number | null
          ingredients?: string[] | null
          allergens?: string[] | null
          nutritional_info?: Record<string, any> | null
          supplier_info?: Record<string, any> | null
          cost_price?: number | null
          minimum_order?: number
          is_seasonal?: boolean
          seasonal_months?: number[] | null
          is_active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: number
          name: string
          type: 'social' | 'corporativo'
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          tax_id: string | null
          payment_terms_days: number
          requires_advance_payment: boolean
          advance_payment_percentage: number
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          type: 'social' | 'corporativo'
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          tax_id?: string | null
          payment_terms_days?: number
          requires_advance_payment?: boolean
          advance_payment_percentage?: number
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          type?: 'social' | 'corporativo'
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          tax_id?: string | null
          payment_terms_days?: number
          requires_advance_payment?: boolean
          advance_payment_percentage?: number
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transport_zones: {
        Row: {
          id: number
          name: string
          description: string | null
          base_cost: number
          additional_equipment_cost: number
          estimated_travel_time_minutes: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          base_cost: number
          additional_equipment_cost?: number
          estimated_travel_time_minutes?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          base_cost?: number
          additional_equipment_cost?: number
          estimated_travel_time_minutes?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: number
          quote_number: string
          client_id: number
          client_type: 'social' | 'corporativo'
          event_title: string
          event_date: string
          event_start_date: string
          event_end_date: string
          event_start_time: string | null
          event_end_time: string | null
          event_location: string | null
          transport_zone_id: number | null
          estimated_attendees: number | null
          event_description: string | null
          status: 'pendiente' | 'aceptado' | 'cancelado'
          quote_date: string
          expiration_date: string | null
          payment_terms_days: number
          requires_advance_payment: boolean
          advance_payment_percentage: number
          subtotal: number
          transport_cost: number
          tax_retention_percentage: number
          tax_retention_amount: number
          margin_percentage: number
          margin_amount: number
          total_cost: number
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          notes: string | null
          internal_notes: string | null
          custom_texts: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          quote_number?: string
          client_id: number
          client_type: 'social' | 'corporativo'
          event_title: string
          event_date: string
          event_start_date: string
          event_end_date: string
          event_start_time?: string | null
          event_end_time?: string | null
          event_location?: string | null
          transport_zone_id?: number | null
          estimated_attendees?: number | null
          event_description?: string | null
          status?: 'pendiente' | 'aceptado' | 'cancelado'
          quote_date?: string
          expiration_date?: string | null
          payment_terms_days?: number
          requires_advance_payment?: boolean
          advance_payment_percentage?: number
          subtotal?: number
          transport_cost?: number
          tax_retention_percentage?: number
          tax_retention_amount?: number
          margin_percentage?: number
          margin_amount?: number
          total_cost?: number
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          quote_number?: string
          client_id?: number
          client_type?: 'social' | 'corporativo'
          event_title?: string
          event_date?: string
          event_start_date?: string
          event_end_date?: string
          event_start_time?: string | null
          event_end_time?: string | null
          event_location?: string | null
          transport_zone_id?: number | null
          estimated_attendees?: number | null
          event_description?: string | null
          status?: 'pendiente' | 'aceptado' | 'cancelado'
          quote_date?: string
          expiration_date?: string | null
          payment_terms_days?: number
          requires_advance_payment?: boolean
          advance_payment_percentage?: number
          subtotal?: number
          transport_cost?: number
          tax_retention_percentage?: number
          tax_retention_amount?: number
          margin_percentage?: number
          margin_amount?: number
          total_cost?: number
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      disposable_items: {
        Row: {
          id: number
          name: string
          category: string
          subcategory: string | null
          description: string | null
          unit: string
          cost_price: number
          sale_price: number
          minimum_quantity: number
          supplier_info: Record<string, any> | null
          is_recyclable: boolean
          is_biodegradable: boolean
          storage_requirements: string | null
          shelf_life_days: number | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          category?: string
          subcategory?: string | null
          description?: string | null
          unit?: string
          cost_price: number
          sale_price: number
          minimum_quantity?: number
          supplier_info?: Record<string, any> | null
          is_recyclable?: boolean
          is_biodegradable?: boolean
          storage_requirements?: string | null
          shelf_life_days?: number | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          category?: string
          subcategory?: string | null
          description?: string | null
          unit?: string
          cost_price?: number
          sale_price?: number
          minimum_quantity?: number
          supplier_info?: Record<string, any> | null
          is_recyclable?: boolean
          is_biodegradable?: boolean
          storage_requirements?: string | null
          shelf_life_days?: number | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}