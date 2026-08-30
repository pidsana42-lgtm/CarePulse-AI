import type { AssessmentResult, HealthcareRightDetail, OfficialReference } from '@/types';

export interface VerifiedDocumentEquipment {
  item: string;
  agency: string;
  cost_saved: string;
  how_to_claim: string;
  matched_right?: string;
  match_reason?: string;
}

export interface VerifiedDocumentScheme {
  scheme: string;
  agency: string;
  benefit: string;
  contact: string;
}

interface DocumentExtractedData {
  detected_conditions?: string[];
  matched_equipment?: VerifiedDocumentEquipment[];
  eligible_schemes?: VerifiedDocumentScheme[];
}

function isConfirmedRight(right: HealthcareRightDetail) {
  return right.is_eligible && right.eligibility_status !== 'needs_review' && right.eligibility_status !== 'not_matched';
}

function rightMatchesDocument(right: HealthcareRightDetail, signals: string) {
  switch (right.scheme_code) {
    case 'LTC':
      return /ดูแลระยะยาว|ภาวะพึ่งพิง|ติดบ้าน|ติดเตียง|adl|ผู้ช่วยดูแล/i.test(signals);
    case 'UCS-DIAPER':
      return /ผ้าอ้อม|แผ่นรอง|กลั้น|ขับถ่าย/i.test(signals);
    case 'DISABILITY-AID':
      return /รถเข็น|wheelchair|กายอุปกรณ์|เครื่องช่วย|เตียงผู้ป่วย|ที่นอนลม|เคลื่อนไหว/i.test(signals);
    default:
      return false;
  }
}

function equipmentMatchesRights(item: string, rightCodes: Set<string>) {
  if (/ผ้าอ้อม|แผ่นรอง|ขับถ่าย/i.test(item)) return rightCodes.has('UCS-DIAPER');
  if (/รถเข็น|wheelchair|กายอุปกรณ์|เครื่องช่วย|เตียงผู้ป่วย|ที่นอนลม/i.test(item)) return rightCodes.has('DISABILITY-AID');
  return false;
}

function equipmentRightCode(item: string) {
  if (/ผ้าอ้อม|แผ่นรอง|ขับถ่าย/i.test(item)) return 'UCS-DIAPER';
  if (/รถเข็น|wheelchair|กายอุปกรณ์|เครื่องช่วย|เตียงผู้ป่วย|ที่นอนลม/i.test(item)) return 'DISABILITY-AID';
  return null;
}

function documentReasonForEquipment(item: string) {
  if (/ผ้าอ้อม|แผ่นรอง|ขับถ่าย/i.test(item)) {
    return 'เอกสารมีข้อมูลภาวะพึ่งพิงหรือความจำเป็นด้านการขับถ่าย';
  }
  if (/รถเข็น|wheelchair/i.test(item)) {
    return 'เอกสารมีข้อมูลข้อจำกัดด้านการเคลื่อนไหวหรือความจำเป็นในการใช้รถเข็น';
  }
  if (/เตียงผู้ป่วย|ที่นอนลม/i.test(item)) {
    return 'เอกสารมีข้อมูลภาวะติดเตียงหรือความเสี่ยงจากการนอนเป็นเวลานาน';
  }
  return 'เอกสารมีข้อมูลความจำเป็นด้านกายอุปกรณ์';
}

export function getVerifiedDocumentBenefits(
  assessment: AssessmentResult,
  extractedItems: DocumentExtractedData[],
) {
  const equipmentCandidates = extractedItems.flatMap((item) => item.matched_equipment ?? []);
  const signals = [
    ...extractedItems.flatMap((item) => item.detected_conditions ?? []),
    ...equipmentCandidates.map((item) => item.item),
  ].join(' ');

  const additionalRights = assessment.additional_rights
    .filter(isConfirmedRight)
    .filter((right) => rightMatchesDocument(right, signals));
  const additionalRightCodes = new Set(additionalRights.map((right) => right.scheme_code));

  const equipment = Array.from(new Map(
    equipmentCandidates
      .filter((item) => equipmentMatchesRights(item.item, additionalRightCodes))
      .map((item) => {
        const matchedRight = additionalRights.find((right) => right.scheme_code === equipmentRightCode(item.item));
        return {
          ...item,
          agency: matchedRight?.responsible_agency ?? item.agency,
          how_to_claim: matchedRight?.how_to_use ?? item.how_to_claim,
          matched_right: matchedRight?.scheme_name,
          match_reason: matchedRight
            ? `${documentReasonForEquipment(item.item)} และผลตรวจสิทธิยืนยันว่า “${matchedRight.scheme_name}” ใช้งานได้`
            : undefined,
        };
      })
      .map((item) => [`${item.item}-${item.agency}`, item]),
  ).values());

  const schemes: VerifiedDocumentScheme[] = additionalRights.map((right) => ({
    scheme: right.scheme_name,
    agency: right.responsible_agency ?? 'หน่วยงานเจ้าของสิทธิ',
    benefit: right.coverage_summary,
    contact: right.contact_channel ?? right.how_to_use,
  }));

  const referenceRights = [
    ...(isConfirmedRight(assessment.primary_right) ? [assessment.primary_right] : []),
    ...additionalRights,
  ];
  const references: OfficialReference[] = Array.from(new Map(
    referenceRights
      .flatMap((right) => right.official_references ?? [])
      .map((reference) => [reference.url || `${reference.title}-${reference.agency}`, reference]),
  ).values());

  return {
    primaryRight: isConfirmedRight(assessment.primary_right) ? assessment.primary_right : null,
    additionalRights,
    equipment,
    schemes,
    references,
  };
}
