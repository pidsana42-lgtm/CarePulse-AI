import type { AssessmentResult, DocumentScanResult } from '@/types';
import { getVerifiedDocumentBenefits } from '@/lib/document-rights';

const SESSION_KEY = 'carepulse_session_memory_v2';
const LEGACY_SESSION_MEMORY_KEY = 'carepulse_session_memory_v1';
const LEGACY_ASSESSMENT_KEY = 'latest_assessment_result';

interface SessionDocumentInsight {
  id: string;
  fileName: string;
  documentType: string;
  uploadedAt: string;
  ocrConfidence: number;
  extractedData: Record<string, unknown>;
  matchedEquipment: Array<{ item: string; agency: string; cost_saved?: string }>;
  eligibleSchemes: Array<{ scheme: string; agency: string; benefit?: string; contact?: string }>;
}

export interface SessionLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}

interface CarePulseSessionMemory {
  version: 2;
  startedAt: string;
  updatedAt: string;
  assessment?: AssessmentResult;
  location?: SessionLocation;
  documentInsights: SessionDocumentInsight[];
}

function emptyMemory(): CarePulseSessionMemory {
  const now = new Date().toISOString();
  return { version: 2, startedAt: now, updatedAt: now, documentInsights: [] };
}

function readMemory(): CarePulseSessionMemory {
  if (typeof window === 'undefined') return emptyMemory();
  window.sessionStorage.removeItem(LEGACY_SESSION_MEMORY_KEY);
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return emptyMemory();
  try {
    const parsed = JSON.parse(raw) as CarePulseSessionMemory;
    if (parsed.version !== 2) return emptyMemory();
    return { ...emptyMemory(), ...parsed, documentInsights: parsed.documentInsights ?? [] };
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return emptyMemory();
  }
}

function writeMemory(memory: CarePulseSessionMemory) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...memory, updatedAt: new Date().toISOString() }));
  window.dispatchEvent(new Event('carepulse:session-updated'));
}

export function setSessionAssessment(assessment: AssessmentResult) {
  const memory = readMemory();
  writeMemory({ ...memory, assessment });
  // Kept temporarily for compatibility with an already-open tab running an older bundle.
  window.sessionStorage.setItem(LEGACY_ASSESSMENT_KEY, JSON.stringify(assessment));
}

export function getSessionAssessment(): AssessmentResult | null {
  const memory = readMemory();
  if (memory.assessment) return memory.assessment;
  if (typeof window === 'undefined') return null;
  const legacy = window.sessionStorage.getItem(LEGACY_ASSESSMENT_KEY);
  if (!legacy) return null;
  try {
    return JSON.parse(legacy) as AssessmentResult;
  } catch {
    return null;
  }
}

export function setSessionLocation(location: Omit<SessionLocation, 'capturedAt'>) {
  const memory = readMemory();
  writeMemory({
    ...memory,
    location: {
      ...location,
      latitude: Number(location.latitude.toFixed(5)),
      longitude: Number(location.longitude.toFixed(5)),
      accuracy: Math.round(location.accuracy),
      capturedAt: new Date().toISOString(),
    },
  });
}

export function getSessionLocation(): SessionLocation | null {
  return readMemory().location ?? null;
}

const CLEAN_EXTRACTED_KEYS = [
  'certificate_data',
  'detected_patient_name',
  'detected_patient_first_name',
  'detected_patient_last_name',
  'detected_citizen_id',
  'detected_age',
  'detected_hospital',
  'detected_conditions',
  'is_bedridden_or_adl_limited',
  'suggested_daily_living',
  'has_mobility_limitation',
  'has_incontinence',
  'has_disability_card',
  'suggested_needs_equipment',
  'matched_equipment',
  'eligible_schemes',
  'official_references',
] as const;

function cleanExtractedData(extracted: DocumentScanResult['extracted_data']): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const key of CLEAN_EXTRACTED_KEYS) {
    const value = extracted[key];
    if (value !== undefined) clean[key] = value;
  }
  return JSON.parse(JSON.stringify(clean)) as Record<string, unknown>;
}

function maskCitizenId(value: unknown): unknown {
  if (typeof value !== 'string' || !/^\d{13}$/.test(value)) return value;
  return `*********${value.slice(-4)}`;
}

function documentForAi(document: SessionDocumentInsight): SessionDocumentInsight {
  const extractedData = { ...document.extractedData };
  const certificateData = extractedData.certificate_data;
  if (certificateData && typeof certificateData === 'object' && !Array.isArray(certificateData)) {
    extractedData.certificate_data = {
      ...(certificateData as Record<string, unknown>),
      citizen_id: maskCitizenId((certificateData as Record<string, unknown>).citizen_id),
    };
  }
  extractedData.detected_citizen_id = maskCitizenId(extractedData.detected_citizen_id);
  return { ...document, extractedData };
}

