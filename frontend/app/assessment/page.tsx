'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, BadgeCheck, CheckCircle2, ChevronRight, Database, ExternalLink, FileUp, Loader2, LockKeyhole, Phone, Search, UserRound } from 'lucide-react';
import { lookupMockRegistry, reviewDocumentText, submitAssessment, uploadDocument } from '@/lib/api';
import { assessMockEligibility } from '@/lib/mock-eligibility';
import { AssessmentInput, AssessmentResult, DocumentScanResult } from '@/types';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { getSessionDocumentResults, getSessionAssessment, getSessionLocation, rememberDocumentInsight, setSessionAssessment, setSessionLocation } from '@/lib/session-memory';

function documentNameParts(extracted: DocumentScanResult['extracted_data']) {
  const certificate = extracted.certificate_data && typeof extracted.certificate_data === 'object'
    ? extracted.certificate_data as Record<string, unknown>
    : {};
  let firstName = String(
    extracted.detected_patient_first_name
    ?? certificate.patient_first_name
    ?? '',
  ).trim();
  let lastName = String(
    extracted.detected_patient_last_name
    ?? certificate.patient_last_name
    ?? '',
  ).trim();

  if (!firstName && !lastName) {
    const fullName = String(extracted.detected_patient_name ?? certificate.patient_name ?? '')
      .replace(/^(นาย|นางสาว|นาง|เด็กชาย|เด็กหญิง)\s*/, '')
      .trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    firstName = parts[0] ?? '';
    lastName = parts.slice(1).join(' ');
  }

  return { firstName, lastName };
}

function mergeDocumentData(
  current: AssessmentInput,
  extracted: DocumentScanResult['extracted_data'],
): AssessmentInput {
  const { firstName, lastName } = documentNameParts(extracted);
  const certificate = extracted.certificate_data && typeof extracted.certificate_data === 'object'
    ? extracted.certificate_data as Record<string, unknown>
    : {};
  const citizenId = String(extracted.detected_citizen_id ?? certificate.citizen_id ?? '').replace(/\D/g, '');
  const diagnoses = Array.isArray(certificate.diagnoses)
    ? certificate.diagnoses.map(String).map((item) => item.trim()).filter(Boolean)
    : Array.isArray(extracted.detected_conditions)
      ? extracted.detected_conditions.map(String).map((item) => item.trim()).filter(Boolean)
      : [];
  const detectedAge = Number(extracted.detected_age);

  return {
    ...current,
    full_name: [firstName, lastName].filter(Boolean).join(' ') || current.full_name,
    citizen_id: citizenId.length === 13 ? citizenId : current.citizen_id,
    age: Number.isInteger(detectedAge) && detectedAge > 0 ? detectedAge : current.age,
    chronic_conditions: diagnoses.length ? diagnoses : current.chronic_conditions,
    daily_living: extracted.suggested_daily_living ?? current.daily_living,
    has_mobility_limitation: Boolean(extracted.has_mobility_limitation ?? current.has_mobility_limitation),
    has_incontinence: Boolean(extracted.has_incontinence ?? current.has_incontinence),
    has_disability_card: Boolean(extracted.has_disability_card ?? current.has_disability_card),
    needs_equipment: Array.isArray(extracted.suggested_needs_equipment)
      ? extracted.suggested_needs_equipment.map(String)
      : current.needs_equipment,
  };
}

type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';
type DocumentInputMode = 'manual' | 'upload';

const emptyForm: AssessmentInput = {
  citizen_id: '',
  full_name: '',
  age: 0,
  occupation_status: 'unknown',
  registered_province: 'รอตำแหน่งผู้ใช้',
  has_disability_card: false,
  chronic_conditions: [],
  urgency_level: 'normal',
  current_health_scheme: 'unknown',
  daily_living: 'independent',
  has_mobility_limitation: false,
  has_incontinence: false,
  needs_equipment: [],
  consent_to_assess: false,
};

type GatewayCode = 'NHSO' | 'MSDHS' | 'OIC' | 'CGD';

interface GatewayBenefitGuide {
  code: GatewayCode;
  agency: string;
  detail: string;
  title: string;
  eligibility: string;
  owner: string;
  benefits: string[];
  limitations: string[];
  hotline: string;
  sourceLabel: string;
  sourceUrl: string;
}

