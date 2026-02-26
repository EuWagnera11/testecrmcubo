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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_type: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_type: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          field_type: string | null
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          field_type?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          field_type?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      ai_chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_flows: {
        Row: {
          assigned_to: string | null
          category: string | null
          client_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          n8n_workflow_url: string | null
          name: string
          notes: string | null
          priority: string | null
          project_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          n8n_workflow_url?: string | null
          name: string
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          n8n_workflow_url?: string | null
          name?: string
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_flows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_flows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_flows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_flows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          client_id: string | null
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          project_id: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          project_id?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          project_id?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      campaign_metrics: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cost_per_conversion: number | null
          cost_per_lead: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          leads: number | null
          reach: number | null
          revenue: number | null
          roas: number | null
          spend: number | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cost_per_lead?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          reach?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cost_per_lead?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          reach?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          created_at: string
          end_date: string | null
          id: string
          name: string
          objective: string | null
          platform: string | null
          project_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          objective?: string | null
          platform?: string | null
          project_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          objective?: string | null
          platform?: string | null
          project_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      client_files: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          file_type: string | null
          id: string
          project_id: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          interaction_date: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_date?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_date?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          project_id: string
          sender_email: string | null
          sender_name: string | null
          share_token: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          project_id: string
          sender_email?: string | null
          sender_name?: string | null
          share_token: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          project_id?: string
          sender_email?: string | null
          sender_name?: string | null
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      client_month_closures: {
        Row: {
          avg_cpc: number | null
          avg_cpl: number | null
          avg_ctr: number | null
          campaigns_count: number | null
          client_id: string
          closed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          pdf_url: string | null
          period_end: string
          period_key: string
          period_start: string
          projects_count: number | null
          snapshot_data: Json
          status: string | null
          total_carousel_creatives: number | null
          total_clicks: number | null
          total_conversions: number | null
          total_impressions: number | null
          total_leads: number | null
          total_reach: number | null
          total_revenue: number | null
          total_roas: number | null
          total_spend: number | null
          total_static_creatives: number | null
          updated_at: string | null
        }
        Insert: {
          avg_cpc?: number | null
          avg_cpl?: number | null
          avg_ctr?: number | null
          campaigns_count?: number | null
          client_id: string
          closed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          pdf_url?: string | null
          period_end: string
          period_key: string
          period_start: string
          projects_count?: number | null
          snapshot_data?: Json
          status?: string | null
          total_carousel_creatives?: number | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_impressions?: number | null
          total_leads?: number | null
          total_reach?: number | null
          total_revenue?: number | null
          total_roas?: number | null
          total_spend?: number | null
          total_static_creatives?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_cpc?: number | null
          avg_cpl?: number | null
          avg_ctr?: number | null
          campaigns_count?: number | null
          client_id?: string
          closed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          pdf_url?: string | null
          period_end?: string
          period_key?: string
          period_start?: string
          projects_count?: number | null
          snapshot_data?: Json
          status?: string | null
          total_carousel_creatives?: number | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_impressions?: number | null
          total_leads?: number | null
          total_reach?: number | null
          total_revenue?: number | null
          total_roas?: number | null
          total_spend?: number | null
          total_static_creatives?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_month_closures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_month_closures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          birthday: string | null
          company: string | null
          contract_renewal_date: string | null
          country_code: string | null
          created_at: string
          email: string | null
          id: string
          monthly_plan_value: number | null
          name: string
          notes: string | null
          phone: string | null
          plan_billing_day: number | null
          plan_currency: string | null
          plan_start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birthday?: string | null
          company?: string | null
          contract_renewal_date?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_plan_value?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          plan_billing_day?: number | null
          plan_currency?: string | null
          plan_start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birthday?: string | null
          company?: string | null
          contract_renewal_date?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_plan_value?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          plan_billing_day?: number | null
          plan_currency?: string | null
          plan_start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      closure_commissions: {
        Row: {
          amount: number
          base_value: number
          closure_id: string
          created_at: string | null
          description: string | null
          id: string
          paid: boolean | null
          paid_at: string | null
          percentage: number | null
          rule_id: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          amount: number
          base_value: number
          closure_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          paid?: boolean | null
          paid_at?: string | null
          percentage?: number | null
          rule_id?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          amount?: number
          base_value?: number
          closure_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          paid?: boolean | null
          paid_at?: string | null
          percentage?: number | null
          rule_id?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "closure_commissions_closure_id_fkey"
            columns: ["closure_id"]
            isOneToOne: false
            referencedRelation: "client_month_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closure_commissions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          base_field: string | null
          calc_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          target_role: string | null
          target_user_id: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          base_field?: string | null
          calc_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_role?: string | null
          target_user_id?: string | null
          updated_at?: string | null
          value: number
        }
        Update: {
          base_field?: string | null
          calc_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_role?: string | null
          target_user_id?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          contract_type: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          terms: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          terms: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          terms?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          auto_renew: boolean | null
          client_id: string | null
          contract_type: string
          created_at: string
          expiry_date: string | null
          id: string
          project_id: string | null
          renewal_reminder_days: number | null
          status: string
          terms: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          client_id?: string | null
          contract_type?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          project_id?: string | null
          renewal_reminder_days?: number | null
          status?: string
          terms?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          client_id?: string | null
          contract_type?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          project_id?: string | null
          renewal_reminder_days?: number | null
          status?: string
          terms?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          drive_url: string
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          drive_url: string
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          drive_url?: string
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_access_logs: {
        Row: {
          accessed_at: string
          id: string
          ip_address: string | null
          project_id: string
          share_token: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          project_id: string
          share_token: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          project_id?: string
          share_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_access_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_access_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          next_occurrence: string | null
          payment_date: string | null
          payment_status: string | null
          project_id: string | null
          recurrence_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          next_occurrence?: string | null
          payment_date?: string | null
          payment_status?: string | null
          project_id?: string | null
          recurrence_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          next_occurrence?: string | null
          payment_date?: string | null
          payment_status?: string | null
          project_id?: string | null
          recurrence_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "project_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          created_at: string
          id: string
          month: string
          revenue_goal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          revenue_goal?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          revenue_goal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          notify_approvals: boolean | null
          notify_clients: boolean | null
          notify_contracts: boolean | null
          notify_messages: boolean | null
          notify_payments: boolean | null
          notify_projects: boolean | null
          notify_tasks: boolean | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_approvals?: boolean | null
          notify_clients?: boolean | null
          notify_contracts?: boolean | null
          notify_messages?: boolean | null
          notify_payments?: boolean | null
          notify_projects?: boolean | null
          notify_tasks?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_approvals?: boolean | null
          notify_clients?: boolean | null
          notify_contracts?: boolean | null
          notify_messages?: boolean | null
          notify_payments?: boolean | null
          notify_projects?: boolean | null
          notify_tasks?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_steps: {
        Row: {
          completed_at: string
          id: string
          step_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          step_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          step_key?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          amount: number | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          project_id: string | null
          reminder_date: string
          reminder_type: string
          sent_at: string | null
          title: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          reminder_date: string
          reminder_type: string
          sent_at?: string | null
          title: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          reminder_date?: string
          reminder_type?: string
          sent_at?: string | null
          title?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payment_reminders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      post_notifications: {
        Row: {
          created_at: string
          id: string
          notification_type: string
          post_id: string
          scheduled_for: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_type?: string
          post_id: string
          scheduled_for: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_type?: string
          post_id?: string
          scheduled_for?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "project_social_calendar"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          revenue_goal: number | null
          status: string
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          revenue_goal?: number | null
          status?: string
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          revenue_goal?: number | null
          status?: string
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_alterations: {
        Row: {
          alteration_type: string
          created_at: string
          description: string | null
          id: string
          project_id: string
          value: number
        }
        Insert: {
          alteration_type: string
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          value?: number
        }
        Update: {
          alteration_type?: string
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_alterations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_alterations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_audiovisual: {
        Row: {
          created_at: string
          delivery_formats: string | null
          equipment_requirements: string | null
          id: string
          production_notes: string | null
          project_id: string
          script_notes: string | null
          style_references: string | null
          updated_at: string
          video_types: string[] | null
        }
        Insert: {
          created_at?: string
          delivery_formats?: string | null
          equipment_requirements?: string | null
          id?: string
          production_notes?: string | null
          project_id: string
          script_notes?: string | null
          style_references?: string | null
          updated_at?: string
          video_types?: string[] | null
        }
        Update: {
          created_at?: string
          delivery_formats?: string | null
          equipment_requirements?: string | null
          id?: string
          production_notes?: string | null
          project_id?: string
          script_notes?: string | null
          style_references?: string | null
          updated_at?: string
          video_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_audiovisual_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_audiovisual_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_branding: {
        Row: {
          brand_guidelines_url: string | null
          brand_voice: string | null
          color_palette: string | null
          competitors: string | null
          created_at: string
          id: string
          positioning_statement: string | null
          project_id: string
          target_audience: string | null
          typography_notes: string | null
          updated_at: string
          visual_identity_notes: string | null
        }
        Insert: {
          brand_guidelines_url?: string | null
          brand_voice?: string | null
          color_palette?: string | null
          competitors?: string | null
          created_at?: string
          id?: string
          positioning_statement?: string | null
          project_id: string
          target_audience?: string | null
          typography_notes?: string | null
          updated_at?: string
          visual_identity_notes?: string | null
        }
        Update: {
          brand_guidelines_url?: string | null
          brand_voice?: string | null
          color_palette?: string | null
          competitors?: string | null
          created_at?: string
          id?: string
          positioning_statement?: string | null
          project_id?: string
          target_audience?: string | null
          typography_notes?: string | null
          updated_at?: string
          visual_identity_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_branding_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_branding_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_change_requests: {
        Row: {
          attachments: string[] | null
          created_at: string
          created_by: string
          description: string
          id: string
          notes: string | null
          project_id: string
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          notes?: string | null
          project_id: string
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          notes?: string | null
          project_id?: string
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_copy_bank: {
        Row: {
          angle: string
          content: string
          created_at: string
          id: string
          project_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          angle: string
          content: string
          created_at?: string
          id?: string
          project_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          angle?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_copy_bank_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_copy_bank_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_creatives: {
        Row: {
          created_at: string
          dark_post_id: string | null
          id: string
          media_type: string | null
          media_url: string | null
          project_id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dark_post_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          project_id: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dark_post_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          project_id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_creatives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_creatives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_crm_integration: {
        Row: {
          api_endpoint: string | null
          created_at: string
          crm_platform: string | null
          fields_mapped: string | null
          id: string
          integration_status: string | null
          last_sync_at: string | null
          notes: string | null
          project_id: string
          sync_frequency: string | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          crm_platform?: string | null
          fields_mapped?: string | null
          id?: string
          integration_status?: string | null
          last_sync_at?: string | null
          notes?: string | null
          project_id: string
          sync_frequency?: string | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          crm_platform?: string | null
          fields_mapped?: string | null
          id?: string
          integration_status?: string | null
          last_sync_at?: string | null
          notes?: string | null
          project_id?: string
          sync_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_crm_integration_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_crm_integration_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_fields: {
        Row: {
          attachments: string[] | null
          content: string | null
          created_at: string
          field_type: string
          id: string
          last_edited_by: string | null
          link_url: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string
          field_type: string
          id?: string
          last_edited_by?: string | null
          link_url?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string
          field_type?: string
          id?: string
          last_edited_by?: string | null
          link_url?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_fields_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_fields_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_financial_advisory: {
        Row: {
          budget_analysis: string | null
          cash_flow_notes: string | null
          created_at: string
          financial_goals: string | null
          id: string
          investment_recommendations: string | null
          project_id: string
          report_frequency: string | null
          updated_at: string
        }
        Insert: {
          budget_analysis?: string | null
          cash_flow_notes?: string | null
          created_at?: string
          financial_goals?: string | null
          id?: string
          investment_recommendations?: string | null
          project_id: string
          report_frequency?: string | null
          updated_at?: string
        }
        Update: {
          budget_analysis?: string | null
          cash_flow_notes?: string | null
          created_at?: string
          financial_goals?: string | null
          id?: string
          investment_recommendations?: string | null
          project_id?: string
          report_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_financial_advisory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_financial_advisory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_gmb: {
        Row: {
          business_name: string | null
          categories: string | null
          created_at: string
          gmb_url: string | null
          id: string
          keywords: string | null
          performance_notes: string | null
          photos_notes: string | null
          posting_schedule: string | null
          project_id: string
          review_response_strategy: string | null
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          categories?: string | null
          created_at?: string
          gmb_url?: string | null
          id?: string
          keywords?: string | null
          performance_notes?: string | null
          photos_notes?: string | null
          posting_schedule?: string | null
          project_id: string
          review_response_strategy?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          categories?: string | null
          created_at?: string
          gmb_url?: string | null
          id?: string
          keywords?: string | null
          performance_notes?: string | null
          photos_notes?: string | null
          posting_schedule?: string | null
          project_id?: string
          review_response_strategy?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_gmb_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_gmb_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: Database["public"]["Enums"]["project_role"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_messages: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_metrics: {
        Row: {
          created_at: string
          date: string
          id: string
          metric_type: string
          project_id: string
          value: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          metric_type: string
          project_id: string
          value?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          metric_type?: string
          project_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_optimization_log: {
        Row: {
          action_date: string
          action_description: string
          created_at: string
          id: string
          project_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          action_date?: string
          action_description: string
          created_at?: string
          id?: string
          project_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          action_date?: string
          action_description?: string
          created_at?: string
          id?: string
          project_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_optimization_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_optimization_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_payouts: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          member_name: string | null
          paid: boolean | null
          paid_at: string | null
          project_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          member_name?: string | null
          paid?: boolean | null
          paid_at?: string | null
          project_id: string
          role: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          member_name?: string | null
          paid?: boolean | null
          paid_at?: string | null
          project_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_payouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_payouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_social_ai: {
        Row: {
          ai_instructions: string | null
          ai_tone: string | null
          auto_reply_comments: boolean | null
          auto_reply_dms: boolean | null
          created_at: string
          excluded_keywords: string | null
          facebook_token: string | null
          id: string
          instagram_token: string | null
          project_id: string
          response_delay_minutes: number | null
          updated_at: string
        }
        Insert: {
          ai_instructions?: string | null
          ai_tone?: string | null
          auto_reply_comments?: boolean | null
          auto_reply_dms?: boolean | null
          created_at?: string
          excluded_keywords?: string | null
          facebook_token?: string | null
          id?: string
          instagram_token?: string | null
          project_id: string
          response_delay_minutes?: number | null
          updated_at?: string
        }
        Update: {
          ai_instructions?: string | null
          ai_tone?: string | null
          auto_reply_comments?: boolean | null
          auto_reply_dms?: boolean | null
          created_at?: string
          excluded_keywords?: string | null
          facebook_token?: string | null
          id?: string
          instagram_token?: string | null
          project_id?: string
          response_delay_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_social_ai_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_social_ai_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_social_calendar: {
        Row: {
          comments: number | null
          content: string | null
          created_at: string
          engagement_rate: number | null
          hashtags: string | null
          id: string
          impressions: number | null
          likes: number | null
          media_urls: string[] | null
          metrics_updated_at: string | null
          notes: string | null
          platform: string
          post_url: string | null
          project_id: string
          reach: number | null
          saves: number | null
          scheduled_date: string
          scheduled_time: string | null
          shares: number | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          comments?: number | null
          content?: string | null
          created_at?: string
          engagement_rate?: number | null
          hashtags?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          media_urls?: string[] | null
          metrics_updated_at?: string | null
          notes?: string | null
          platform: string
          post_url?: string | null
          project_id: string
          reach?: number | null
          saves?: number | null
          scheduled_date: string
          scheduled_time?: string | null
          shares?: number | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          comments?: number | null
          content?: string | null
          created_at?: string
          engagement_rate?: number | null
          hashtags?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          media_urls?: string[] | null
          metrics_updated_at?: string | null
          notes?: string | null
          platform?: string
          post_url?: string | null
          project_id?: string
          reach?: number | null
          saves?: number | null
          scheduled_date?: string
          scheduled_time?: string | null
          shares?: number | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_social_calendar_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_social_calendar_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_social_media: {
        Row: {
          brand_voice: string | null
          content_pillars: string | null
          created_at: string
          engagement_goals: string | null
          hashtag_strategy: string | null
          id: string
          platforms: string[] | null
          posting_frequency: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          brand_voice?: string | null
          content_pillars?: string | null
          created_at?: string
          engagement_goals?: string | null
          hashtag_strategy?: string | null
          id?: string
          platforms?: string[] | null
          posting_frequency?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          brand_voice?: string | null
          content_pillars?: string | null
          created_at?: string
          engagement_goals?: string | null
          hashtag_strategy?: string | null
          id?: string
          platforms?: string[] | null
          posting_frequency?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_social_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_social_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_strategy: {
        Row: {
          created_at: string
          funnel_structure: string | null
          id: string
          landing_page_test_url: string | null
          landing_page_url: string | null
          offer_big_idea: string | null
          personas: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          funnel_structure?: string | null
          id?: string
          landing_page_test_url?: string | null
          landing_page_url?: string | null
          offer_big_idea?: string | null
          personas?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          funnel_structure?: string | null
          id?: string
          landing_page_test_url?: string | null
          landing_page_url?: string | null
          offer_big_idea?: string | null
          personas?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_strategy_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_strategy_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          parent_task_id: string | null
          position: number
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          position?: number
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          position?: number
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_technical_setup: {
        Row: {
          ad_account_id: string | null
          ads_manager_link: string | null
          capi_status: string | null
          created_at: string
          drive_link: string | null
          id: string
          meta_pixel_id: string | null
          project_id: string
          tiktok_pixel_id: string | null
          updated_at: string
          utm_pattern: string | null
        }
        Insert: {
          ad_account_id?: string | null
          ads_manager_link?: string | null
          capi_status?: string | null
          created_at?: string
          drive_link?: string | null
          id?: string
          meta_pixel_id?: string | null
          project_id: string
          tiktok_pixel_id?: string | null
          updated_at?: string
          utm_pattern?: string | null
        }
        Update: {
          ad_account_id?: string | null
          ads_manager_link?: string | null
          capi_status?: string | null
          created_at?: string
          drive_link?: string | null
          id?: string
          meta_pixel_id?: string | null
          project_id?: string
          tiktok_pixel_id?: string | null
          updated_at?: string
          utm_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_technical_setup_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_technical_setup_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_templates: {
        Row: {
          created_at: string | null
          currency: string | null
          default_fields: Json | null
          default_tasks: Json | null
          default_value: number | null
          description: string | null
          id: string
          name: string
          project_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          default_fields?: Json | null
          default_tasks?: Json | null
          default_value?: number | null
          description?: string | null
          id?: string
          name: string
          project_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          default_fields?: Json | null
          default_tasks?: Json | null
          default_value?: number | null
          description?: string | null
          id?: string
          name?: string
          project_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_tests: {
        Row: {
          created_at: string
          hypothesis: string
          id: string
          learnings: string | null
          project_id: string
          result: string | null
          status: string | null
          updated_at: string
          variables: string | null
        }
        Insert: {
          created_at?: string
          hypothesis: string
          id?: string
          learnings?: string | null
          project_id: string
          result?: string | null
          status?: string | null
          updated_at?: string
          variables?: string | null
        }
        Update: {
          created_at?: string
          hypothesis?: string
          id?: string
          learnings?: string | null
          project_id?: string
          result?: string | null
          status?: string | null
          updated_at?: string
          variables?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_workflows: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          enabled: boolean | null
          id: string
          name: string
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          trigger_conditions?: Json | null
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          advance_payment: boolean | null
          advance_percentage: number | null
          archived: boolean | null
          cancelled_at: string | null
          carousel_creatives: number | null
          client_id: string | null
          created_at: string
          currency: string
          deadline: string | null
          id: string
          included_in_plan: boolean | null
          monthly_budget: number | null
          name: string
          project_type: string
          project_types: string[] | null
          responsible_id: string | null
          share_enabled: boolean | null
          share_expires_at: string | null
          share_token: string | null
          static_creatives: number | null
          status: string
          target_cpa: number | null
          target_cpl: number | null
          target_roas: number | null
          template_id: string | null
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_payment?: boolean | null
          advance_percentage?: number | null
          archived?: boolean | null
          cancelled_at?: string | null
          carousel_creatives?: number | null
          client_id?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          id?: string
          included_in_plan?: boolean | null
          monthly_budget?: number | null
          name: string
          project_type?: string
          project_types?: string[] | null
          responsible_id?: string | null
          share_enabled?: boolean | null
          share_expires_at?: string | null
          share_token?: string | null
          static_creatives?: number | null
          status?: string
          target_cpa?: number | null
          target_cpl?: number | null
          target_roas?: number | null
          template_id?: string | null
          total_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_payment?: boolean | null
          advance_percentage?: number | null
          archived?: boolean | null
          cancelled_at?: string | null
          carousel_creatives?: number | null
          client_id?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          id?: string
          included_in_plan?: boolean | null
          monthly_budget?: number | null
          name?: string
          project_type?: string
          project_types?: string[] | null
          responsible_id?: string | null
          share_enabled?: boolean | null
          share_expires_at?: string | null
          share_token?: string | null
          static_creatives?: number | null
          status?: string
          target_cpa?: number | null
          target_cpl?: number | null
          target_roas?: number | null
          template_id?: string | null
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          content: string | null
          created_at: string | null
          id: string
          sent_at: string | null
          status: string | null
          title: string
          total_value: number | null
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          title: string
          total_value?: number | null
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          title?: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_pipeline: {
        Row: {
          asaas_customer_id: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          asaas_payment_status: string | null
          assigned_to: string | null
          client_id: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          created_by: string
          id: string
          lost_at: string | null
          lost_reason: string | null
          notes: string | null
          source: string | null
          stage: string
          title: string
          updated_at: string
          value: number | null
          won_at: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_payment_status?: string | null
          assigned_to?: string | null
          client_id?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          created_by: string
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          notes?: string | null
          source?: string | null
          stage?: string
          title: string
          updated_at?: string
          value?: number | null
          won_at?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_payment_status?: string | null
          assigned_to?: string | null
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          notes?: string | null
          source?: string | null
          stage?: string
          title?: string
          updated_at?: string
          value?: number | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_pipeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_pipeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "shared_project_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          frequency: string
          id: string
          last_sent_at: string | null
          next_send_at: string | null
          recipients: Json | null
          report_type: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency: string
          id?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          recipients?: Json | null
          report_type: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string
          id?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          recipients?: Json | null
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      signatories: {
        Row: {
          contract_id: string
          created_at: string
          email: string
          id: string
          name: string
          role: string
          signed_at: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
          signed_at?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signatories_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          position: number | null
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          position?: number | null
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          position?: number | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_label_assignments: {
        Row: {
          created_at: string | null
          id: string
          label_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "task_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_label_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_labels: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      team_goals: {
        Row: {
          created_at: string
          created_by: string
          id: string
          month: string
          revenue_goal: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          month: string
          revenue_goal?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          month?: string
          revenue_goal?: number
          updated_at?: string
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_leads: {
        Row: {
          created_at: string | null
          email: string | null
          extra_data: Json | null
          id: string
          imported: boolean | null
          message: string | null
          name: string
          phone: string | null
          pipeline_item_id: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          extra_data?: Json | null
          id?: string
          imported?: boolean | null
          message?: string | null
          name: string
          phone?: string | null
          pipeline_item_id?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          extra_data?: Json | null
          id?: string
          imported?: boolean | null
          message?: string | null
          name?: string
          phone?: string | null
          pipeline_item_id?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_leads_pipeline_item_id_fkey"
            columns: ["pipeline_item_id"]
            isOneToOne: false
            referencedRelation: "sales_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          name: string | null
          notes: string | null
          phone: string
          profile_pic_url: string | null
          source: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone: string
          profile_pic_url?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string
          profile_pic_url?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversation_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          assigned_to: string | null
          contact_id: string
          created_at: string
          id: string
          instance_id: string
          last_message_at: string | null
          status: string
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id: string
          created_at?: string
          id?: string
          instance_id: string
          last_message_at?: string | null
          status?: string
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          instance_id?: string
          last_message_at?: string | null
          status?: string
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          api_key: string
          api_url: string
          created_at: string
          created_by: string
          id: string
          instance_name: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string
          created_by: string
          id?: string
          instance_name: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string
          created_by?: string
          id?: string
          instance_name?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          external_id: string | null
          id: string
          media_type: string | null
          media_url: string | null
          sender_type: string
          sent_by: string | null
          status: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_type?: string
          sent_by?: string | null
          status?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_type?: string
          sent_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_tags: {
        Row: {
          color: string
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      shared_project_clients: {
        Row: {
          company: string | null
          id: string | null
          name: string | null
          project_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_project_role: {
        Args: {
          _project_id: string
          _role: Database["public"]["Enums"]["project_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      is_copywriter: { Args: { _user_id: string }; Returns: boolean }
      is_designer: { Args: { _user_id: string }; Returns: boolean }
      is_director: { Args: { _user_id: string }; Returns: boolean }
      is_project_director: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_participant: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_social_media: { Args: { _user_id: string }; Returns: boolean }
      is_team_leader: { Args: { _user_id: string }; Returns: boolean }
      is_traffic_manager: { Args: { _user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          _action: string
          _new_data?: Json
          _old_data?: Json
          _record_id?: string
          _table_name?: string
        }
        Returns: undefined
      }
      set_user_roles: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _target_user: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "director"
        | "user"
        | "designer"
        | "copywriter"
        | "traffic_manager"
        | "social_media"
        | "team_leader"
        | "programmer"
        | "sdr"
        | "closer"
        | "video_editor"
      project_role:
        | "director"
        | "designer"
        | "copywriter"
        | "traffic_manager"
        | "social_media"
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
        "admin",
        "director",
        "user",
        "designer",
        "copywriter",
        "traffic_manager",
        "social_media",
        "team_leader",
        "programmer",
        "sdr",
        "closer",
        "video_editor",
      ],
      project_role: [
        "director",
        "designer",
        "copywriter",
        "traffic_manager",
        "social_media",
      ],
    },
  },
} as const
