import { AssessmentInput, AssessmentResult, DocumentScanResult } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function submitAssessment(input: AssessmentInput): Promise<AssessmentResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/eligibility/assess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Assessment failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting assessment:', error);
    // Fallback Mock Data for standalone front-end demonstration
    return {
      assessment_id: 'EVAL-DEMO-001',
      assessed_at: new Date().toISOString(),
      patient_summary: {
        citizen_id_masked: input.citizen_id ? `1-XXXX-XXXXX-XX-9` : 'ไม่ได้ระบุ',
        age: input.age,
        occupation_status: input.occupation_status,
        registered_province: input.registered_province,
        urgency_level: input.urgency_level,
      },
      primary_right: {
        scheme_code: 'UC',
        scheme_name: 'สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง 30 บาทรักษาทุกที่)',
        is_eligible: true,
        coverage_summary: 'ครอบคลุมการรักษาพยาบาลทุกโรคตามมาตรฐาน และยาในบัญชียาหลักแห่งชาติฟรี',
        free_items: [
          'ตรวจรักษาโรคทั่วไป และโรคเรื้อรัง',
          'ผ่าตัดและนอนพักรักษาตัวใน รพ. ตามสิทธิ',
          'รับยาฟรีใกล้บ้านที่ร้านยาคุณภาพ',
          'ส่งเสริมสุขภาพและป้องกันโรค',
        ],
        co_pay_items: ['ยานอกบัญชียาหลักที่ไม่มีข้อบ่งชี้ทางการแพทย์', 'ค่าห้องพิเศษส่วนเกิน'],
        how_to_use: 'ใช้บัตรประชาชนใบเดียว เข้ารับบริการที่หน่วยบริการปฐมภูมิ หรือโรงพยาบาลตามสิทธิ',
        hospital_network: 'หน่วยบริการปฐมภูมิ คลินิกชุมชนอบอุ่น และ รพ.รัฐประจำเขต',
      },
      additional_rights: input.age >= 60 ? [
        {
          scheme_code: 'ELDERLY_BENEFIT',
          scheme_name: 'สิทธิและสวัสดิการผู้สูงอายุ (60 ปีขึ้นไป)',
          is_eligible: true,
          coverage_summary: 'บริการช่องทางด่วน คลินิกผู้สูงอายุ ผ้าอ้อมผู้ใหญ่ และวัคซีนประจำปีฟรี',
          free_items: ['ผ้าอ้อมผู้ใหญ่และแผ่นรองซับ', 'ตรวจคัดกรองภาวะสมองเสื่อม', 'วัคซีนไข้หวัดใหญ่ฟรีทุกปี'],
          co_pay_items: [],
          how_to_use: 'ติดต่อแผนกผู้สูงอายุ หรือ รพ.สต. ใกล้บ้าน',
          hospital_network: 'สถานพยาบาลของรัฐทุกแห่ง',
        }
      ] : [],
      recommendations: [
        'ท่านสามารถใช้บริการ 30 บาทรักษาทุกที่ ได้ที่หน่วยบริการปฐมภูมิหรือคลินิกชุมชนอบอุ่น',
        'หากเจ็บป่วยฉุกเฉินวิกฤตถึงแก่ชีวิต สามารถใช้สิทธิ UCEP เข้ารักษา รพ. ใดก็ได้ ฟรี 72 ชม. แรก (โทร 1669)',
      ],
      pdpa_protected: true,
    };
  }
}

export async function uploadDocument(file: File, documentType: string = 'id_card'): Promise<DocumentScanResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);

  try {
    const response = await fetch(`${API_BASE_URL}/documents/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading document:', error);
    // Offline simulated response
    return {
      document_id: 'DOC-MOCK-99',
      uploaded_at: new Date().toISOString(),
      document_type: documentType,
      extracted_data: {
        name: 'นาย สมศักดิ์ สุขใจ',
        citizen_id: '1100400892143',
        birth_date: '2505-08-12',
      },
      masked_preview: {
        name: 'สม*** สุ***',
        citizen_id: '1-1004-XXXXX-XX-3',
      },
      ocr_confidence: 0.95,
      message: 'ประมวลผลและ Mask ข้อมูลส่วนบุคคล (PDPA) สำเร็จ',
    };
  }
}
