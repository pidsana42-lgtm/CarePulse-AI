import type { AssessmentResult, DocumentScanResult } from '@/types';

const SESSION_KEY = 'carepulse_session_memory_v1';
const LEGACY_ASSESSMENT_KEY = 'latest_assessment_result';

interface SessionDocumentInsight {
  id: string;
  fileName: string;
  documentType: string;
  uploadedAt: string;
  ocrConfidence: number;
  clinicalSummary?: string;
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
  version: 1;
  startedAt: string;
  updatedAt: string;
  assessment?: AssessmentResult;
  location?: SessionLocation;
  documentInsights: SessionDocumentInsight[];
}

function emptyMemory(): CarePulseSessionMemory {
  const now = new Date().toISOString();
  return { version: 1, startedAt: now, updatedAt: now, documentInsights: [] };
}

function readMemory(): CarePulseSessionMemory {
  if (typeof window === 'undefined') return emptyMemory();
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return emptyMemory();
  try {
    const parsed = JSON.parse(raw) as CarePulseSessionMemory;
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

export function rememberDocumentInsight(result: DocumentScanResult, fileName: string) {
  const extracted = result.extracted_data ?? {};
  const insight: SessionDocumentInsight = {
    id: result.document_id,
    fileName,
    documentType: result.document_type,
    uploadedAt: result.uploaded_at,
    ocrConfidence: result.ocr_confidence,
    clinicalSummary: typeof extracted.ai_clinical_summary === 'string' ? extracted.ai_clinical_summary : undefined,
    matchedEquipment: Array.isArray(extracted.matched_equipment) ? extracted.matched_equipment : [],
    eligibleSchemes: Array.isArray(extracted.eligible_schemes) ? extracted.eligible_schemes : [],
  };
  const memory = readMemory();
  const documentInsights = [...memory.documentInsights.filter((item) => item.id !== insight.id), insight].slice(-20);
  writeMemory({ ...memory, documentInsights });
}

export function hasCarePulseSession() {
  if (typeof window === 'undefined') return false;
  const memory = readMemory();
  return Boolean(memory.assessment || memory.location || memory.documentInsights.length || window.sessionStorage.getItem(LEGACY_ASSESSMENT_KEY));
}

export function clearCarePulseSession() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_KEY);
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

  for (const document of memory.documentInsights) {
    const parts = [
      `เอกสาร ${document.fileName} (${document.documentType}, ความมั่นใจในการอ่านข้อความ ${Math.round(document.ocrConfidence * 100)}%)`,
      document.clinicalSummary ? `สรุป: ${document.clinicalSummary}` : '',
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
        scanned_documents: memory.documentInsights,
      }, null, 2),
    );
  }

  return context.join('\n');
}
