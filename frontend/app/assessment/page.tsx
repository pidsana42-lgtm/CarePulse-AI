'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Database,
  FileCheck2,
  FileUp,
  Loader2,
  LockKeyhole,
  Search,
  UserRound,
} from 'lucide-react';
import { lookupMockRegistry, reviewDocumentText, submitAssessment, uploadDocument } from '@/lib/api';
import { assessMockEligibility } from '@/lib/mock-eligibility';
import { AssessmentInput, AssessmentResult, DocumentScanResult } from '@/types';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import {
  getSessionDocumentResults,
  getSessionAssessment,
  getSessionLocation,
  rememberDocumentInsight,
  setSessionAssessment,
  setSessionLocation,
} from '@/lib/session-memory';

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

const gateways = [
  { code: 'NHSO', agency: 'สปสช.', detail: 'สิทธิหลักประกันสุขภาพ' },
  { code: 'SSO', agency: 'ประกันสังคม', detail: 'สถานะผู้ประกันตน' },
  { code: 'CGD', agency: 'กรมบัญชีกลาง', detail: 'สวัสดิการข้าราชการ' },
  { code: 'OIC', agency: 'คปภ.', detail: 'กรมธรรม์ชีวิตและสุขภาพ' },
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
      setMedicalDocument(cachedDocument);
      setFirstName(names.firstName);
      setLastName(names.lastName);
      setFormData((current) => mergeDocumentData(current, extracted));
    }
  }, []);

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
        <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#072b77]/75 px-4">
          <div className="pointer-events-none absolute -left-24 top-1/4 size-80 rounded-full bg-[#00f2f6]/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-1/4 size-80 rounded-full bg-cyan-400/30 blur-3xl" />

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white p-6 text-center sm:p-8">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-[#00f2f6]/35 blur-3xl" />

            <div className="relative mx-auto size-24">
              <div className="absolute inset-0 rounded-full border border-[#dff9ff] bg-[#f2fdff]" />
              <div className="absolute inset-1 animate-spin rounded-full border-[3px] border-cyan-100 border-r-[#00f2f6] border-t-cyan-600" />
              <div className="absolute inset-3 animate-[spin_2.4s_linear_infinite_reverse] rounded-full border border-dashed border-[#1a7bf0]/70" />
              <Database className="absolute inset-0 m-auto size-7 text-cyan-800" />
            </div>

            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-700">กำลังประมวลผล</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">{loadingStages[loadingStage]}</h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500">เก็บข้อมูลแบบ JSON ไว้ชั่วคราวเฉพาะเซสชันของแท็บนี้ และปกปิดเลขบัตรเมื่อส่งบริบทให้ AI</p>

            <div className="mt-6 h-2 overflow-hidden rounded-full border border-white bg-slate-200/55 p-0.5 shadow-inner">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-700 via-[#1a7bf0] to-[#00f2f6] shadow-[0_0_18px_rgba(0,242,246,0.7)] transition-all duration-500" style={{ width: `${((loadingStage + 1) / loadingStages.length) * 100}%` }} />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {gateways.map((gateway, index) => (
                <div key={gateway.code} className={`flex items-center justify-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-black transition ${index <= loadingStage ? 'border-cyan-200 bg-cyan-50/90 text-cyan-800 shadow-sm' : 'border-white/80 bg-white/35 text-slate-400'}`}>
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
            CarePulse จำลองการตรวจหลายหน่วยงานผ่านระบบเชื่อมต่อกลาง แล้วสรุปสิทธิ กรมธรรม์ และโรงพยาบาลใกล้คุณให้เข้าใจง่าย
          </p>
        </div>

        <div className="mx-auto mt-14 grid w-full border-y border-black/[0.09] lg:grid-cols-[1.08fr_.92fr]">
          <form onSubmit={handleSubmit} className="py-9 lg:border-r lg:border-black/[0.09] lg:pr-12 sm:py-12">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#e8f1ff] text-[#115af2]"><UserRound className="size-5" /></span>
                <div>
                  <p className="apple-eyebrow">เริ่มตรวจสอบสิทธิ</p>
                  <h2 className="text-xl font-semibold text-[#1d1d1f]">ข้อมูลจากบัตรประชาชน</h2>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                <button type="button" onClick={useDemoData} className="text-xs font-semibold text-[#115af2] hover:underline">
                  ใช้ข้อมูลตัวอย่าง
                </button>
                <button type="button" onClick={useCivilServantDemoData} className="text-xs font-semibold text-[#115af2] hover:underline">
                  ตัวอย่างสิทธิข้าราชการ
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-[#115af2]/20 bg-[#f7faff] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#115af2]"><FileUp className="size-5" /></span>
                  <div>
                    <p className="text-sm font-semibold text-[#1d1d1f]">มีใบรับรองแพทย์หรือไม่</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#6e6e73]">แนบเอกสารเพื่อให้ AI อ่านและเติมชื่อ–นามสกุลลงในแบบฟอร์ม แล้วตรวจแก้ก่อนดำเนินการต่อ</p>
                  </div>
                </div>

                <label className={`mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${documentLoading ? 'cursor-wait bg-[#dfeeff] text-[#115af2]' : 'bg-[#115af2] text-white hover:bg-[#1a7bf0]'}`}>
                  <input type="file" accept="image/*,.pdf" disabled={documentLoading} onChange={handleMedicalDocument} className="hidden" />
                  {documentLoading ? <Loader2 className="size-4 animate-spin" /> : medicalDocument ? <FileCheck2 className="size-4" /> : <FileUp className="size-4" />}
                  {documentLoading ? 'AI กำลังอ่านเอกสาร...' : medicalDocument ? 'เปลี่ยนใบรับรองแพทย์' : 'แนบใบรับรองแพทย์'}
                </label>

                {/* {medicalDocument && (
                  <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-950">
                    <strong className="flex items-center gap-1.5"><FileCheck2 className="size-4" /> เติมข้อมูลจาก {medicalDocument.fileName} แล้ว</strong>
                    <span className="mt-1 block leading-relaxed">ความมั่นใจในการอ่านข้อความ {Math.round(medicalDocument.result.ocr_confidence * 100)}% กรุณาตรวจชื่อ–นามสกุลด้านล่างอีกครั้ง</span>
                    <label className="mt-3 block">
                      <span className="font-semibold">ข้อความที่ AI อ่านได้</span>
                      <textarea
                        rows={4}
                        value={documentReviewText}
                        onChange={(event) => setDocumentReviewText(event.target.value)}
                        placeholder="หาก AI อ่านชื่อไม่ออก สามารถพิมพ์บรรทัดชื่อผู้ป่วยจากใบรับรองแพทย์ได้"
                        className="mt-1.5 w-full resize-y rounded-xl border border-emerald-200 bg-white p-3 text-sm leading-relaxed text-slate-900 outline-none focus:border-[#115af2] focus:ring-4 focus:ring-[#115af2]/10"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={documentReviewing}
                      onClick={applyReviewedDocumentText}
                      className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                    >
                      {documentReviewing ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
                      {documentReviewing ? 'กำลังอ่านชื่อใหม่...' : 'นำข้อความนี้มาเติมชื่อใหม่'}
                    </button>
                  </div>
                )} */}
                {documentError && <p role="alert" className="mt-3 text-xs font-semibold text-rose-700">{documentError}</p>}
                <p className="mt-3 text-[11px] leading-relaxed text-amber-700">ระบบสาธิตควรใช้เอกสารตัวอย่างเท่านั้น ข้อมูลจาก AI อาจมีข้อผิดพลาด โปรดตรวจสอบซ้ำ</p>
              </div>

              {medicalDocument && (
                <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
                  <FileCheck2 className="size-4 shrink-0" />
                  AI อ่านใบรับรอง {medicalDocument.fileName} แล้ว (มั่นใจ {Math.round(medicalDocument.result.ocr_confidence * 100)}%) — ผลสิทธิและอุปกรณ์จะแสดงหลังกดค้นหาสิทธิ
                </p>
              )}

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
                    className="h-13 w-full rounded-xl border border-black/[0.12] bg-white px-4 text-base font-medium text-[#1d1d1f] outline-none transition focus:border-[#115af2] focus:ring-4 focus:ring-[#115af2]/10"
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
                    className="h-13 w-full rounded-xl border border-black/[0.12] bg-white px-4 text-base font-medium text-[#1d1d1f] outline-none transition focus:border-[#115af2] focus:ring-4 focus:ring-[#115af2]/10"
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
                    className="h-13 w-full rounded-xl border border-black/[0.12] bg-white pl-4 pr-12 text-left font-mono text-base font-semibold tracking-[0.08em] text-[#1d1d1f] outline-none transition focus:border-[#115af2] focus:ring-4 focus:ring-[#115af2]/10"
                  />
                </div>
                <span className="block text-[11px] text-amber-700">ระบบสาธิตนี้ให้ใช้เลขตัวอย่างเท่านั้น ไม่ใช้เลขบัตรจริง</span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#115af2]/20 bg-[#eef5ff] p-4">
                <input
                  type="checkbox"
                  required
                  checked={Boolean(formData.consent_to_assess)}
                  onChange={(event) => handleConsentChange(event.target.checked)}
                  className="mt-0.5 size-5 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-xs leading-relaxed text-[#424245]">
                  <strong className="block text-sm text-[#072b77]">ยินยอมให้ตรวจสอบสิทธิและใช้ตำแหน่ง</strong>
                  เมื่อติ๊ก ระบบจะขอใช้ตำแหน่งทันทีเพื่อเรียงโรงพยาบาลใกล้เคียงหลังตรวจสิทธิ พิกัดและผลสิทธิจะเก็บชั่วคราวเฉพาะแท็บนี้ ไม่ส่งไปบันทึกในฐานข้อมูล และเลือก “ไม่อนุญาต” ตำแหน่งได้โดยยังตรวจสิทธิต่อได้ตามปกติ
                  {locationStatus === 'loading' && <span role="status" className="mt-2 flex items-center gap-2 font-semibold text-[#115af2]"><Loader2 className="size-4 animate-spin" /> กำลังขอใช้ตำแหน่ง...</span>}
                  {locationStatus === 'success' && <span role="status" className="mt-2 flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 className="size-4" /> อนุญาตตำแหน่งแล้ว</span>}
                  {(locationStatus === 'denied' || locationStatus === 'error') && <span role="alert" className="mt-2 block font-semibold text-amber-800">{locationStatus === 'denied' ? 'ยังไม่ได้รับอนุญาตให้ใช้ตำแหน่ง แต่ตรวจสิทธิต่อได้ตามปกติ' : 'ไม่สามารถอ่านตำแหน่งได้ แต่ตรวจสิทธิต่อได้ตามปกติ'}</span>}
                </span>
              </label>
            </div>

            {error && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="liquid-btn-primary mt-5 inline-flex h-12 w-full items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <><Loader2 className="size-5 animate-spin" /> กำลังตรวจหลายแหล่งข้อมูล...</> : <><Search className="size-5" /> ค้นหาสิทธิของฉัน</>}
            </button>
          </form>

          <section className="border-t border-black/[0.09] py-9 lg:border-0 lg:pl-12 sm:py-12">
            <p className="text-xs font-semibold text-[#115af2]">หนึ่งคำขอ หลายหน่วยงาน</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1d1f]">เห็นภาพรวมความคุ้มครอง<br />โดยไม่ต้องค้นหาทีละระบบ</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6e6e73]">ระบบจริงจะส่งคำขอไปยังหน่วยงานเจ้าของข้อมูลตามความยินยอมของประชาชน</p>

            <div className="mt-5 space-y-3">
              {gateways.map((gateway, index) => (
                <div key={gateway.code} className="flex items-center gap-3 border-b border-black/[0.08] py-3.5 last:border-0">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${loading ? 'animate-pulse bg-[#115af2] text-white' : 'bg-[#e8f1ff] text-[#115af2]'}`}>
                    {loading ? index + 1 : <CheckCircle2 className="size-4" />}
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-sm font-semibold text-[#1d1d1f]">{gateway.agency}</strong>
                    <span className="block truncate text-xs text-[#6e6e73]">{gateway.detail}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-black/[0.08] pt-5 text-xs leading-relaxed text-[#6e6e73]">
              หากอนุญาตตำแหน่งระหว่างกรอกข้อมูล หน้าแสดงผลจะจัดอันดับโรงพยาบาลใกล้เคียงให้อัตโนมัติ โดยการปฏิเสธตำแหน่งไม่มีผลต่อการตรวจสิทธิ
            </div>
          </section>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-[#6e6e73]">
          ผลทั้งหมดเป็นข้อมูลสาธิตแนวคิดการเชื่อมภาครัฐ ยังไม่ใช่ข้อมูลบุคคลจริง กรุณายืนยันกับหน่วยงานเจ้าของข้อมูลก่อนใช้บริการ
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