const gateways: GatewayBenefitGuide[] = [
  {
    code: 'NHSO',
    agency: 'สปสช.',
    detail: 'สิทธิหลักประกันสุขภาพ (บัตรทอง)',
    title: 'สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง 30 บาท)',
    eligibility: 'คนไทยที่ไม่มีสิทธิประกันสังคมหรือสวัสดิการรักษาพยาบาลอื่นของรัฐ และมีสถานะสิทธิบัตรทองในระบบ สปสช.',
    owner: 'สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)',
    benefits: [
      'ตรวจ วินิจฉัย และรักษาโรคทั่วไป โรคเรื้อรัง และโรคค่าใช้จ่ายสูงตามข้อบ่งชี้',
      'ผู้ป่วยนอก ผู้ป่วยใน ผ่าตัด และการส่งต่อตามระบบบริการ',
      'ยาและเวชภัณฑ์ตามบัญชียาหลักแห่งชาติ รวมถึงบริการฟื้นฟูสมรรถภาพ',
      'บริการสร้างเสริมสุขภาพ วัคซีน และตรวจคัดกรองโรคตามช่วงวัย',
      'ฝากครรภ์ คลอดบุตร ดูแลหลังคลอด และบริการทันตกรรมพื้นฐาน',
      'ฟอกไต ล้างไตทางช่องท้อง เคมีบำบัด รังสีรักษา และบริการมะเร็งตามเกณฑ์',
      'เจ็บป่วยฉุกเฉินวิกฤต ใช้ UCEP ได้ทุกโรงพยาบาลตามเงื่อนไข',
      'ใช้บัตรประชาชนรับบริการ 30 บาทรักษาทุกที่ ณ หน่วยบริการที่เข้าร่วม',
    ],
    limitations: [
      'ต้องยืนยันสถานะสิทธิและหน่วยบริการประจำก่อนรับบริการ',
      'โรงพยาบาลเอกชนนอกเครือข่ายไม่ครอบคลุม ยกเว้นกรณีฉุกเฉินหรือมีการส่งตัวตามเกณฑ์',
      'บริการเพื่อความสวยงามหรือบริการที่ไม่มีข้อบ่งชี้ทางการแพทย์ไม่อยู่ในชุดสิทธิ',
      'ยา หัตถการ และอุปกรณ์บางรายการมีเกณฑ์อนุมัติหรืออาจมีส่วนเกินที่ต้องชำระเอง',
    ],
    hotline: 'สายด่วน สปสช. 1330',
    sourceLabel: 'คู่มือใช้สิทธิบัตรทอง ปี 2569',
    sourceUrl: 'https://media.nhso.go.th/assets/portals/1/files/UC_69_final.pdf',
  },
  {
    code: 'MSDHS',
    agency: 'พม.',
    detail: 'สวัสดิการเด็ก ผู้สูงอายุ คนพิการ และครอบครัว',
    title: 'สิทธิสวัสดิการสังคม กระทรวง พม.',
    eligibility: 'เด็ก ผู้สูงอายุ คนพิการ ผู้มีรายได้น้อย หรือผู้ประสบปัญหาทางสังคมที่ผ่านเกณฑ์ของแต่ละโครงการ',
    owner: 'กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม.)',
    benefits: [
      'เบี้ยความพิการและบริการช่วยเหลือสำหรับผู้มีบัตรประจำตัวคนพิการที่ขึ้นทะเบียนแล้ว',
      'บริการฟื้นฟู พัฒนาศักยภาพ ฝึกอาชีพ และกู้ยืมทุนประกอบอาชีพสำหรับคนพิการตามเกณฑ์',
      'เบี้ยยังชีพผู้สูงอายุสำหรับผู้มีคุณสมบัติและลงทะเบียนกับองค์กรปกครองส่วนท้องถิ่น',
      'เงินอุดหนุนเพื่อการเลี้ยงดูเด็กแรกเกิดสำหรับครัวเรือนที่ผ่านเกณฑ์โครงการ',
      'การคุ้มครองเด็ก ครอบครัว ผู้สูงอายุ และผู้ถูกกระทำความรุนแรง พร้อมประสานที่พักฉุกเฉิน',
      'การช่วยเหลือผู้ประสบปัญหาทางสังคมเป็นรายกรณี หลังนักสังคมสงเคราะห์ประเมินข้อเท็จจริง',
    ],
    limitations: [
      'แต่ละสวัสดิการเป็นคนละโครงการ ไม่ได้เกิดสิทธิพร้อมกันทั้งหมด',
      'ต้องตรวจคุณสมบัติ อายุ รายได้ ทะเบียนบ้าน บัตรคนพิการ หรือเอกสารเฉพาะของโครงการ',
      'บางรายการต้องลงทะเบียนล่วงหน้า ผ่านการประเมิน และขึ้นอยู่กับรอบงบประมาณหรือพื้นที่',
      'สวัสดิการของ พม. ไม่ใช่สิทธิรักษาพยาบาลหลัก ต้องใช้ร่วมกับสิทธิสุขภาพที่มีอยู่',
    ],
    hotline: 'ศูนย์ช่วยเหลือสังคม พม. 1300',
    sourceLabel: 'พม. Connect — ข้อมูลสวัสดิการและบริการ',
    sourceUrl: 'https://connect.m-society.go.th/homepage/',
  },
  {
    code: 'OIC',
    agency: 'คปภ.',
    detail: 'ความคุ้มครองตามกรมธรรม์ประกันภัย',
    title: 'สิทธิผู้เอาประกันภัยภายใต้การกำกับของ คปภ.',
    eligibility: 'ผู้เอาประกันภัย ผู้รับประโยชน์ หรือผู้มีสิทธิเรียกร้องตามกรมธรรม์ที่ยังมีผลบังคับและเข้าเงื่อนไขความคุ้มครอง',
    owner: 'สำนักงานคณะกรรมการกำกับและส่งเสริมการประกอบธุรกิจประกันภัย (คปภ.)',
    benefits: [
      'ค่ารักษาพยาบาลผู้ป่วยนอกหรือผู้ป่วยในตามวงเงินและเงื่อนไขที่ระบุในกรมธรรม์',
      'ความคุ้มครองอุบัติเหตุ โรคร้ายแรง ทุพพลภาพ หรือการเสียชีวิตตามสัญญา',
      'บริการไม่ต้องสำรองจ่ายในสถานพยาบาลเครือข่าย เมื่อกรมธรรม์และแผนรองรับ',
      'ยื่นเคลมสินไหม รับเงินชดเชย หรือรับผลประโยชน์ครบสัญญาตามประเภทกรมธรรม์',
      'ขอคำปรึกษา ร้องเรียน และเข้าสู่กระบวนการไกล่เกลี่ยข้อพิพาทด้านประกันภัย',
      'ตรวจสอบข้อมูลกรมธรรม์และสถานะตัวแทนหรือนายหน้าผ่านบริการของ คปภ.',
    ],
    limitations: [
      'คปภ. เป็นหน่วยงานกำกับ ไม่ได้ชำระค่ารักษาแทนบริษัทประกันภัยโดยตรง',
      'ความคุ้มครองจริงยึดข้อกำหนด ข้อยกเว้น ระยะรอคอย วงเงิน และสถานะเบี้ยของแต่ละกรมธรรม์',
      'โรคที่เป็นมาก่อน การรักษานอกเครือข่าย หรือบริการที่ไม่จำเป็นทางการแพทย์อาจไม่คุ้มครอง',
      'ควรขออนุมัติก่อนรักษาหรือสอบถามบริษัทประกันเมื่อเป็นการรักษาที่มีค่าใช้จ่ายสูง',
    ],
    hotline: 'สายด่วนประกันภัย คปภ. 1186',
    sourceLabel: 'สำนักงาน คปภ.',
    sourceUrl: 'https://www.oic.or.th/',
  },
  {
    code: 'CGD',
    agency: 'ข้าราชการ',
    detail: 'สวัสดิการรักษาพยาบาลกรมบัญชีกลาง',
    title: 'สวัสดิการรักษาพยาบาลข้าราชการ',
    eligibility: 'ข้าราชการ ลูกจ้างประจำ ผู้รับเบี้ยหวัดหรือบำนาญ และบุคคลในครอบครัวที่มีชื่อในฐานข้อมูลบุคลากรภาครัฐตามกฎหมาย',
    owner: 'กรมบัญชีกลาง กระทรวงการคลัง',
    benefits: [
      'ตรวจรักษาโรคทั่วไป โรคเรื้อรัง ผู้ป่วยนอก และผู้ป่วยในในสถานพยาบาลของรัฐ',
      'ใช้ระบบเบิกจ่ายตรงด้วยบัตรประชาชน ณ สถานพยาบาลที่รองรับ โดยไม่ต้องสำรองจ่ายในรายการที่เบิกได้',
      'ครอบคลุมผู้มีสิทธิและบุคคลในครอบครัวที่ลงทะเบียนถูกต้องในฐานข้อมูลบุคลากรภาครัฐ',
      'เบิกค่ายา เวชภัณฑ์ อวัยวะเทียม อุปกรณ์ และบริการทางการแพทย์ตามอัตราและหลักเกณฑ์',
      'เบิกค่าห้อง ค่าอาหาร และค่ารักษาผู้ป่วยในตามเพดานที่กรมบัญชีกลางกำหนด',
      'ใช้บริการโรงพยาบาลเอกชนเฉพาะกรณีหรือโครงการที่กรมบัญชีกลางกำหนด',
    ],
    limitations: [
      'ต้องมีสถานะผู้มีสิทธิในฐานข้อมูลบุคลากรภาครัฐและยืนยันตัวตนก่อนใช้เบิกจ่ายตรง',
      'รายการนอกบัญชีหรือเกินอัตราเบิก เช่น ค่าห้องพิเศษส่วนเกิน อาจต้องชำระเอง',
      'โรงพยาบาลเอกชนเบิกได้เฉพาะกรณีฉุกเฉินหรือโครงการที่เข้าร่วมตามหลักเกณฑ์',
      'ยาบางกลุ่มและการรักษาค่าใช้จ่ายสูงต้องเป็นไปตามข้อบ่งชี้หรือขออนุมัติตามระบบ',
    ],
    hotline: 'กรมบัญชีกลาง 0 2270 6400',
    sourceLabel: 'ข้อมูลสวัสดิการรักษาพยาบาล กรมบัญชีกลาง',
    sourceUrl: 'https://www.cgd.go.th/cs/internet/internet/%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5.html?page_locale=th_TH',
  },
];