export function rememberDocumentInsight(result: DocumentScanResult, fileName: string, assessment?: AssessmentResult | null) {
  const extracted = result.extracted_data ?? {};
  const verifiedBenefits = assessment
    ? getVerifiedDocumentBenefits(assessment, [extracted])
    : null;
  const insight: SessionDocumentInsight = {
    id: result.document_id,
    fileName,
    documentType: result.document_type,
    uploadedAt: result.uploaded_at,
    ocrConfidence: result.ocr_confidence,
    extractedData: cleanExtractedData(extracted),
    matchedEquipment: verifiedBenefits?.equipment ?? [],
    eligibleSchemes: verifiedBenefits?.schemes ?? [],
  };
  const memory = readMemory();
  const documentInsights = [...memory.documentInsights.filter((item) => item.id !== insight.id), insight].slice(-20);
  writeMemory({ ...memory, documentInsights });
}

export function getSessionDocumentResults(): Array<{ fileName: string; result: DocumentScanResult }> {
  return readMemory().documentInsights
    .filter((document) => Object.keys(document.extractedData ?? {}).length > 0)
    .map((document) => ({
      fileName: document.fileName,
      result: {
        document_id: document.id,
        uploaded_at: document.uploadedAt,
        document_type: document.documentType,
        extracted_data: document.extractedData,
        masked_preview: {},
        ocr_confidence: document.ocrConfidence,
        message: 'ใช้ข้อมูลใบรับรองแพทย์จาก cache ของเซสชันนี้',
      },
    }));
}

export function forgetDocumentInsight(documentId: string) {
  const memory = readMemory();
  writeMemory({
    ...memory,
    documentInsights: memory.documentInsights.filter((item) => item.id !== documentId),
  });
}

export function hasCarePulseSession() {
  if (typeof window === 'undefined') return false;
  const memory = readMemory();
  return Boolean(memory.assessment || memory.location || memory.documentInsights.length || window.sessionStorage.getItem(LEGACY_ASSESSMENT_KEY));
}

export function clearCarePulseSession() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(LEGACY_SESSION_MEMORY_KEY);
  window.sessionStorage.removeItem(LEGACY_ASSESSMENT_KEY);
  window.dispatchEvent(new Event('carepulse:session-updated'));
}

export function getAiSessionContext(includeFullAssessment: boolean = false): string {
  const memory = readMemory();
  const registry = memory.assessment?.registry_response;
  const lines: string[] = [];

  if (registry) {
    lines.push(`สิทธิหลัก: ${registry.entitlement.scheme_name} (${registry.entitlement.status})`);
    lines.push(`หน่วยบริการประจำ: ${registry.entitlement.primary_provider.name} รหัส ${registry.entitlement.primary_provider.hcode} จังหวัด${registry.entitlement.primary_provider.province}`);
    if (registry.private_policies.length) {
      lines.push(`กรมธรรม์ที่พบ: ${registry.private_policies.map((policy) => `${policy.policy_type === 'HEALTH' ? 'ประกันสุขภาพ' : 'ประกันชีวิต'} ${policy.plan_name} สถานะ ${policy.status} วงเงินสรุป ${policy.sum_insured}`).join(' | ')}`);
    }
    if (registry.benefits.length) lines.push(`ความคุ้มครองพื้นฐาน: ${registry.benefits.map((benefit) => benefit.name).join(', ')}`);
  }

  const documentsForAi = memory.documentInsights.map(documentForAi);
  for (const document of documentsForAi) {
    const certificateData = document.extractedData?.certificate_data;
    const parts = [
      `เอกสาร ${document.fileName} (${document.documentType}, ความมั่นใจในการอ่านข้อความ ${Math.round(document.ocrConfidence * 100)}%)`,
      certificateData ? `ข้อมูลใบรับรองแบบโครงสร้าง: ${JSON.stringify(certificateData)}` : '',
      document.matchedEquipment.length ? `อุปกรณ์ที่อาจเข้าเงื่อนไข: ${document.matchedEquipment.map((item) => `${item.item} — ${item.agency}`).join(', ')}` : '',
      document.eligibleSchemes.length ? `สิทธิเสริมที่อาจเกี่ยวข้อง: ${document.eligibleSchemes.map((item) => `${item.scheme} — ${item.agency}`).join(', ')}` : '',
    ].filter(Boolean);
    lines.push(parts.join('\n'));
  }

  if (!lines.length && (!includeFullAssessment || !memory.assessment)) return '';
  const context = [
    'บริบทชั่วคราวจากช่วงการใช้งาน CarePulse ของผู้ใช้:',
    ...lines,
    'ใช้บริบทนี้เพื่ออธิบายและจัดลำดับทางเลือกเท่านั้น ห้ามเปลี่ยนสถานะสิทธิ ห้ามแต่งข้อมูลที่ไม่มี และต้องแนะนำให้ยืนยันกับหน่วยงานเจ้าของสิทธิก่อนใช้จริง',
  ];

  if (includeFullAssessment && memory.assessment) {
    context.push(
      'ข้อมูลผลตรวจทั้งหมดที่ดึงมาในเซสชันนี้ (ใช้ตอบคำถามนี้เท่านั้น; เลขบัตรและข้อมูลระบุตัวตนถูกปกปิดแล้ว):',
      JSON.stringify({
        assessment: memory.assessment,
        scanned_documents: documentsForAi,
      }, null, 2),
    );
  }

  return context.join('\n');
}
