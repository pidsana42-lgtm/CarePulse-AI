export interface OfficialReference {
  title: string;
  legal_act: string;
  agency: string;
  url: string;
  checked_at?: string;
}

export type EligibilityStatus = 'likely' | 'needs_review' | 'not_matched';

export interface HealthcareRightDetail {
  scheme_code: string;
  scheme_name: string;
  is_eligible: boolean;
  responsible_agency?: string;
  contact_channel?: string;
  coverage_summary: string;
  free_items: string[];
  co_pay_items: string[];
  eligible_equipment?: string[];
  estimated_coverage_value?: string;
  estimated_out_of_pocket?: string;
  official_references?: OfficialReference[];
  how_to_use: string;
  hospital_network: string;
  eligibility_status?: EligibilityStatus;
  matching_reasons?: string[];
  missing_information?: string[];
  required_documents?: string[];
  application_steps?: string[];
  last_reviewed?: string;
}

export interface CostPlanningSummary {
  total_estimated_benefit_value: string;
  estimated_out_of_pocket: string;
  eligible_equipment_count: number;
  participating_agencies: string[];
}

export interface MockRegistryBenefit {
  code: string;
  name: string;
  coverage: string;
  status: 'ELIGIBLE' | 'REVIEW_REQUIRED';
}

export interface MockGatewayCheck {
  code: 'NHSO' | 'SSO' | 'CGD' | 'OIC';
  agency: string;
  service: string;
  status: 'MATCHED' | 'NOT_FOUND' | 'NOT_CONNECTED';
  message: string;
  reference_url: string;
}

export interface MockInsurancePolicy {
  policy_number_masked: string;
  policy_type: 'LIFE' | 'HEALTH';
  insurer_name: string;
  plan_name: string;
  status: 'ACTIVE' | 'EXPIRED';
  effective_date: string;
  expiry_date: string;
  coverage_summary: string;
  sum_insured: string;
}

export interface MockRegistryResponse {
  request_id: string;
  checked_at: string;
  endpoint: string;
  person: {
    citizen_id_masked: string;
    display_name: string;
    birth_date?: string;
  };
  entitlement: {
    scheme_code: string;
    scheme_name: string;
    sub_scheme_code: string;
    sub_scheme_name: string;
    status: 'ACTIVE' | 'REVIEW_REQUIRED';
    effective_date: string;
    expiry_date: string | null;
    primary_provider: {
      hcode: string;
      name: string;
      province: string;
    };
    nhso_detail?: {
      health_card_number_masked: string;
      registered_province: string;
      service_start_date: string;
      sub_scheme_expiry_date: string | null;
      primary_care_provider: {
        hcode: string;
        name: string;
        province: string;
      } | null;
      referral_provider: {
        hcode: string;
        name: string;
        province: string;
      } | null;
      provider_change_count: number;
    } | null;
  };
  gateways: MockGatewayCheck[];
  private_policies: MockInsurancePolicy[];
  benefits: MockRegistryBenefit[];
  source: {
    system: string;
    environment: 'DEMO';
    response_basis: string;
    disclaimer: string;
  };
}

export interface AssessmentResult {
  assessment_id: string;
  assessed_at: string;
  patient_summary: {
    citizen_id_masked: string;
    age: number;
    occupation_status: string;
    registered_province: string;
    urgency_level: string;
    chronic_conditions?: string[];
    current_health_scheme?: string;
    daily_living?: string;
    has_disability_card?: boolean;
    has_mobility_limitation?: boolean;
    has_incontinence?: boolean;
    needs_equipment?: string[];
  };
  primary_right: HealthcareRightDetail;
  additional_rights: HealthcareRightDetail[];
  registry_response?: MockRegistryResponse;
  cost_planning?: CostPlanningSummary;
  all_official_references?: OfficialReference[];
  recommendations: string[];
  pdpa_protected: boolean;
  data_mode?: 'demo';
  disclaimer?: string;
}

export interface AssessmentInput {
  citizen_id?: string;
  full_name?: string;
  birth_date?: string;
  age: number;
  occupation_status: string;
  registered_province: string;
  has_disability_card: boolean;
  chronic_conditions: string[];
  urgency_level: string;
  has_private_insurance?: boolean;
  private_insurance_type?: string; // 'life' | 'health' | 'both'
  private_insurance_provider?: string;
  private_insurance_annual_limit?: number;
  current_health_scheme?: 'ucs' | 'sso33' | 'sso39' | 'sso40' | 'csmbs' | 'unknown';
  daily_living?: 'independent' | 'partial' | 'dependent' | 'bedridden';
  has_mobility_limitation?: boolean;
  has_incontinence?: boolean;
  needs_equipment?: string[];
  consent_to_assess?: boolean;
}

export interface DocumentScanResult {
  document_id: string;
  uploaded_at: string;
  document_type: string;
  extracted_data: Record<string, any>;
  masked_preview: Record<string, any>;
  ocr_confidence: number;
  message: string;
}