const loadingStages = [
  'กำลังยืนยันข้อมูลผู้ใช้งาน',
  'กำลังตรวจสิทธิจากหน่วยงานภาครัฐ',
  'กำลังค้นหากรมธรรม์และความคุ้มครอง',
  'กำลังรวมผลและเตรียมคำแนะนำ',
];

export default function AssessmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AssessmentInput>(emptyForm);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [documentLoading, setDocumentLoading] = useState(false);
  const [medicalDocument, setMedicalDocument] = useState<{ fileName: string; result: DocumentScanResult } | null>(null);
  const [documentError, setDocumentError] = useState('');
  const [documentReviewText, setDocumentReviewText] = useState('');
  const [documentReviewing, setDocumentReviewing] = useState(false);
  const [documentAssessment, setDocumentAssessment] = useState<AssessmentResult | null>(null);
  const [documentAssessmentLoading, setDocumentAssessmentLoading] = useState(false);
  const [documentAssessmentError, setDocumentAssessmentError] = useState('');
  const [documentInputMode, setDocumentInputMode] = useState<DocumentInputMode>('manual');
  const [selectedGatewayCode, setSelectedGatewayCode] = useState<GatewayCode | null>(null);
  const selectedGateway = gateways.find((gateway) => gateway.code === selectedGatewayCode) ?? null;
  const showIdentityFields = documentInputMode === 'manual' || Boolean(medicalDocument);
  const benefitGuideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }
    const timer = window.setInterval(() => {
      setLoadingStage((current) => Math.min(current + 1, loadingStages.length - 1));
    }, 450);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (getSessionLocation()) setLocationStatus('success');
    const cachedAssessment = getSessionAssessment();
    if (cachedAssessment) setDocumentAssessment(cachedAssessment);
    const cachedDocument = getSessionDocumentResults().at(-1);
    if (cachedDocument) {
      const extracted = cachedDocument.result.extracted_data ?? {};
      const names = documentNameParts(extracted);
      setDocumentInputMode('upload');
      setMedicalDocument(cachedDocument);
      setFirstName(names.firstName);
      setLastName(names.lastName);
      setFormData((current) => mergeDocumentData(current, extracted));
    }
  }, []);

  useEffect(() => {
    if (!selectedGateway) return;

    window.requestAnimationFrame(() => {
      benefitGuideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [selectedGateway]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSessionLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setLocationStatus('success');
      },
      (locationError) => {
        setLocationStatus(locationError.code === locationError.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const runDocumentAssessment = async (
    document: { fileName: string; result: DocumentScanResult },
    input: AssessmentInput,
  ) => {
    if (!input.consent_to_assess || documentAssessmentLoading) return;
    setDocumentAssessmentLoading(true);
    setDocumentAssessmentError('');
    try {
      const [registryResponse, engineAssessment] = await Promise.all([
        lookupMockRegistry(input),
        submitAssessment(input),
      ]);
      const rulesAssessment = assessMockEligibility(input, registryResponse);
      const assessment: AssessmentResult = {
        ...rulesAssessment,
        cost_planning: engineAssessment.cost_planning,
      };
      setDocumentAssessment(assessment);
      setSessionAssessment(assessment);
      rememberDocumentInsight(document.result, document.fileName, assessment);
    } catch (assessmentError) {
      setDocumentAssessmentError(
        assessmentError instanceof Error
          ? assessmentError.message
          : 'ไม่สามารถประเมินสิทธิจากเอกสารได้',
      );
    } finally {
      setDocumentAssessmentLoading(false);
    }
  };

  const handleConsentChange = (consented: boolean) => {
    const nextForm = { ...formData, consent_to_assess: consented };
    setFormData(nextForm);
    if (consented && locationStatus !== 'success' && locationStatus !== 'loading') {
      requestLocation();
    }
    if (consented && medicalDocument) {
      void runDocumentAssessment(medicalDocument, nextForm);
    }
  };

  const useDemoData = () => {
    setDocumentInputMode('manual');
    setFormData({
      ...emptyForm,
      citizen_id: '1111111111111',
      full_name: 'สมชาย ตัวอย่าง',
      consent_to_assess: true,
    });
    setFirstName('สมชาย');
    setLastName('ตัวอย่าง');
    setMedicalDocument(null);
    setDocumentReviewText('');
    setDocumentError('');
    setError('');
  };

  const useCivilServantDemoData = () => {
    setDocumentInputMode('manual');
    setFormData({
      ...emptyForm,
      citizen_id: '1111111111117',
      full_name: 'อรุณี ข้าราชการตัวอย่าง',
      consent_to_assess: true,
    });
    setFirstName('อรุณี');
    setLastName('ข้าราชการตัวอย่าง');
    setMedicalDocument(null);
    setDocumentReviewText('');
    setDocumentError('');
    setError('');
  };

  const handleMedicalDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || documentLoading) return;

    if (file.size > 10 * 1024 * 1024) {
      setDocumentError('ไฟล์ต้องมีขนาดไม่เกิน 10 เมกะไบต์');
      return;
    }

    setDocumentLoading(true);
    setDocumentError('');
    try {
      const result = await uploadDocument(file, 'medical_certificate');
      const extracted = result.extracted_data ?? {};
      const names = documentNameParts(extracted);
      const nextForm = mergeDocumentData(formData, extracted);
      const document = { fileName: file.name, result };
      setDocumentInputMode('upload');
      setFirstName(names.firstName);
      setLastName(names.lastName);
      setFormData(nextForm);
      setMedicalDocument(document);
      rememberDocumentInsight(result, file.name);
      setDocumentReviewText('');
      if (nextForm.consent_to_assess) {
        await runDocumentAssessment(document, nextForm);
      }
    } catch (scanError) {
      setDocumentError(scanError instanceof Error ? scanError.message : 'ไม่สามารถอ่านใบรับรองแพทย์ได้');
    } finally {
      setDocumentLoading(false);
    }
  };

  const selectDocumentInputMode = (mode: DocumentInputMode) => {
    setDocumentInputMode(mode);
    setDocumentError('');
    if (mode === 'manual') {
      setMedicalDocument(null);
      setDocumentReviewText('');
    }
  };

  const applyReviewedDocumentText = async () => {
    if (!medicalDocument || !documentReviewText.trim() || documentReviewing) {
      if (!documentReviewText.trim()) setDocumentError('กรุณาพิมพ์หรือตรวจแก้ข้อความจากเอกสารก่อนเติมข้อมูลใหม่');
      return;
    }

    setDocumentReviewing(true);
    setDocumentError('');
    try {
      const reviewedResult = await reviewDocumentText(
        medicalDocument.fileName,
        medicalDocument.result.document_type,
        documentReviewText.trim(),
      );
      const extracted = reviewedResult.extracted_data ?? {};
      const names = documentNameParts(extracted);
      const nextForm = mergeDocumentData(formData, extracted);
      const document = { fileName: medicalDocument.fileName, result: reviewedResult };
      setFirstName(names.firstName);
      setLastName(names.lastName);
      setFormData(nextForm);
      setMedicalDocument(document);
      rememberDocumentInsight(reviewedResult, medicalDocument.fileName);
      setDocumentReviewText('');
      if (nextForm.consent_to_assess) {
        await runDocumentAssessment(document, nextForm);
      }
    } catch (reviewError) {
      setDocumentError(reviewError instanceof Error ? reviewError.message : 'ไม่สามารถนำข้อความที่แก้ไขมาเติมแบบฟอร์มได้');
    } finally {
      setDocumentReviewing(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.consent_to_assess || loading) return;

    setError('');
    setLoading(true);
    try {
      const [registryResponse, engineAssessment] = await Promise.all([
        lookupMockRegistry(formData),
        submitAssessment(formData),
        new Promise((resolve) => window.setTimeout(resolve, 1800)),
      ]);
      const result: AssessmentResult = {
        ...assessMockEligibility(formData, registryResponse),
        cost_planning: engineAssessment.cost_planning,
      };
      setSessionAssessment(result);
      if (medicalDocument) {
        rememberDocumentInsight(medicalDocument.result, medicalDocument.fileName, result);
      }
      router.push('/results');
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'ไม่สามารถเชื่อมระบบตรวจสิทธิได้');
      setLoading(false);
    }
  };

  return (
    <div className="apple-page relative min-h-screen overflow-x-clip">
      {loading && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-[#072b77]/75 px-4">
          <div className="pointer-events-none absolute -left-24 top-1/4 size-80 rounded-full bg-cyan-500 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-1/4 size-80 rounded-full bg-cyan-400 blur-3xl" />

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 text-center sm:p-8">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-cyan-500/35 blur-3xl" />

            <div className="relative mx-auto size-24">
              <div className="absolute inset-0 rounded-full border border-cyan-100 bg-cyan-50" />
              <div className="absolute inset-1 animate-spin rounded-full border-[3px] border-cyan-100 border-r-cyan-500 border-t-cyan-600" />
              <div className="absolute inset-3 animate-[spin_2.4s_linear_infinite_reverse] rounded-full border border-dashed border-cyan-600/70" />
              <Database className="absolute inset-0 m-auto size-7 text-cyan-800" />
            </div>

            <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-cyan-700">กำลังประมวลผล</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">{loadingStages[loadingStage]}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">เก็บข้อมูลแบบ JSON ไว้ชั่วคราวเฉพาะเซสชันของแท็บนี้ และปกปิดเลขบัตรเมื่อส่งบริบทให้ AI</p>

            <div className="mt-6 h-2 overflow-hidden rounded-full border border-white bg-slate-200/55 p-0.5 shadow-inner">
              <div className="h-full rounded-full bg-linear-to-r from-cyan-700 via-cyan-600 to-cyan-500 shadow-[0_0_18px_rgba(0,242,246,0.7)] transition-all duration-500" style={{ width: `${((loadingStage + 1) / loadingStages.length) * 100}%` }} />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {gateways.map((gateway, index) => (
                <div key={gateway.code} className={`flex items-center justify-center gap-1 rounded-xl border px-1 py-2 text-sm font-black transition ${index <= loadingStage ? 'border-cyan-200 bg-cyan-50/90 text-cyan-800 shadow-sm' : 'border-white/80 bg-white/35 text-slate-400'}`}>
                  {index <= loadingStage ? <CheckCircle2 className="size-3" /> : <span className="size-1.5 rounded-full bg-slate-300" />}
                  <span>{gateway.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="apple-headline text-4xl sm:text-6xl lg:text-[68px]">
            กรอกครั้งเดียว<br />
            <span className="text-[#115af2]">เห็นสิทธิของคุณในที่เดียว</span>
          </h1>
          <p className="apple-subhead mx-auto mt-5 max-w-2xl text-base sm:text-xl">
            ตรวจสอบสิทธิประโยชน์ทางการแพทย์ของคุณ ทั้งบัตรทอง ประกันสังคม สวัสดิการข้าราชการและกรมธรรม์ พร้อมประมาณค่ารักษาพยาบาลล่วงหน้า เพื่อวางแผนการเงินด้านสุขภาพของคุณและครอบครัวอย่างมั่นใจ
          </p>
        </div>

        <div className="mx-auto mt-14 grid w-full border-y border-black/9 lg:grid-cols-[1.08fr_.92fr]">
          <form onSubmit={handleSubmit} className="py-9 lg:border-r lg:border-black/9 lg:pr-12 sm:py-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#e8f1ff] text-[#115af2]"><UserRound className="size-5" /></span>
                <div>
                  <p className="apple-eyebrow">เริ่มตรวจสอบสิทธิ</p>
                  <h2 className="text-xl font-semibold text-[#1d1d1f]">ข้อมูลจากบัตรประชาชน</h2>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-1 text-left sm:items-end sm:text-right">
                <button type="button" onClick={useCivilServantDemoData} className="text-sm cursor-pointer font-semibold text-[#115af2] hover:underline">
                  ตัวอย่างสิทธิข้าราชการ
                </button>
                <button type="button" onClick={useDemoData} className="text-sm cursor-pointer font-semibold text-[#115af2] hover:underline">
                  ตัวอย่างสิทธิประชาชนทั่วไป
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#1d1d1f]">เลือกวิธีกรอกข้อมูล</p>
                <div role="radiogroup" aria-label="เลือกวิธีกรอกข้อมูล" className="grid grid-cols-2 gap-1 rounded-2xl bg-[#f2f4f7] p-1">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={documentInputMode === 'manual'}
                    disabled={documentLoading}
                    onClick={() => selectDocumentInputMode('manual')}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#115af2]/15 disabled:cursor-wait disabled:opacity-60 ${documentInputMode === 'manual' ? 'bg-white text-[#115af2] shadow-sm' : 'text-[#667085] hover:bg-white/60 hover:text-[#344054]'}`}
                  >
                    <UserRound className="size-4" />
                    พิมพ์ข้อมูลเอง
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={documentInputMode === 'upload'}
                    disabled={documentLoading}
                    onClick={() => selectDocumentInputMode('upload')}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#115af2]/15 disabled:cursor-wait disabled:opacity-60 ${documentInputMode === 'upload' ? 'bg-white text-[#115af2] shadow-sm' : 'text-[#667085] hover:bg-white/60 hover:text-[#344054]'}`}
                  >
                    <FileUp className="size-4" />
                    ใช้ใบรับรองแพทย์
                  </button>
                </div>
                {documentInputMode === 'manual' && (
                  <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">กรอกชื่อ–นามสกุลและเลขบัตรประชาชนในช่องด้านล่าง</p>
                )}
                {documentInputMode === 'upload' && (
                  <div>
                    <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">แนบรูปใบรับรองแพทย์หรือเอกสารทางการแพทย์</p>
                  </div>
                )}
              </div>

              {documentInputMode === 'upload' && !medicalDocument && (
                <div>
                  <label className={`relative flex min-h-40 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-5 py-6 text-center transition focus-within:ring-4 focus-within:ring-[#115af2]/10 ${documentLoading ? 'cursor-wait border-cyan-900 bg-cyan-50 text-[#115af2]' : 'border-[#115af2]/35 bg-[#f7faff] hover:border-cyan-800 hover:bg-white'}`}>
                    <input type="file" accept="image/*,.pdf" disabled={documentLoading} onChange={handleMedicalDocument} className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait" />
                    <span className="flex size-12 items-center justify-center rounded-full bg-white text-[#115af2] shadow-sm">
                      {documentLoading ? <Loader2 className="size-6 animate-spin" /> : <FileUp className="size-6" />}
                    </span>
                    <span className="mt-3 text-base font-semibold text-[#1d1d1f]">
                      {documentLoading ? 'AI กำลังอ่านเอกสาร...' : 'คลิกเพื่อแนบใบรับรองแพทย์'}
                    </span>
                    <span className="mt-1 text-sm leading-relaxed text-[#6e6e73]">
                      {documentLoading ? 'กรุณารอสักครู่ ระบบจะเติมข้อมูลให้อัตโนมัติ' : 'รองรับไฟล์ JPG, PNG หรือ PDF ขนาดไม่เกิน 10 MB'}
                    </span>
                  </label>

                  {documentError && <p role="alert" className="mt-3 text-xs font-semibold text-rose-700">{documentError}</p>}
                  <p className="mt-3 text-xs leading-relaxed text-red-600">* ระบบสาธิตควรใช้เอกสารตัวอย่างเท่านั้น ข้อมูลจาก AI อาจมีข้อผิดพลาด โปรดตรวจสอบซ้ำ</p>
                </div>
              )}

              {showIdentityFields && <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[#1d1d1f]">ชื่อ</span>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    autoComplete="given-name"
                    placeholder="กรอกชื่อ"
                    value={firstName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFirstName(value);
                      setFormData({ ...formData, full_name: [value, lastName].filter(Boolean).join(' ') });
                    }}
                    className="h-13 w-full rounded-xl border border-black/12 bg-white px-4 text-base font-medium text-[#1d1d1f] outline-none transition focus:border-[#115af2] focus:ring-4 focus:ring-[#115af2]/10"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[#1d1d1f]">นามสกุล</span>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    autoComplete="family-name"
                    placeholder="กรอกนามสกุล"
                    value={lastName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setLastName(value);
                      setFormData({ ...formData, full_name: [firstName, value].filter(Boolean).join(' ') });
                    }}
                    className="h-13 w-full rounded-xl border border-black/12 bg-white px-4 text-base font-medium text-[#1d1d1f] outline-none transition focus:border-[#115af2] focus:ring-4 focus:ring-[#115af2]/10"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#1d1d1f]">เลขบัตรประชาชน 13 หลัก</span>
                <div className="relative">
                  <LockKeyhole className="absolute right-4 top-4 size-5 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    pattern="[0-9]{13}"
                    maxLength={13}
                    autoComplete="off"
                    placeholder="X-XXXX-XXXXX-XX-X"
                    value={formData.citizen_id ?? ''}
                    onChange={(event) => setFormData({ ...formData, citizen_id: event.target.value.replace(/\D/g, '').slice(0, 13) })}
                    className="h-13 w-full rounded-xl border border-black/12 bg-white pl-4 pr-12 text-left font-mono text-base font-medium tracking-[0.08em] text-[#1d1d1f] outline-none transition placeholder:font-normal focus:border-[#115af2] focus:ring-4 focus:ring-[#115af2]/10"
                  />
                </div>
                <span className="block text-sm text-red-600">* ระบบสาธิตนี้ให้ใช้เลขตัวอย่างเท่านั้น ไม่ใช้เลขบัตรจริง</span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 py-1">
                <input
                  type="checkbox"
                  required
                  checked={Boolean(formData.consent_to_assess)}
                  onChange={(event) => handleConsentChange(event.target.checked)}
                  className="mt-0.5 size-5 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm leading-relaxed text-[#424245]">
                  <strong className="block text-sm text-[#072b77]">ยินยอมให้ตรวจสอบสิทธิและใช้ตำแหน่ง</strong>
                  เมื่อติ๊ก ระบบจะขอใช้ตำแหน่งทันทีเพื่อเรียงโรงพยาบาลใกล้เคียงหลังตรวจสิทธิ พิกัดและผลสิทธิจะเก็บชั่วคราวเฉพาะแท็บนี้ ไม่ส่งไปบันทึกในฐานข้อมูล และเลือก “ไม่อนุญาต” ตำแหน่งได้โดยยังตรวจสิทธิต่อได้ตามปกติ
                  {locationStatus === 'loading' && <span role="status" className="mt-2 flex items-center gap-2 font-semibold text-[#115af2]"><Loader2 className="size-4 animate-spin" /> กำลังขอใช้ตำแหน่ง...</span>}
                  {locationStatus === 'success' && <span role="status" className="mt-2 flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 className="size-4" /> อนุญาตตำแหน่งแล้ว</span>}
                  {(locationStatus === 'denied' || locationStatus === 'error') && <span role="alert" className="mt-2 block font-semibold text-amber-800">{locationStatus === 'denied' ? 'ยังไม่ได้รับอนุญาตให้ใช้ตำแหน่ง แต่ตรวจสิทธิต่อได้ตามปกติ' : 'ไม่สามารถอ่านตำแหน่งได้ แต่ตรวจสิทธิต่อได้ตามปกติ'}</span>}
                </span>
              </label>
              </>}
            </div>

            {showIdentityFields && <>
              {error && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="liquid-btn-primary mt-5 inline-flex h-12 w-full items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <><Loader2 className="size-5 animate-spin" /> กำลังตรวจหลายแหล่งข้อมูล...</> : <><Search className="size-5" /> ค้นหาสิทธิของฉัน</>}
              </button>
            </>}
          </form>

          <section className="border-t border-black/9 py-9 lg:border-0 lg:pl-12 sm:py-12">
            <p className="text-sm font-semibold text-[#115af2]">หนึ่งคำขอ หลายหน่วยงาน</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1d1f]">เห็นภาพรวมความคุ้มครอง<br />โดยไม่ต้องค้นหาทีละระบบ</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6e6e73]">ระบบจริงจะส่งคำขอไปยังหน่วยงานเจ้าของข้อมูลตามความยินยอมของประชาชน</p>

            <div className="mt-5 space-y-2" aria-label="หน่วยงานที่ตรวจสอบสิทธิ">
              {gateways.map((gateway, index) => (
                <button
                  key={gateway.code}
                  type="button"
                  onClick={() => setSelectedGatewayCode((current) => current === gateway.code ? null : gateway.code)}
                  aria-expanded={selectedGatewayCode === gateway.code}
                  aria-controls="gateway-benefit-panel"
                  className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#115af2]/10 ${selectedGatewayCode === gateway.code ? 'border-cyan-600 bg-cyan-600' : 'border-[#115af2]/15 bg-white hover:border-cyan-600 hover:bg-white'}`}
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${loading ? 'animate-pulse bg-[#115af2] text-white' : selectedGatewayCode === gateway.code ? 'bg-white text-[#115af2]' : 'bg-[#e8f1ff] text-[#115af2]'}`}>
                    {loading ? index + 1 : <CheckCircle2 className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className={`block text-sm font-semibold ${selectedGatewayCode === gateway.code ? 'text-white' : 'text-[#1d1d1f]'}`}>{gateway.agency}</strong>
                    <span className={`block truncate text-sm ${selectedGatewayCode === gateway.code ? 'text-cyan-50' : 'text-[#6e6e73]'}`}>{gateway.detail}</span>
                  </span>
                  <ChevronRight className={`size-4 shrink-0 transition-transform ${selectedGatewayCode === gateway.code ? 'rotate-90 text-white' : 'text-[#6e6e73] group-hover:translate-x-0.5 group-hover:text-cyan-700'}`} aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="mt-5 border-t border-black/8 pt-5 text-xs leading-relaxed text-[#6e6e73]">
              กดชื่อหน่วยงานเพื่อดูเช็กลิสต์สิทธิที่ใช้ได้เมื่อผ่านเกณฑ์ หลังตรวจสอบแล้วหน้าแสดงผลจะสรุปสิทธิที่พบและจัดอันดับโรงพยาบาลใกล้เคียงให้
            </div>
          </section>
        </div>

        {selectedGateway && (
          <section
            ref={benefitGuideRef}
            id="gateway-benefit-panel"
            aria-labelledby="gateway-benefit-title"
            className="mt-8 scroll-mt-24 overflow-hidden rounded-[28px] border border-[#dce3eb] bg-[#fffefa] shadow-[0_18px_55px_rgba(15,23,42,0.08)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-black/8 px-5 py-5 sm:px-8 sm:py-6">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#115af2]">{selectedGateway.agency} · เช็กลิสต์สิทธิที่อาจใช้ได้</p>
                <h2 id="gateway-benefit-title" className="mt-1 text-xl font-bold tracking-tight text-[#101828] sm:text-2xl">{selectedGateway.title}</h2>
                <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#667085]"><strong className="font-semibold text-[#344054]">ผู้มีสิทธิ:</strong> {selectedGateway.eligibility}</p>
                <p className="mt-1 text-sm text-[#667085]"><strong className="font-semibold text-[#344054]">หน่วยงานดูแล:</strong> {selectedGateway.owner}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGatewayCode(null)}
                className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full border border-black/8 bg-white px-3 text-sm font-semibold text-[#475467] transition hover:bg-[#f2f4f7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#115af2]/15"
                aria-label="ย่อตารางรายละเอียดสิทธิ"
              >
                ย่อ<ChevronRight className="size-4 -rotate-90" />
              </button>
            </header>

            <div className="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#101828]">
                  <BadgeCheck className="size-6 text-[#115af2]" aria-hidden="true" />
                  สิทธิประโยชน์ที่ใช้ได้เมื่อผ่านเกณฑ์
                </h3>
                <ul className="mt-5 space-y-4">
                  {selectedGateway.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm leading-relaxed text-[#1d2939] sm:text-base">
                      <BadgeCheck className="mt-0.5 size-5 shrink-0 text-[#115af2]" aria-hidden="true" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#101828]">
                  <AlertCircle className="size-6 text-amber-400" aria-hidden="true" />
                  เงื่อนไขและข้อจำกัดที่ควรทราบ
                </h3>
                <ul className="mt-5 space-y-4">
                  {selectedGateway.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-3 text-sm leading-relaxed text-[#667085] sm:text-base">
                      <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 rounded-2xl bg-[#f7faff] p-4 text-[#115af2] sm:p-5">
                  <p className="flex items-center gap-2 text-sm font-bold sm:text-base"><Phone className="size-5 shrink-0" />{selectedGateway.hotline}</p>
                  <a href={selectedGateway.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline text-shadow-[#115af2] underline-offset-4 hover:text-cyan-600">
                    ตรวจสอบจาก {selectedGateway.sourceLabel}<ExternalLink className="size-4" />
                  </a>
                </div>

                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                  รายการนี้เป็นข้อมูลประกอบการตรวจสอบ ไม่ใช่การยืนยันสิทธิส่วนบุคคล สิทธิจริงขึ้นอยู่กับสถานะในฐานข้อมูล เอกสาร และเงื่อนไขล่าสุดของหน่วยงานเจ้าของสิทธิ
                </p>
              </div>
            </div>
          </section>
        )}

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-[#6e6e73]">
          ผลทั้งหมดเป็นข้อมูลสาธิตแนวคิดการเชื่อมภาครัฐ ยังไม่ใช่ข้อมูลบุคคลจริง กรุณายืนยันกับหน่วยงานเจ้าของข้อมูลก่อนใช้บริการ
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
