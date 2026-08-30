'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/CameraCapture';
import { uploadDocument } from '@/lib/api';
import { DocumentScanResult } from '@/types';
import {
  ShieldCheck,
  ArrowRight,
  FileCheck,
  Stethoscope,
  PackageCheck,
  Building2,
  Sparkles,
  HeartHandshake,
  FileText,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { rememberDocumentInsight } from '@/lib/session-memory';

const DOC_TYPES = [
  { id: 'medical_certificate', label: 'ใบรับรองแพทย์ / ผลตรวจ', icon: Stethoscope, desc: 'ใบรับรองแพทย์ทั่วไป, ผลวินิจฉัยโรค, ระบุความจำเป็นอุปกรณ์' },
  { id: 'referral_letter', label: 'ใบส่งตัว / บันทึกประวัติ', icon: FileText, desc: 'ใบส่งตัว รพ., สมุดบันทึกการรักษา, ผลแล็บ' },
];

export default function ScanPage() {
  const router = useRouter();
  const [docType, setDocType] = useState<string>('medical_certificate');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResults, setScanResults] = useState<Array<{ fileName: string; result: DocumentScanResult }>>([]);
  const [captureResetKey, setCaptureResetKey] = useState(0);

  const resetScan = () => {
    setScanResults([]);
    setCaptureResetKey((current) => current + 1);
  };

  const handleImagesCaptured = async (files: File[]) => {
    if (files.length === 0) return;
    setIsLoading(true);
    try {
      const completed = await Promise.allSettled(
        files.map(async (file) => ({ fileName: file.name, result: await uploadDocument(file, docType) })),
      );
      const successful = completed
        .filter((item): item is PromiseFulfilledResult<{ fileName: string; result: DocumentScanResult }> => item.status === 'fulfilled')
        .map((item) => item.value);
      const failedCount = completed.length - successful.length;
      if (successful.length > 0) {
        successful.forEach(({ fileName, result }) => rememberDocumentInsight(result, fileName));
        setScanResults((current) => [...current, ...successful]);
      }
      if (failedCount > 0) alert(`มีเอกสาร ${failedCount} ใบที่ไม่สามารถวิเคราะห์ได้ กรุณาตรวจรูปแบบไฟล์แล้วลองใหม่`);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const extractedItems = scanResults.map(({ fileName, result }) => ({ fileName, data: result.extracted_data || {} }));
  const extracted = {
    ocr_raw_text: extractedItems
      .filter(({ data }) => data.ocr_raw_text && data.ocr_raw_text !== 'อ่านข้อมูลภาพเรียบร้อยแล้ว (ไม่พบตัวอักษรพิมพ์ชัดเจน)')
      .map(({ fileName, data }) => `เอกสาร: ${fileName}\n${data.ocr_raw_text}`)
      .join('\n\n'),
    ocr_engine: Array.from(new Set(extractedItems.map(({ data }) => data.ocr_engine).filter(Boolean))).join(', '),
    ai_clinical_summary: extractedItems
      .filter(({ data }) => data.ai_clinical_summary)
      .map(({ fileName, data }) => `${fileName}\n${data.ai_clinical_summary}`)
      .join('\n\n'),
    official_references: extractedItems.flatMap(({ data }) => data.official_references || []),
  };
  const matchedEquipment: Array<{ item: string; agency: string; cost_saved: string; how_to_claim: string }> =
    Array.from(new Map(
      extractedItems
        .flatMap(({ data }) => data.matched_equipment || [])
        .map((item) => [`${item.item}-${item.agency}`, item]),
    ).values());
  const eligibleSchemes: Array<{ scheme: string; agency: string; benefit: string; contact: string }> =
    Array.from(new Map(
      extractedItems
        .flatMap(({ data }) => data.eligible_schemes || [])
        .map((item) => [`${item.scheme}-${item.agency}`, item]),
    ).values());
  const ocrConfidence = scanResults.length > 0
    ? scanResults.reduce((sum, item) => sum + item.result.ocr_confidence, 0) / scanResults.length
    : 0;
  const needsManualReview = ocrConfidence < 0.8;

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

        <section className="rounded-[32px] bg-white p-5 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-8">
          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#424245]">
              เลือกประเภทเอกสารทางการแพทย์
            </label>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DOC_TYPES.map((item) => {
              const Icon = item.icon;
              const isSelected = docType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDocType(item.id)}
                  className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl px-5 py-4 text-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#115af2] text-white shadow-[0_12px_28px_-18px_rgba(17,90,242,0.85)]'
                      : 'bg-[#f5f5f7] text-slate-800 hover:bg-[#ececf0]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-cyan-600'}`} />
                    <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{item.label}</span>
                  </div>
                  <span className={`text-xs font-medium leading-relaxed text-center w-full ${isSelected ? 'text-cyan-50' : 'text-slate-500'}`}>
                    {item.desc}
                  </span>
                </button>
              );
            })}
            </div>
          </div>

          <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl bg-[#fff7e5] px-4 py-4 text-amber-950 sm:px-5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <strong className="block text-sm">คำเตือน</strong>
              <p className="mt-1 text-xs leading-relaxed">AI ช่วยคัดกรองและเตรียมข้อมูลเท่านั้น ไม่ใช่ผลอนุมัติสิทธิ โปรดตรวจสอบกับหน่วยงานเจ้าของสิทธิหรือสถานพยาบาลก่อนนำข้อมูลไปใช้จริง</p>
            </div>
          </div>
        </section>

        {/* Camera / Upload Box */}
        <section className="rounded-[32px] bg-white p-5 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-8">
          <CameraCapture key={captureResetKey} onImagesCaptured={handleImagesCaptured} onReset={() => setScanResults([])} isLoading={isLoading} />
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3 rounded-[32px] bg-white py-12 text-center shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] animate-apple-fade-in">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-600 mx-auto" />
            <p className="text-slate-800 font-black text-base">AI กำลังอ่านและวิเคราะห์เอกสารทุกใบ...</p>
          </div>
        )}

        {/* Scan Results */}
        {!isLoading && scanResults.length > 0 && (
          <div className="space-y-6 rounded-[32px] bg-white p-5 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-8 animate-apple-fade-in">

            {/* Result Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-cyan-950 font-black text-xl">
                <FileCheck className="w-7 h-7 text-cyan-600" />
                <span>ผลการวิเคราะห์เอกสาร {scanResults.length} ใบโดย AI</span>
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

            {/* Real OCR Text */}
            {extracted.ocr_raw_text && extracted.ocr_raw_text !== 'อ่านข้อมูลภาพเรียบร้อยแล้ว (ไม่พบตัวอักษรพิมพ์ชัดเจน)' && (
              <div className="space-y-2 rounded-2xl bg-[#f5f5f7] p-4">
                <div className="flex items-center justify-between text-slate-800 font-bold text-sm">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-600" />
                    ข้อความที่ระบบอ่านได้จากเอกสาร:
                  </span>
                  <span className="text-[11px] bg-black/[0.04] px-2.5 py-0.5 rounded-full font-bold text-slate-600">
                    อ่านอัตโนมัติ
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-3.5 font-mono text-xs leading-relaxed text-slate-800">
                  {extracted.ocr_raw_text}
                </div>
              </div>
            )}

            {/* AI Clinical Summary */}
            {extracted.ai_clinical_summary && (
              <div className="space-y-2 rounded-2xl bg-[#eef5ff] p-5">
                <h3 className="font-black text-cyan-950 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  บทวิเคราะห์สิทธิสุขภาพโดย AI:
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {extracted.ai_clinical_summary}
                </p>
              </div>
            )}

            {/* Matched Equipment */}
            {matchedEquipment.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-cyan-600" />
                  กายอุปกรณ์และสวัสดิการที่อาจเข้าเงื่อนไข ({matchedEquipment.length} รายการ):
                </h3>
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
                      <div className="rounded-xl bg-white p-3 text-xs font-semibold text-cyan-900">
                        วิธีขอรับสิทธิ: {eq.how_to_claim}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eligible Schemes */}
            {eligibleSchemes.length > 0 && (
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

            {/* Legal References */}
            {extracted.official_references && extracted.official_references.length > 0 && (
              <div className="space-y-2.5 rounded-2xl bg-[#f5f5f7] p-4">
                <div className="font-black text-slate-800 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  แหล่งอ้างอิงทางกฎหมาย:
                </div>
                <div className="space-y-2">
                  {extracted.official_references.map((ref: any, idx: number) => (
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
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={resetScan}
                className="liquid-btn-secondary flex-1 flex items-center justify-center gap-2 py-4 px-5 font-black text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                ล้างหน้าจอและสแกนใหม่
              </button>
              <button
                onClick={() => router.push('/estimate')}
                className="liquid-btn-primary flex-1 flex items-center justify-center gap-2 py-4 px-5 font-black text-sm shadow-xl cursor-pointer"
              >
                ประเมินค่ารักษาต่อ
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
