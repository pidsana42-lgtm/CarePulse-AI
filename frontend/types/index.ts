export interface HealthcareRightDetail {
  scheme_code: string;
  scheme_name: string;
  is_eligible: boolean;
  coverage_summary: string;
  free_items: string[];
  co_pay_items: string[];
  how_to_use: string;
  hospital_network: string;
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
  };
  primary_right: HealthcareRightDetail;
  additional_rights: HealthcareRightDetail[];
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
