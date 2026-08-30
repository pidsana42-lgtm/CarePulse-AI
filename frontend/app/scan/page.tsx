'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/CameraCapture';
import { reviewDocumentText, uploadDocument } from '@/lib/api';
import { AssessmentResult, DocumentScanResult } from '@/types';
import {
  ShieldCheck,
  ArrowRight,
  PackageCheck,
  Building2,
  Sparkles,
  HeartHandshake,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  PencilLine,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { forgetDocumentInsight, getSessionAssessment, rememberDocumentInsight } from '@/lib/session-memory';
import { getVerifiedDocumentBenefits } from '@/lib/document-rights';

const DOCUMENT_TYPE = 'medical_certificate';
const OCR_NO_TEXT_MESSAGE = 'อ่านข้อมูลภาพเรียบร้อยแล้ว (ไม่พบตัวอักษรพิมพ์ชัดเจน)';

const FLOW_STEPS = [
  // { number: 1, label: 'เลือกเอกสาร' },
  { number: 1, label: 'ถ่ายหรืออัปโหลด' },
  { number: 2, label: 'ตรวจข้อความ' },
  { number: 3, label: 'ดูผลสิทธิ' },
];

export default function ScanPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentResult | null | undefined>(undefined);
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResults, setScanResults] = useState<Array<{ fileName: string; result: DocumentScanResult }>>([]);
  const [reviewTexts, setReviewTexts] = useState<Record<string, string>>({});
  const [confirmedDocumentIds, setConfirmedDocumentIds] = useState<string[]>([]);
  const [reviewingDocumentId, setReviewingDocumentId] = useState<string | null>(null);
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});
  const [captureResetKey, setCaptureResetKey] = useState(0);

  useEffect(() => {
    setAssessment(getSessionAssessment());
  }, []);

  const goToStep = (step: number) => {
    setActiveStep(step);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  const clearCapturedResults = () => {
    scanResults.forEach(({ result }) => forgetDocumentInsight(result.document_id));
    setScanResults([]);
    setReviewTexts({});
    setConfirmedDocumentIds([]);
    setReviewErrors({});
  };

  const handleImagesCaptured = async (files: File[]) => {
    if (files.length === 0) return;
    setIsLoading(true);
    try {
      const completed = await Promise.allSettled(
        files.map(async (file) => ({ fileName: file.name, result: await uploadDocument(file, DOCUMENT_TYPE) })),
      );
      const successful = completed
        .filter((item): item is PromiseFulfilledResult<{ fileName: string; result: DocumentScanResult }> => item.status === 'fulfilled')
        .map((item) => item.value);
      const failedCount = completed.length - successful.length;
      if (successful.length > 0) {
        setReviewTexts((current) => {
          const next = { ...current };
          successful.forEach(({ result }) => {
            const rawText = String(result.extracted_data?.ocr_raw_text ?? '');
            next[result.document_id] = rawText === OCR_NO_TEXT_MESSAGE ? '' : rawText;
          });
          return next;
        });
        setScanResults((current) => [...current, ...successful]);
        goToStep(2);
      }
      if (failedCount > 0) alert(`มีเอกสาร ${failedCount} ใบที่ไม่สามารถวิเคราะห์ได้ กรุณาตรวจรูปแบบไฟล์แล้วลองใหม่`);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewTextChange = (documentId: string, value: string) => {
    setReviewTexts((current) => ({ ...current, [documentId]: value }));
    setReviewErrors((current) => ({ ...current, [documentId]: '' }));
    if (confirmedDocumentIds.includes(documentId)) {
      setConfirmedDocumentIds((current) => current.filter((id) => id !== documentId));
      forgetDocumentInsight(documentId);
    }
  };

  const confirmAndReanalyze = async (entry: { fileName: string; result: DocumentScanResult }) => {
    const documentId = entry.result.document_id;
    const correctedText = (reviewTexts[documentId] ?? '').trim();
    if (!correctedText) {
      setReviewErrors((current) => ({ ...current, [documentId]: 'กรุณาตรวจสอบและกรอกข้อความจากเอกสารก่อนยืนยัน' }));
      return;
    }

    setReviewingDocumentId(documentId);
    setReviewErrors((current) => ({ ...current, [documentId]: '' }));
    try {
      const reviewedResult = await reviewDocumentText(entry.fileName, entry.result.document_type, correctedText);
      setScanResults((current) => current.map((item) => (
        item.result.document_id === documentId
          ? { ...item, result: { ...reviewedResult, document_id: documentId } }
          : item
      )));
      setReviewTexts((current) => ({
        ...current,
        [documentId]: String(reviewedResult.extracted_data?.ocr_raw_text ?? correctedText),
      }));
      const resultForSession = { ...reviewedResult, document_id: documentId };
      rememberDocumentInsight(resultForSession, entry.fileName, assessment);
      setConfirmedDocumentIds((current) => Array.from(new Set([...current, documentId])));
    } catch (error) {
      setReviewErrors((current) => ({
        ...current,
        [documentId]: error instanceof Error ? error.message : 'ไม่สามารถวิเคราะห์ข้อความที่แก้ไขได้',
      }));
    } finally {
      setReviewingDocumentId(null);
    }
  };

  const extractedItems = scanResults.map(({ fileName, result }) => ({ fileName, data: result.extracted_data || {} }));
  const verifiedBenefits = assessment
    ? getVerifiedDocumentBenefits(assessment, extractedItems.map(({ data }) => data))
    : { primaryRight: null, additionalRights: [], equipment: [], schemes: [], references: [] };
  const matchedEquipment = verifiedBenefits.equipment;
  const eligibleSchemes = verifiedBenefits.schemes;
  const detectedConditions = Array.from(new Set(
    extractedItems.flatMap(({ data }) => Array.isArray(data.detected_conditions) ? data.detected_conditions : []),
  ));
  const activePrivatePolicies = assessment?.registry_response?.private_policies.filter((policy) => policy.status === 'ACTIVE') ?? [];
  const ocrConfidence = scanResults.length > 0
    ? scanResults.reduce((sum, item) => sum + item.result.ocr_confidence, 0) / scanResults.length
    : 0;
  const needsManualReview = ocrConfidence < 0.8;
  const allDocumentsConfirmed = scanResults.length > 0
    && scanResults.every(({ result }) => confirmedDocumentIds.includes(result.document_id));

  const returnToUpload = () => {
    scanResults.forEach(({ result }) => forgetDocumentInsight(result.document_id));
    setScanResults([]);
    setReviewTexts({});
    setConfirmedDocumentIds([]);
    setReviewErrors({});
    setCaptureResetKey((current) => current + 1);
    goToStep(1);
  };

  if (assessment === undefined) {
    return (
      <div className="apple-page flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <div role="status" className="text-center">
            <RefreshCw className="mx-auto size-8 animate-spin text-[#115af2]" />
            <p className="mt-3 text-sm font-semibold text-[#424245]">กำลังอ่านผลตรวจสิทธิของคุณ...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="apple-page flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <span className="flex size-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-800"><AlertTriangle className="size-8" /></span>
          <h1 className="mt-5 text-2xl font-black text-slate-950">กรุณาตรวจสิทธิก่อนอ่านเอกสาร</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">ระบบต้องใช้สิทธิที่ตรวจพบจากข้อมูลผู้รับบริการ เพื่อกรองผลจากใบรับรองแพทย์ให้เหลือเฉพาะสิทธิที่คุณใช้ได้</p>
          <Link href="/assessment" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#115af2] px-6 py-3 text-sm font-black text-white hover:bg-[#1a7bf0]">
            ไปตรวจสอบสิทธิ <ArrowRight className="size-4" />
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="apple-page relative min-h-screen flex flex-col overflow-x-clip">
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 pb-20 pt-10 sm:px-8 sm:pt-14 animate-apple-fade-in">

        {/* Page Header */}
        <div className="mx-auto max-w-3xl space-y-2.5 text-center">
          <h1 className="apple-headline text-4xl sm:text-5xl">
            สแกนใบรับรองแพทย์<br />
            <span className="text-[#115af2]">
              วิเคราะห์สิทธิด้วย AI
            </span>
          </h1>
          <p className="apple-subhead mx-auto max-w-2xl text-sm sm:text-base">
            AI อ่านข้อวินิจฉัย ภาวะพึ่งพิง และอุปกรณ์ที่แพทย์แนะนำ แล้วค้นหาสิทธิเสริมที่เลขบัตรอย่างเดียวบอกไม่ได้ พร้อมปกปิดข้อมูลส่วนบุคคล
          </p>
        </div>

        <nav aria-label="ขั้นตอนการสแกนเอกสาร" className="mx-auto w-full max-w-4xl rounded-[28px] bg-white p-3 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-4">
          <ol className="grid grid-cols-3 gap-1 sm:gap-3">
            {FLOW_STEPS.map((step) => {
              const isComplete = step.number < activeStep;
              const isCurrent = step.number === activeStep;
              return (
                <li key={step.number} aria-current={isCurrent ? 'step' : undefined} className="relative flex min-w-0 flex-col items-center gap-1.5 text-center">
                  <span className={`flex size-8 items-center justify-center rounded-full text-xs font-black transition-colors sm:size-10 sm:text-sm ${
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-[#115af2] text-white shadow-[0_8px_20px_-10px_rgba(17,90,242,0.9)]'
                        : 'bg-[#ececf0] text-[#86868b]'
                  }`}>
                    {isComplete ? <CheckCircle2 className="size-4 sm:size-5" /> : step.number}
                  </span>
                  <span className={`truncate text-[10px] font-bold sm:text-xs ${isCurrent ? 'text-[#115af2]' : isComplete ? 'text-emerald-700' : 'text-[#86868b]'}`}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Camera / Upload Box */}
        {activeStep === 1 && (
          <section className="rounded-[32px] bg-white p-5 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-8 animate-apple-fade-in">
            <div className="mb-5 flex items-start gap-3">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${scanResults.length > 0 ? 'bg-emerald-500 text-white' : 'bg-[#115af2] text-white'}`}>
                {scanResults.length > 0 ? <CheckCircle2 className="size-5" /> : '1'}
              </span>
              <div>
                <h2 className="text-lg font-black text-[#1d1d1f]">ถ่ายรูปหรือแนบเอกสาร</h2>
                <p className="mt-0.5 text-xs text-[#6e6e73]">ถ่ายให้เห็นข้อความชัดเจน หรือเลือกไฟล์จากเครื่องได้สูงสุด 10 ใบ</p>
              </div>
            </div>
            <CameraCapture key={captureResetKey} onImagesCaptured={handleImagesCaptured} onReset={clearCapturedResults} isLoading={isLoading} />
            <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl bg-[#fff7e5] px-4 py-4 text-amber-950 sm:px-5">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-xs leading-relaxed">ข้อมูลจาก AI อาจมีข้อผิดพลาด โปรดตรวจสอบซ้ำอีกครั้ง</p>
            </div>
          </section>
        )}
        {/* Loading State */}
        {activeStep === 1 && isLoading && (
          <div className="space-y-3 rounded-[32px] bg-white py-12 text-center shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] animate-apple-fade-in">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
            <p className="text-slate-800 font-black text-base">AI กำลังอ่านและวิเคราะห์เอกสารทุกใบ...</p>
          </div>
        )}

        {/* Scan Results */}
        {!isLoading && scanResults.length > 0 && activeStep >= 2 && (
          <div className="space-y-6 rounded-[32px] bg-white p-5 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-8 animate-apple-fade-in">

            {activeStep === 2 && (
              <>
            {/* Result Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${allDocumentsConfirmed ? 'bg-emerald-500 text-white' : 'bg-[#115af2] text-white'}`}>
                  {allDocumentsConfirmed ? <CheckCircle2 className="size-5" /> : '2'}
                </span>
                <div>
                  <h2 className="text-lg font-black text-[#1d1d1f]">ตรวจและแก้ข้อความที่ AI อ่านได้</h2>
                  <p className="mt-0.5 text-xs text-[#6e6e73]">พบเอกสาร {scanResults.length} ใบ กรุณาตรวจให้ครบก่อนดูผลสิทธิ</p>
                </div>
              </div>
              <div className="liquid-glass-pill px-3.5 py-1 text-xs bg-cyan-100/80 text-cyan-900 font-extrabold flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-700" />
                ปกป้องข้อมูลส่วนบุคคล
              </div>
            </div>

            <div className={`flex items-start gap-3 rounded-2xl p-4 ${needsManualReview ? 'bg-[#fff7e5] text-amber-900' : 'bg-[#eef5ff] text-[#072b77]'}`}>
              <ShieldCheck className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{needsManualReview ? 'ควรตรวจทานข้อความจากเอกสารอีกครั้ง' : 'ผ่านการอ่านเอกสารเบื้องต้น'}</p>
                <p className="mt-1 text-xs leading-relaxed">ความมั่นใจในการอ่านข้อความเฉลี่ย {Math.round(ocrConfidence * 100)}% · AI ใช้เพื่อคัดกรองเท่านั้น โปรดเทียบชื่อโรค อุปกรณ์ และเงื่อนไขกับเอกสารต้นฉบับก่อนยื่นขอสิทธิ</p>
              </div>
            </div>

            {/* Human review of extracted text */}
            <div className="space-y-4 rounded-2xl border border-[#115af2]/15 bg-[#f7faff] p-4 sm:p-5">
              <div>
                <h3 className="flex items-center gap-2 text-base font-black text-[#072b77]">
                  <PencilLine className="size-5 text-[#115af2]" />
                  ตรวจสอบข้อความที่ AI อ่านได้
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#424245]">เทียบกับเอกสารต้นฉบับ แก้ชื่อโรค ภาวะพึ่งพิง หรืออุปกรณ์ให้ถูกต้อง แล้วกดยืนยันเพื่อวิเคราะห์สิทธิใหม่</p>
              </div>

              {scanResults.map((entry) => {
                const documentId = entry.result.document_id;
                const isConfirmed = confirmedDocumentIds.includes(documentId);
                const isReviewing = reviewingDocumentId === documentId;
                return (
                  <div key={documentId} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor={`review-${documentId}`} className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <FileText className="size-4 text-[#115af2]" /> {entry.fileName}
                      </label>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${isConfirmed ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                        {isConfirmed && <CheckCircle2 className="size-3.5" />}
                        {isConfirmed ? 'ยืนยันแล้ว' : 'รอตรวจสอบ'}
                      </span>
                    </div>
                    <textarea
                      id={`review-${documentId}`}
                      value={reviewTexts[documentId] ?? ''}
                      onChange={(event) => handleReviewTextChange(documentId, event.target.value)}
                      rows={7}
                      placeholder="AI อ่านข้อความไม่ชัดเจน กรุณาพิมพ์ชื่อโรค ภาวะพึ่งพิง อุปกรณ์ที่แพทย์แนะนำ หรือข้อความสำคัญจากเอกสาร"
                      className="mt-3 w-full resize-y rounded-xl border border-black/[0.12] bg-white p-3 font-mono text-sm leading-relaxed text-slate-800 outline-none transition focus:border-[#115af2] focus:ring-4 focus:ring-[#115af2]/10"
                      aria-describedby={reviewErrors[documentId] ? `review-error-${documentId}` : undefined}
                    />
                    {reviewErrors[documentId] && <p id={`review-error-${documentId}`} role="alert" className="mt-2 text-xs font-semibold text-rose-700">{reviewErrors[documentId]}</p>}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={isReviewing}
                        onClick={() => confirmAndReanalyze(entry)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#115af2] px-5 text-xs font-bold text-white transition hover:bg-[#1a7bf0] disabled:cursor-wait disabled:opacity-60"
                      >
                        {isReviewing ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        {isReviewing ? 'กำลังวิเคราะห์ใหม่...' : isConfirmed ? 'ยืนยันและวิเคราะห์อีกครั้ง' : 'ยืนยันและวิเคราะห์ใหม่'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!allDocumentsConfirmed && (
              <div role="status" className="rounded-2xl bg-[#fff7e5] p-4 text-sm font-semibold text-amber-900">
                ขั้นตอนถัดไป: ตรวจสอบข้อความและกด “ยืนยันและวิเคราะห์ใหม่” ให้ครบทุกใบ
              </div>
            )}
              </>
            )}

            {activeStep === 3 && allDocumentsConfirmed && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] pt-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#115af2] text-sm font-black text-white">3</span>
                  <div>
                    <h2 className="text-lg font-black text-[#1d1d1f]">สิทธิที่ใช้ได้จากผลตรวจและเอกสาร</h2>
                    <p className="mt-0.5 text-xs text-[#6e6e73]">แสดงเฉพาะสิทธิที่ตรวจพบจากข้อมูลผู้รับบริการและตรงกับเอกสารที่ยืนยันแล้ว</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="size-4" /> ตรวจเอกสารครบแล้ว
                </div>
              </div>
            )}

            {activeStep === 3 && allDocumentsConfirmed && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
                <p className="text-xs font-bold text-emerald-700">สิทธิหลักที่ใช้กรองผล</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-black text-emerald-950">{verifiedBenefits.primaryRight?.scheme_name ?? 'ยังไม่มีสิทธิหลักที่ยืนยันว่าใช้งานได้'}</p>
                    {assessment.registry_response?.entitlement.primary_provider.name && (
                      <p className="mt-1 text-xs text-emerald-800">หน่วยบริการประจำ: {assessment.registry_response.entitlement.primary_provider.name}</p>
                    )}
                  </div>
                  {activePrivatePolicies.length > 0 && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">มีกรมธรรม์ใช้งาน {activePrivatePolicies.length} ฉบับ</span>}
                </div>
              </div>
            )}

            {/* Rights-aware document summary */}
            {activeStep === 3 && allDocumentsConfirmed && (
              <div className="space-y-3 rounded-2xl bg-[#eef5ff] p-5">
                <h3 className="flex items-center gap-2 text-base font-black text-cyan-950">
                  <Sparkles className="size-4 text-cyan-600" /> สรุปหลังตรวจข้อความและสิทธิ
                </h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3">
                    <dt className="text-xs font-bold text-slate-500">เอกสารที่วิเคราะห์</dt>
                    <dd className="mt-1 break-words font-semibold text-slate-900">{scanResults.map((item) => item.fileName).join(', ')}</dd>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <dt className="text-xs font-bold text-slate-500">สิทธิเสริมที่ตรงกัน</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{verifiedBenefits.additionalRights.length > 0 ? verifiedBenefits.additionalRights.map((right) => right.scheme_name).join(', ') : 'ไม่พบสิทธิเสริมที่ยืนยันว่าใช้ได้'}</dd>
                  </div>
                  <div className="rounded-xl bg-white p-3 sm:col-span-2">
                    <dt className="text-xs font-bold text-slate-500">ข้อมูลทางการแพทย์ที่ AI อ่านได้</dt>
                    <dd className="mt-1 font-semibold leading-relaxed text-slate-900">{detectedConditions.length > 0 ? detectedConditions.join(' • ') : 'ไม่พบข้อความทางการแพทย์ที่ชัดเจน'}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Matched Equipment */}
            {activeStep === 3 && allDocumentsConfirmed && matchedEquipment.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-cyan-600" />
                  กายอุปกรณ์และสวัสดิการที่อาจเข้าเงื่อนไข ({matchedEquipment.length} รายการ):
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">รายการจะปรากฏเมื่อข้อมูลในเอกสารตรงกับสิทธิที่ตรวจพบเท่านั้น ยังไม่ใช่การอนุมัติรับอุปกรณ์ ต้องให้หน่วยงานเจ้าของสิทธิประเมินและยืนยันอีกครั้ง</p>
                <div className="grid grid-cols-1 gap-3">
                  {matchedEquipment.map((eq, i) => (
                    <div key={i} className="space-y-2 rounded-2xl bg-[#f5f5f7] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">{eq.item}</span>
                        <span className="liquid-glass-pill bg-cyan-100/90 text-cyan-900 text-xs font-black px-3 py-1">
                          {eq.cost_saved}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        หน่วยงาน: <strong>{eq.agency}</strong>
                      </div>
                      {eq.match_reason && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-950">
                          <strong className="block">ทำไมจึงแสดงอุปกรณ์นี้</strong>
                          <span className="mt-1 block">{eq.match_reason}</span>
                        </div>
                      )}
                      <div className="rounded-xl bg-white p-3 text-xs font-semibold text-cyan-900">
                        วิธีขอรับสิทธิ: {eq.how_to_claim}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eligible Schemes */}
            {activeStep === 3 && allDocumentsConfirmed && eligibleSchemes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-cyan-600" />
                  สิทธิการรักษาและการดูแลระยะยาว:
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {eligibleSchemes.map((sc, i) => (
                    <div key={i} className="space-y-1 rounded-2xl bg-[#f5f5f7] p-4">
                      <span className="font-bold text-slate-900 text-sm block">{sc.scheme}</span>
                      <p className="text-xs text-slate-500 leading-relaxed">{sc.benefit}</p>
                      <span className="text-xs text-cyan-700 font-bold block">ติดต่อ: {sc.contact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeStep === 3 && allDocumentsConfirmed && matchedEquipment.length === 0 && eligibleSchemes.length === 0 && (
              <div className="rounded-2xl bg-[#fff7e5] p-4 text-sm leading-relaxed text-amber-950">
                <strong className="block">ยังไม่พบสิทธิเสริมที่ยืนยันว่าใช้ได้</strong>
                <span className="mt-1 block text-xs">AI อาจพบภาวะหรืออุปกรณ์จากเอกสาร แต่ผลตรวจสิทธิของผู้รับบริการยังไม่ยืนยันสิทธิเสริมที่ตรงกัน ระบบจึงไม่นำรายการเหล่านั้นมาแสดงเป็นสิทธิของคุณ</span>
              </div>
            )}

            {/* Legal References */}
            {activeStep === 3 && allDocumentsConfirmed && verifiedBenefits.references.length > 0 && (
              <div className="space-y-2.5 rounded-2xl bg-[#f5f5f7] p-4">
                <div className="font-black text-slate-800 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  แหล่งอ้างอิงทางกฎหมาย:
                </div>
                <div className="space-y-2">
                  {verifiedBenefits.references.map((ref, idx) => (
                    <div key={idx} className="flex flex-col justify-between gap-2 rounded-xl bg-white p-3.5 text-xs sm:flex-row sm:items-center">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{ref.title}</span>
                        <span className="text-slate-400 font-medium">{ref.legal_act} — {ref.agency}</span>
                      </div>
                      {ref.url && (
                        <a href={ref.url} target="_blank" rel="noopener noreferrer"
                          className="text-cyan-700 hover:text-cyan-900 font-bold shrink-0 whitespace-nowrap">
                          อ่านระเบียบ ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {activeStep === 2 ? (
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button onClick={returnToUpload} className="liquid-btn-secondary flex flex-1 cursor-pointer items-center justify-center gap-2 px-5 py-4 text-sm font-black">
                  <ArrowRight className="size-4 rotate-180" /> กลับไปอัปโหลดใหม่
                </button>
                <button
                  onClick={() => goToStep(3)}
                  disabled={!allDocumentsConfirmed}
                  className="liquid-btn-primary flex flex-1 cursor-pointer items-center justify-center gap-2 px-5 py-4 text-sm font-black shadow-xl disabled:cursor-not-allowed disabled:opacity-45"
                >
                  ดูผลสิทธิที่ AI วิเคราะห์ <ArrowRight className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button onClick={() => goToStep(2)} className="liquid-btn-secondary flex flex-1 cursor-pointer items-center justify-center gap-2 px-5 py-4 text-sm font-black">
                  <ArrowRight className="size-4 rotate-180" /> กลับไปตรวจข้อความ
                </button>
                <button onClick={() => router.push('/estimate')} className="liquid-btn-primary flex flex-1 cursor-pointer items-center justify-center gap-2 px-5 py-4 text-sm font-black shadow-xl">
                  ประเมินค่ารักษาต่อ <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
