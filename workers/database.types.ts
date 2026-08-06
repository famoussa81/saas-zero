// =============================================================================
// Database Types - Generated from Supabase Schema
// =============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      stripe_customers: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          email: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          email?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string;
          email?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      stripe_prices: {
        Row: {
          id: string;
          stripe_price_id: string;
          stripe_product_id: string;
          active: boolean;
          currency: string;
          unit_amount: number | null;
          type: 'one_time' | 'recurring';
          interval: 'day' | 'week' | 'month' | 'year' | null;
          interval_count: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stripe_price_id: string;
          stripe_product_id: string;
          active?: boolean;
          currency?: string;
          unit_amount?: number | null;
          type: 'one_time' | 'recurring';
          interval?: 'day' | 'week' | 'month' | 'year' | null;
          interval_count?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stripe_price_id?: string;
          stripe_product_id?: string;
          active?: boolean;
          currency?: string;
          unit_amount?: number | null;
          type?: 'one_time' | 'recurring';
          interval?: 'day' | 'week' | 'month' | 'year' | null;
          interval_count?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      stripe_subscriptions: {
        Row: {
          id: string;
          customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string | null;
          status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          trial_start: string | null;
          trial_end: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id?: string | null;
          status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          stripe_subscription_id?: string;
          stripe_price_id?: string | null;
          status?: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          stripe_event_id: string;
          event_type: string;
          processed: boolean;
          payload: Json;
          error: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          stripe_event_id: string;
          event_type: string;
          processed?: boolean;
          payload: Json;
          error?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          stripe_event_id?: string;
          event_type?: string;
          processed?: boolean;
          payload?: Json;
          error?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
      };
      email_queue: {
        Row: {
          id: string;
          to_email: string;
          to_name: string | null;
          from_email: string | null;
          from_name: string | null;
          subject: string;
          html_content: string | null;
          text_content: string | null;
          template_id: string | null;
          template_data: Json;
          status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
          attempts: number;
          max_attempts: number;
          last_error: string | null;
          scheduled_for: string;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          to_email: string;
          to_name?: string | null;
          from_email?: string | null;
          from_name?: string | null;
          subject: string;
          html_content?: string | null;
          text_content?: string | null;
          template_id?: string | null;
          template_data?: Json;
          status?: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
          attempts?: number;
          max_attempts?: number;
          last_error?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          to_email?: string;
          to_name?: string | null;
          from_email?: string | null;
          from_name?: string | null;
          subject?: string;
          html_content?: string | null;
          text_content?: string | null;
          template_id?: string | null;
          template_data?: Json;
          status?: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
          attempts?: number;
          max_attempts?: number;
          last_error?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_config: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          billing_email: string | null;
          metadata: Json;
          settings: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          billing_email?: string | null;
          metadata?: Json;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          billing_email?: string | null;
          metadata?: Json;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member' | 'viewer';
          status: 'pending' | 'active' | 'suspended' | 'removed';
          invited_by: string | null;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
          status?: 'pending' | 'active' | 'suspended' | 'removed';
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
          status?: 'pending' | 'active' | 'suspended' | 'removed';
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_invites: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: 'admin' | 'member' | 'viewer';
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: 'admin' | 'member' | 'viewer';
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: 'admin' | 'member' | 'viewer';
          invited_by?: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          timezone: string;
          locale: string;
          metadata: Json;
          onboarding_completed: boolean;
          onboarding_step: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          timezone?: string;
          locale?: string;
          metadata?: Json;
          onboarding_completed?: boolean;
          onboarding_step?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          timezone?: string;
          locale?: string;
          metadata?: Json;
          onboarding_completed?: boolean;
          onboarding_step?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_stripe_customer_id: { Returns: string | null };
      has_active_subscription: { Returns: boolean };
      get_my_organization_id: { Returns: string | null };
      is_organization_owner: { Args: { org_id: string }; Returns: boolean };
      is_organization_admin: { Args: { org_id: string }; Returns: boolean };
      get_my_organization_role: { Args: { org_id: string }; Returns: string | null };
      handle_updated_at: { Returns: unknown };
    };
    Enums: {
      stripe_subscription_status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
      stripe_price_type: 'one_time' | 'recurring';
      stripe_price_interval: 'day' | 'week' | 'month' | 'year';
      organization_member_role: 'owner' | 'admin' | 'member' | 'viewer';
      organization_member_status: 'pending' | 'active' | 'suspended' | 'removed';
      organization_invite_role: 'admin' | 'member' | 'viewer';
      email_queue_status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}