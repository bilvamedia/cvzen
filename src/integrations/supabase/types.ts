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
      ats_score_history: {
        Row: {
          created_at: string
          id: string
          overall_score: number
          resume_id: string
          section_scores: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          overall_score?: number
          resume_id: string
          section_scores?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          overall_score?: number
          resume_id?: string
          section_scores?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ats_score_history_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      ats_section_scores: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          keywords_found: Json
          keywords_missing: Json
          resume_id: string
          score: number
          section_id: string
          section_title: string
          section_type: string
          suggestions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          keywords_found?: Json
          keywords_missing?: Json
          resume_id: string
          score?: number
          section_id: string
          section_title: string
          section_type: string
          suggestions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          keywords_found?: Json
          keywords_missing?: Json
          resume_id?: string
          score?: number
          section_id?: string
          section_title?: string
          section_type?: string
          suggestions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ats_section_scores_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ats_section_scores_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resume_sections"
            referencedColumns: ["id"]
          },
        ]
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
      interviews: {
        Row: {
          candidate_id: string
          confirmed_time: string | null
          created_at: string
          duration_minutes: number
          id: string
          job_id: string | null
          location_details: string | null
          mode: string
          notes: string | null
          proposed_times: Json | null
          recruiter_id: string
          scheduling_type: string
          status: string
          updated_at: string
          video_link: string | null
        }
        Insert: {
          candidate_id: string
          confirmed_time?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          job_id?: string | null
          location_details?: string | null
          mode?: string
          notes?: string | null
          proposed_times?: Json | null
          recruiter_id: string
          scheduling_type?: string
          status?: string
          updated_at?: string
          video_link?: string | null
        }
        Update: {
          candidate_id?: string
          confirmed_time?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          job_id?: string | null
          location_details?: string | null
          mode?: string
          notes?: string | null
          proposed_times?: Json | null
          recruiter_id?: string
          scheduling_type?: string
          status?: string
          updated_at?: string
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          candidate_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          match_score: number | null
          optimized_resume_snapshot: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          match_score?: number | null
          optimized_resume_snapshot?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number | null
          optimized_resume_snapshot?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_preferences: {
        Row: {
          benefits_priorities: string[]
          company_sizes: string[]
          created_at: string
          employment_types: string[]
          expected_salary_max: number | null
          expected_salary_min: number | null
          id: string
          industries: string[]
          interview_availability: Json
          job_functions: string[]
          languages: string[]
          notice_period: string | null
          preferred_locations: string[]
          salary_currency: string | null
          seniority_level: string | null
          shift_preference: string | null
          tools_technologies: string[]
          travel_willingness: string | null
          updated_at: string
          user_id: string
          visa_sponsorship_needed: boolean | null
          willing_to_relocate: boolean | null
          work_modes: string[]
        }
        Insert: {
          benefits_priorities?: string[]
          company_sizes?: string[]
          created_at?: string
          employment_types?: string[]
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          id?: string
          industries?: string[]
          interview_availability?: Json
          job_functions?: string[]
          languages?: string[]
          notice_period?: string | null
          preferred_locations?: string[]
          salary_currency?: string | null
          seniority_level?: string | null
          shift_preference?: string | null
          tools_technologies?: string[]
          travel_willingness?: string | null
          updated_at?: string
          user_id: string
          visa_sponsorship_needed?: boolean | null
          willing_to_relocate?: boolean | null
          work_modes?: string[]
        }
        Update: {
          benefits_priorities?: string[]
          company_sizes?: string[]
          created_at?: string
          employment_types?: string[]
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          id?: string
          industries?: string[]
          interview_availability?: Json
          job_functions?: string[]
          languages?: string[]
          notice_period?: string | null
          preferred_locations?: string[]
          salary_currency?: string | null
          seniority_level?: string | null
          shift_preference?: string | null
          tools_technologies?: string[]
          travel_willingness?: string | null
          updated_at?: string
          user_id?: string
          visa_sponsorship_needed?: boolean | null
          willing_to_relocate?: boolean | null
          work_modes?: string[]
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company: string
          company_website: string | null
          created_at: string
          description: string
          description_embedding: string | null
          employment_type: string
          experience_level: string | null
          id: string
          job_slug: string | null
          location: string | null
          recruiter_id: string
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          skills: Json | null
          status: string
          title: string
          updated_at: string
          work_mode: string
        }
        Insert: {
          company: string
          company_website?: string | null
          created_at?: string
          description: string
          description_embedding?: string | null
          employment_type?: string
          experience_level?: string | null
          id?: string
          job_slug?: string | null
          location?: string | null
          recruiter_id: string
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: Json | null
          status?: string
          title: string
          updated_at?: string
          work_mode?: string
        }
        Update: {
          company?: string
          company_website?: string | null
          created_at?: string
          description?: string
          description_embedding?: string | null
          employment_type?: string
          experience_level?: string | null
          id?: string
          job_slug?: string | null
          location?: string | null
          recruiter_id?: string
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: Json | null
          status?: string
          title?: string
          updated_at?: string
          work_mode?: string
        }
        Relationships: []
      }
      payment_gateway_config: {
        Row: {
          config: Json | null
          created_at: string
          display_name: string
          gateway_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          display_name: string
          gateway_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          display_name?: string
          gateway_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          gateway_name: string
          gateway_order_id: string | null
          gateway_transaction_id: string | null
          id: string
          metadata: Json | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          gateway_name: string
          gateway_order_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          gateway_name?: string
          gateway_order_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          display_order: number
          features: Json
          id: string
          is_popular: boolean
          limits: Json
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          target_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          display_order?: number
          features?: Json
          id?: string
          is_popular?: boolean
          limits?: Json
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          target_role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          display_order?: number
          features?: Json
          id?: string
          is_popular?: boolean
          limits?: Json
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          target_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_likes: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          visitor_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          visitor_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          visitor_hash?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          headline: string | null
          id: string
          linkedin_url: string | null
          phone: string | null
          profile_slug: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          social_links: Json | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          linkedin_url?: string | null
          phone?: string | null
          profile_slug?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          social_links?: Json | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          profile_slug?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          social_links?: Json | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      resume_sections: {
        Row: {
          content: Json
          content_embedding: string | null
          created_at: string
          display_order: number
          id: string
          improved_content: Json | null
          improved_content_embedding: string | null
          resume_id: string
          section_title: string
          section_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          content_embedding?: string | null
          created_at?: string
          display_order?: number
          id?: string
          improved_content?: Json | null
          improved_content_embedding?: string | null
          resume_id: string
          section_title: string
          section_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          content_embedding?: string | null
          created_at?: string
          display_order?: number
          id?: string
          improved_content?: Json | null
          improved_content_embedding?: string | null
          resume_id?: string
          section_title?: string
          section_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_sections_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          parsed_at: string | null
          raw_text: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          parsed_at?: string | null
          raw_text?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          parsed_at?: string | null
          raw_text?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shortlisted_candidates: {
        Row: {
          candidate_profile_id: string
          created_at: string
          id: string
          notes: string | null
          recruiter_id: string
        }
        Insert: {
          candidate_profile_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_id: string
        }
        Update: {
          candidate_profile_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string
          current_period_end: string
          current_period_start: string
          gateway_name: string | null
          gateway_subscription_id: string | null
          id: string
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          current_period_end: string
          current_period_start?: string
          gateway_name?: string | null
          gateway_subscription_id?: string | null
          id?: string
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          gateway_name?: string | null
          gateway_subscription_id?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
      usage_tracking: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          period_end: string
          period_start: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          period_end: string
          period_start: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
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
      get_candidate_shortlist_count: {
        Args: { _candidate_id: string }
        Returns: number
      }
      get_profile_contact_for_recruiter: {
        Args: { _profile_id: string }
        Returns: {
          address: string
          email: string
          phone: string
        }[]
      }
      get_public_job_by_slug: {
        Args: { _slug: string }
        Returns: {
          company: string
          company_website: string
          created_at: string
          description: string
          employment_type: string
          experience_level: string
          id: string
          job_slug: string
          location: string
          salary_currency: string
          salary_max: number
          salary_min: number
          skills: Json
          title: string
          work_mode: string
        }[]
      }
      get_public_job_preferences: {
        Args: { _profile_id: string }
        Returns: {
          employment_types: string[]
          interview_availability: Json
          preferred_locations: string[]
          seniority_level: string
          shift_preference: string
          work_modes: string[]
        }[]
      }
      get_public_profile_by_slug: {
        Args: { _slug: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          headline: string
          id: string
          linkedin_url: string
          profile_slug: string
          social_links: Json
          website_url: string
        }[]
      }
      get_public_resume_sections: {
        Args: { _profile_id: string }
        Returns: {
          content: Json
          display_order: number
          id: string
          improved_content: Json
          section_title: string
          section_type: string
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
      search_jobs_semantic: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          company: string
          company_website: string
          created_at: string
          description: string
          employment_type: string
          experience_level: string
          id: string
          job_slug: string
          location: string
          salary_currency: string
          salary_max: number
          salary_min: number
          similarity: number
          skills: Json
          title: string
          work_mode: string
        }[]
      }
      search_resume_sections: {
        Args: {
          filter_section_type?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: Json
          id: string
          improved_content: Json
          resume_id: string
          section_title: string
          section_type: string
          similarity: number
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "candidate" | "recruiter"
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
      app_role: ["candidate", "recruiter"],
    },
  },
} as const
