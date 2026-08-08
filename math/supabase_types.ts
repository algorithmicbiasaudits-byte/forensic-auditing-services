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
      applications: {
        Row: {
          application_id: string
          ats_source: string
          candidate_id: string
          created_at: string | null
          customer_id: number | null
          demographic_source: string | null
          education_level: string | null
          job_id: string
          job_title: string
          occurred_at: string
          outcome: string
          protected_class_cohort: string | null
          rejection_reason_from_ats: string | null
          skills: string[] | null
          years_experience: number | null
        }
        Insert: {
          application_id?: string
          ats_source: string
          candidate_id: string
          created_at?: string | null
          customer_id?: number | null
          demographic_source?: string | null
          education_level?: string | null
          job_id: string
          job_title: string
          occurred_at: string
          outcome: string
          protected_class_cohort?: string | null
          rejection_reason_from_ats?: string | null
          skills?: string[] | null
          years_experience?: number | null
        }
        Update: {
          application_id?: string
          ats_source?: string
          candidate_id?: string
          created_at?: string | null
          customer_id?: number | null
          demographic_source?: string | null
          education_level?: string | null
          job_id?: string
          job_title?: string
          occurred_at?: string
          outcome?: string
          protected_class_cohort?: string | null
          rejection_reason_from_ats?: string | null
          skills?: string[] | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          created_at: string | null
          description: string | null
          finding_type: string | null
          id: number
          recommendation: string | null
          severity: string | null
          submission_id: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          finding_type?: string | null
          id?: number
          recommendation?: string | null
          severity?: string | null
          submission_id?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          finding_type?: string | null
          id?: number
          recommendation?: string | null
          severity?: string | null
          submission_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          audit_id: number
          audit_timestamp: string | null
          claude_output: string | null
          disparate_impact_detected: boolean | null
          employment_gap_flagged: boolean | null
          keyword_mismatch_flagged: boolean | null
          legal_trigger_flagged: boolean | null
          proxy_discrimination_detected: boolean | null
          rejection_id: number
          risk_level: string | null
        }
        Insert: {
          audit_id?: never
          audit_timestamp?: string | null
          claude_output?: string | null
          disparate_impact_detected?: boolean | null
          employment_gap_flagged?: boolean | null
          keyword_mismatch_flagged?: boolean | null
          legal_trigger_flagged?: boolean | null
          proxy_discrimination_detected?: boolean | null
          rejection_id: number
          risk_level?: string | null
        }
        Update: {
          audit_id?: never
          audit_timestamp?: string | null
          claude_output?: string | null
          disparate_impact_detected?: boolean | null
          employment_gap_flagged?: boolean | null
          keyword_mismatch_flagged?: boolean | null
          legal_trigger_flagged?: boolean | null
          proxy_discrimination_detected?: boolean | null
          rejection_id?: number
          risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audits_rejection_id_fkey"
            columns: ["rejection_id"]
            isOneToOne: false
            referencedRelation: "rejections"
            referencedColumns: ["rejection_id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          action_required: string | null
          action_url: string | null
          alert_type: string
          created_at: string | null
          customer_id: number
          id: string
          is_read: boolean | null
          jurisdiction: string
          message: string
          severity: string | null
          title: string
        }
        Insert: {
          action_required?: string | null
          action_url?: string | null
          alert_type: string
          created_at?: string | null
          customer_id: number
          id?: string
          is_read?: boolean | null
          jurisdiction: string
          message: string
          severity?: string | null
          title: string
        }
        Update: {
          action_required?: string | null
          action_url?: string | null
          alert_type?: string
          created_at?: string | null
          customer_id?: number
          id?: string
          is_read?: boolean | null
          jurisdiction?: string
          message?: string
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      compliance_debt: {
        Row: {
          id: string
          issue: string | null
          jurisdiction: string
          logged_at: string
          logged_by: string | null
          rejection_id: number
        }
        Insert: {
          id?: string
          issue?: string | null
          jurisdiction: string
          logged_at?: string
          logged_by?: string | null
          rejection_id: number
        }
        Update: {
          id?: string
          issue?: string | null
          jurisdiction?: string
          logged_at?: string
          logged_by?: string | null
          rejection_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_debt_rejection_id_fkey"
            columns: ["rejection_id"]
            isOneToOne: false
            referencedRelation: "rejections"
            referencedColumns: ["rejection_id"]
          },
        ]
      }
      customers: {
        Row: {
          api_key: string
          ats_type: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          customer_id: number
          plan: string | null
          seats_used: number | null
          status: string | null
        }
        Insert: {
          api_key: string
          ats_type?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          customer_id?: never
          plan?: string | null
          seats_used?: number | null
          status?: string | null
        }
        Update: {
          api_key?: string
          ats_type?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          customer_id?: never
          plan?: string | null
          seats_used?: number | null
          status?: string | null
        }
        Relationships: []
      }
      engagements: {
        Row: {
          analyzed_jds: number | null
          client_name: string
          created_at: string
          engagement_date: string | null
          id: string
          individual_results: Json | null
          jurisdiction: string | null
          jurisdiction_triggers: Json | null
          overall_risk: string | null
          recommendations: Json | null
          risk_distribution: Json | null
          top_flags: Json | null
          total_jds: number | null
        }
        Insert: {
          analyzed_jds?: number | null
          client_name: string
          created_at?: string
          engagement_date?: string | null
          id?: string
          individual_results?: Json | null
          jurisdiction?: string | null
          jurisdiction_triggers?: Json | null
          overall_risk?: string | null
          recommendations?: Json | null
          risk_distribution?: Json | null
          top_flags?: Json | null
          total_jds?: number | null
        }
        Update: {
          analyzed_jds?: number | null
          client_name?: string
          created_at?: string
          engagement_date?: string | null
          id?: string
          individual_results?: Json | null
          jurisdiction?: string | null
          jurisdiction_triggers?: Json | null
          overall_risk?: string | null
          recommendations?: Json | null
          risk_distribution?: Json | null
          top_flags?: Json | null
          total_jds?: number | null
        }
        Relationships: []
      }
      jurisdiction_status: {
        Row: {
          compliance_status: string | null
          customer_id: number
          effective_date: string | null
          id: string
          is_active: boolean | null
          jurisdiction: string
          last_verified_at: string | null
          next_audit_due: string | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          compliance_status?: string | null
          customer_id: number
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction: string
          last_verified_at?: string | null
          next_audit_due?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          compliance_status?: string | null
          customer_id?: number
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction?: string
          last_verified_at?: string | null
          next_audit_due?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_status_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      leads: {
        Row: {
          assessment_type: string | null
          company_size: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          gaps: Json | null
          id: string
          last_name: string | null
          organization: string | null
          risk_level: string | null
          score: string | null
          title: string | null
        }
        Insert: {
          assessment_type?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          gaps?: Json | null
          id?: string
          last_name?: string | null
          organization?: string | null
          risk_level?: string | null
          score?: string | null
          title?: string | null
        }
        Update: {
          assessment_type?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          gaps?: Json | null
          id?: string
          last_name?: string | null
          organization?: string | null
          risk_level?: string | null
          score?: string | null
          title?: string | null
        }
        Relationships: []
      }
      ofccp_compliance_status: {
        Row: {
          aap_expiration: string | null
          contract_threshold: number | null
          created_at: string | null
          customer_id: number
          id: string
          is_federal_contractor: boolean | null
          section_503_current: boolean | null
          updated_at: string | null
          vendor_audit_access: boolean | null
          vevraa_actual_rate: number | null
          vevraa_benchmark: number | null
          vevraa_current: boolean | null
        }
        Insert: {
          aap_expiration?: string | null
          contract_threshold?: number | null
          created_at?: string | null
          customer_id: number
          id?: string
          is_federal_contractor?: boolean | null
          section_503_current?: boolean | null
          updated_at?: string | null
          vendor_audit_access?: boolean | null
          vevraa_actual_rate?: number | null
          vevraa_benchmark?: number | null
          vevraa_current?: boolean | null
        }
        Update: {
          aap_expiration?: string | null
          contract_threshold?: number | null
          created_at?: string | null
          customer_id?: number
          id?: string
          is_federal_contractor?: boolean | null
          section_503_current?: boolean | null
          updated_at?: string | null
          vendor_audit_access?: boolean | null
          vevraa_actual_rate?: number | null
          vevraa_benchmark?: number | null
          vevraa_current?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ofccp_compliance_status_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      org_settings: {
        Row: {
          aap_expiration: string | null
          alert_aap: boolean
          alert_deadlines: boolean
          alert_email: string | null
          alert_fourfifths: boolean
          contract_value: number | null
          customer_id: number
          employee_count: number | null
          id: string
          is_federal_contractor: boolean
          j_caab1018: boolean
          j_cosb189: boolean
          j_euaiact: boolean
          j_ilhb3773: boolean
          j_nycll144: boolean
          j_ofccp: boolean
          self_id_method: string
          updated_at: string
          vendor_audit_clause: boolean
          vevraa_tracking: boolean
        }
        Insert: {
          aap_expiration?: string | null
          alert_aap?: boolean
          alert_deadlines?: boolean
          alert_email?: string | null
          alert_fourfifths?: boolean
          contract_value?: number | null
          customer_id: number
          employee_count?: number | null
          id?: string
          is_federal_contractor?: boolean
          j_caab1018?: boolean
          j_cosb189?: boolean
          j_euaiact?: boolean
          j_ilhb3773?: boolean
          j_nycll144?: boolean
          j_ofccp?: boolean
          self_id_method?: string
          updated_at?: string
          vendor_audit_clause?: boolean
          vevraa_tracking?: boolean
        }
        Update: {
          aap_expiration?: string | null
          alert_aap?: boolean
          alert_deadlines?: boolean
          alert_email?: string | null
          alert_fourfifths?: boolean
          contract_value?: number | null
          customer_id?: number
          employee_count?: number | null
          id?: string
          is_federal_contractor?: boolean
          j_caab1018?: boolean
          j_cosb189?: boolean
          j_euaiact?: boolean
          j_ilhb3773?: boolean
          j_nycll144?: boolean
          j_ofccp?: boolean
          self_id_method?: string
          updated_at?: string
          vendor_audit_clause?: boolean
          vevraa_tracking?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      overrides: {
        Row: {
          audit_id: number
          comparative_assessment: string | null
          decision: string
          escalated_to_user_id: number | null
          escalation_reason: string | null
          job_relatedness_evidence: string | null
          justification_comment: string | null
          override_id: number
          rejection_id: number
          reviewed_by_user_id: number
          reviewed_timestamp: string | null
        }
        Insert: {
          audit_id: number
          comparative_assessment?: string | null
          decision: string
          escalated_to_user_id?: number | null
          escalation_reason?: string | null
          job_relatedness_evidence?: string | null
          justification_comment?: string | null
          override_id?: never
          rejection_id: number
          reviewed_by_user_id: number
          reviewed_timestamp?: string | null
        }
        Update: {
          audit_id?: number
          comparative_assessment?: string | null
          decision?: string
          escalated_to_user_id?: number | null
          escalation_reason?: string | null
          job_relatedness_evidence?: string | null
          justification_comment?: string | null
          override_id?: never
          rejection_id?: number
          reviewed_by_user_id?: number
          reviewed_timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overrides_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["audit_id"]
          },
          {
            foreignKeyName: "overrides_escalated_to_user_id_fkey"
            columns: ["escalated_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "overrides_rejection_id_fkey"
            columns: ["rejection_id"]
            isOneToOne: false
            referencedRelation: "rejections"
            referencedColumns: ["rejection_id"]
          },
          {
            foreignKeyName: "overrides_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      regression_test_results: {
        Row: {
          actual: string | null
          duration_ms: number | null
          expected: string | null
          id: string
          notes: string | null
          passed: boolean
          run_timestamp: string | null
          test_name: string
        }
        Insert: {
          actual?: string | null
          duration_ms?: number | null
          expected?: string | null
          id?: string
          notes?: string | null
          passed: boolean
          run_timestamp?: string | null
          test_name: string
        }
        Update: {
          actual?: string | null
          duration_ms?: number | null
          expected?: string | null
          id?: string
          notes?: string | null
          passed?: boolean
          run_timestamp?: string | null
          test_name?: string
        }
        Relationships: []
      }
      rejections: {
        Row: {
          ats_source: string | null
          candidate_id: string
          created_at: string | null
          customer_id: number
          education_level: string | null
          job_id: string
          job_title: string | null
          protected_class_cohort: string | null
          rejection_id: number
          rejection_reason_from_ats: string | null
          skills: Json | null
          years_experience: number | null
        }
        Insert: {
          ats_source?: string | null
          candidate_id: string
          created_at?: string | null
          customer_id: number
          education_level?: string | null
          job_id: string
          job_title?: string | null
          protected_class_cohort?: string | null
          rejection_id?: never
          rejection_reason_from_ats?: string | null
          skills?: Json | null
          years_experience?: number | null
        }
        Update: {
          ats_source?: string | null
          candidate_id?: string
          created_at?: string | null
          customer_id?: number
          education_level?: string | null
          job_id?: string
          job_title?: string | null
          protected_class_cohort?: string | null
          rejection_id?: never
          rejection_reason_from_ats?: string | null
          skills?: Json | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rejections_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      reviewer_drafts: {
        Row: {
          created_at: string
          id: string
          justification: string
          rejection_id: number
          reviewer_id: string
          selected_action: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          justification?: string
          rejection_id: number
          reviewer_id: string
          selected_action?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          justification?: string
          rejection_id?: number
          reviewer_id?: string
          selected_action?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviewer_drafts_rejection_id_fkey"
            columns: ["rejection_id"]
            isOneToOne: false
            referencedRelation: "rejections"
            referencedColumns: ["rejection_id"]
          },
        ]
      }
      submissions: {
        Row: {
          analysis_status: Json | null
          ats_platforms: string | null
          audit_count: number | null
          audit_notes: Json | null
          checklist_responses: Json | null
          client_id: string
          client_location: string | null
          client_name: string
          company: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_title: string | null
          contract_count: number | null
          created_at: string | null
          deadline: string | null
          eeoc_compliance: boolean | null
          employee_count: string | null
          expedited: boolean | null
          findings: Json | null
          hiring_data: Json | null
          id: number
          industry: string | null
          job_description_count: number | null
          months_data: number | null
          multi_ats: boolean | null
          multi_ats_count: number | null
          multi_location: boolean | null
          num_locations: string | null
          received_at: string | null
          risk_score: number | null
          status: string | null
          subtotal_price: number | null
          tax_amount: number | null
          terms_acknowledged: boolean | null
          terms_acknowledged_at: string | null
          tier: string | null
          total_price: number | null
        }
        Insert: {
          analysis_status?: Json | null
          ats_platforms?: string | null
          audit_count?: number | null
          audit_notes?: Json | null
          checklist_responses?: Json | null
          client_id: string
          client_location?: string | null
          client_name: string
          company: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_title?: string | null
          contract_count?: number | null
          created_at?: string | null
          deadline?: string | null
          eeoc_compliance?: boolean | null
          employee_count?: string | null
          expedited?: boolean | null
          findings?: Json | null
          hiring_data?: Json | null
          id?: number
          industry?: string | null
          job_description_count?: number | null
          months_data?: number | null
          multi_ats?: boolean | null
          multi_ats_count?: number | null
          multi_location?: boolean | null
          num_locations?: string | null
          received_at?: string | null
          risk_score?: number | null
          status?: string | null
          subtotal_price?: number | null
          tax_amount?: number | null
          terms_acknowledged?: boolean | null
          terms_acknowledged_at?: string | null
          tier?: string | null
          total_price?: number | null
        }
        Update: {
          analysis_status?: Json | null
          ats_platforms?: string | null
          audit_count?: number | null
          audit_notes?: Json | null
          checklist_responses?: Json | null
          client_id?: string
          client_location?: string | null
          client_name?: string
          company?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_title?: string | null
          contract_count?: number | null
          created_at?: string | null
          deadline?: string | null
          eeoc_compliance?: boolean | null
          employee_count?: string | null
          expedited?: boolean | null
          findings?: Json | null
          hiring_data?: Json | null
          id?: number
          industry?: string | null
          job_description_count?: number | null
          months_data?: number | null
          multi_ats?: boolean | null
          multi_ats_count?: number | null
          multi_location?: boolean | null
          num_locations?: string | null
          received_at?: string | null
          risk_score?: number | null
          status?: string | null
          subtotal_price?: number | null
          tax_amount?: number | null
          terms_acknowledged?: boolean | null
          terms_acknowledged_at?: string | null
          tier?: string | null
          total_price?: number | null
        }
        Relationships: []
      }
      synthetic_candidates: {
        Row: {
          age_coded_language: boolean | null
          bias_profile: string | null
          candidate_id: string
          created_at: string | null
          demographic_cohort: string | null
          employment_gap_months: number | null
          gender_coded_language: boolean | null
          graduation_year: number | null
          id: string
          job_title: string
          requisition_id: string
          skills: string[] | null
          skills_missing: string[] | null
          years_experience: number | null
        }
        Insert: {
          age_coded_language?: boolean | null
          bias_profile?: string | null
          candidate_id: string
          created_at?: string | null
          demographic_cohort?: string | null
          employment_gap_months?: number | null
          gender_coded_language?: boolean | null
          graduation_year?: number | null
          id?: string
          job_title: string
          requisition_id: string
          skills?: string[] | null
          skills_missing?: string[] | null
          years_experience?: number | null
        }
        Update: {
          age_coded_language?: boolean | null
          bias_profile?: string | null
          candidate_id?: string
          created_at?: string | null
          demographic_cohort?: string | null
          employment_gap_months?: number | null
          gender_coded_language?: boolean | null
          graduation_year?: number | null
          id?: string
          job_title?: string
          requisition_id?: string
          skills?: string[] | null
          skills_missing?: string[] | null
          years_experience?: number | null
        }
        Relationships: []
      }
      synthetic_results: {
        Row: {
          bias_profile: string | null
          candidate_id: string
          created_at: string | null
          error_message: string | null
          fas_case_id: string | null
          id: string
          lanes_flagged: number[] | null
          processing_time_ms: number | null
          risk_level: string | null
          run_id: string | null
          success: boolean
        }
        Insert: {
          bias_profile?: string | null
          candidate_id: string
          created_at?: string | null
          error_message?: string | null
          fas_case_id?: string | null
          id?: string
          lanes_flagged?: number[] | null
          processing_time_ms?: number | null
          risk_level?: string | null
          run_id?: string | null
          success: boolean
        }
        Update: {
          bias_profile?: string | null
          candidate_id?: string
          created_at?: string | null
          error_message?: string | null
          fas_case_id?: string | null
          id?: string
          lanes_flagged?: number[] | null
          processing_time_ms?: number | null
          risk_level?: string | null
          run_id?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "synthetic_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "synthetic_test_runs"
            referencedColumns: ["run_id"]
          },
        ]
      }
      synthetic_test_runs: {
        Row: {
          avg_processing_ms: number | null
          completed_at: string | null
          failed: number | null
          high_risk_count: number | null
          id: string
          lane_accuracy: number | null
          low_risk_count: number | null
          medium_risk_count: number | null
          notes: string | null
          run_id: string
          scenario: string
          started_at: string | null
          successful: number | null
          total_fired: number | null
        }
        Insert: {
          avg_processing_ms?: number | null
          completed_at?: string | null
          failed?: number | null
          high_risk_count?: number | null
          id?: string
          lane_accuracy?: number | null
          low_risk_count?: number | null
          medium_risk_count?: number | null
          notes?: string | null
          run_id: string
          scenario: string
          started_at?: string | null
          successful?: number | null
          total_fired?: number | null
        }
        Update: {
          avg_processing_ms?: number | null
          completed_at?: string | null
          failed?: number | null
          high_risk_count?: number | null
          id?: string
          lane_accuracy?: number | null
          low_risk_count?: number | null
          medium_risk_count?: number | null
          notes?: string | null
          run_id?: string
          scenario?: string
          started_at?: string | null
          successful?: number | null
          total_fired?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          customer_id: number
          email: string
          name: string
          role: string
          user_id: number
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          customer_id: number
          email: string
          name: string
          role: string
          user_id?: never
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          customer_id?: number
          email?: string
          name?: string
          role?: string
          user_id?: never
        }
        Relationships: [
          {
            foreignKeyName: "users_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_synthetic_data: { Args: never; Returns: undefined }
      customer_has_remediation_access: {
        Args: { p_customer_id: number }
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
