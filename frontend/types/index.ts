export interface OfficialReference {
  title: string;
  legal_act: string;
  agency: string;
  url: string;
}

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
}

export interface CostPlanningSummary {
  total_estimated_benefit_value: string;
  estimated_out_of_pocket: string;
  eligible_equipment_count: number;
  participating_agencies: string[];
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
  };
  primary_right: HealthcareRightDetail;
  additional_rights: HealthcareRightDetail[];
  cost_planning?: CostPlanningSummary;
  all_official_references?: OfficialReference[];
  recommendations: string[];
  pdpa_protected: boolean;
}

export interface AssessmentInput {
  citizen_id?: string;
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
