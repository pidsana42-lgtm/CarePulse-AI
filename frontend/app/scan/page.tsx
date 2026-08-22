'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/CameraCapture';
import { uploadDocument } from '@/lib/api';
import { DocumentScanResult } from '@/types';
import {
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  FileCheck,
  Stethoscope,
  PackageCheck,
  Building2,
  Sparkles,
  HeartHandshake,
  AlertCircle,
  FileText,
  HelpCircle
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function ScanPage() {
  const router = useRouter();
  const [docType, setDocType] = useState<string>('medical_certificate');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);

  const handleImageCaptured = async (file: File) => {
    setIsLoading(true);
    try {
      const res = await uploadDocument(file, docType);
      setScanResult(res);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดและวิเคราะห์เอกสาร กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToAssessment = () => {
    router.push('/assessment');
  };

  const extracted = scanResult?.extracted_data || {};
  const matchedEquipment: Array<{ item: string; agency: string; cost_saved: string; how_to_claim: string }> =
    extracted.matched_equipment || [];
  const eligibleSchemes: Array<{ scheme: string; agency: string; benefit: string; contact: string }> =
    extracted.eligible_schemes || [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <SiteHeader />
      <main className="flex-1 py-10 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-6 pb-20">
        {/* Header Title */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>AI Medical Document Analyzer</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            สแกนใบรับรองแพทย์ & วิเคราะห์สิทธิด้วย AI
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-medium">
            ถ่ายรูปหรืออัปโหลดใบรับรองแพทย์ / ใบส่งตัว ระบบ AI จะอ่านผลการวินิจฉัยและประเมินสิทธิขอรับกายอุปกรณ์ (เตียง, รถเข็น, ผ้าอ้อมผู้ใหญ่) ให้อัตโนมัติ พร้อมปกปิดข้อมูลส่วนบุคคล (PDPA)
          </p>
        </div>

        {/* Document Type Selector */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <label className="block text-sm font-bold text-slate-800">
            เลือกประเภทเอกสารทางการแพทย์ที่ต้องการสแกน:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'medical_certificate', label: 'ใบรับรองแพทย์ / ผลตรวจ', icon: Stethoscope },
              { id: 'referral_letter', label: 'ใบส่งตัว / บันทึกประวัติ', icon: FileText },
              { id: 'id_card', label: 'เอกสารแสดงตน / บัตรสิทธิ', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDocType(item.id)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                    docType === item.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Camera / Upload Capture Box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
          <CameraCapture onImageCaptured={handleImageCaptured} isLoading={isLoading} />
        </div>

        {/* AI Medical Analysis Results */}
        {scanResult && (
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in">
            {/* Header Result Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-xl">
                <FileCheck className="w-7 h-7 text-emerald-600" />
                <span>ผลการวิเคราะห์เอกสารทางการแพทย์โดย AI</span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-950 font-extrabold px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>PDPA Protected (เข้ารหัสแล้ว)</span>
              </div>
            </div>

            {/* Real OCR Extracted Text Preview */}
            {extracted.ocr_raw_text && extracted.ocr_raw_text !== "อ่านข้อมูลภาพเรียบร้อยแล้ว (ไม่พบตัวอักษรพิมพ์ชัดเจน)" && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    ข้อความจริงที่ระบบอ่านได้จากเอกสาร (Real OCR Extracted Text):
                  </span>
                  <span className="text-[11px] bg-slate-200/80 px-2 py-0.5 rounded-md font-semibold text-slate-600">
                    Engine: {extracted.ocr_engine || 'Auto'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-slate-800 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed text-[11px]">
                  {extracted.ocr_raw_text}
                </div>
              </div>
            )}

            {/* AI Clinical Summary */}
            {extracted.ai_clinical_summary && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-2">
                <h3 className="font-extrabold text-emerald-950 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                  บทวิเคราะห์สิทธิสุขภาพโดย AI:
                </h3>
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                  {extracted.ai_clinical_summary}
                </p>
              </div>
            )}

            {/* Matched Assistive Equipment (กายอุปกรณ์ที่เบิกได้) */}
            {matchedEquipment.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-teal-600" />
                  กายอุปกรณ์และสิทธิประโยชน์ที่ขอรับได้จากเอกสารนี้ ({matchedEquipment.length} รายการ):
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {matchedEquipment.map((eq, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-base">{eq.item}</span>
                        <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-md">
                          {eq.cost_saved}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 font-medium">
                        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>หน่วยงาน: <strong>{eq.agency}</strong></span>
                      </div>
                      <div className="text-xs sm:text-sm text-teal-800 bg-teal-50 border border-teal-100 p-2.5 rounded-xl font-semibold">
                        📌 วิธีขอรับสิทธิ: {eq.how_to_claim}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Schemes & LTC */}
            {eligibleSchemes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-emerald-600" />
                  สิทธิการรักษาพยาบาลและการดูแลระยะยาว (LTC) ที่ตรงกับเอกสาร:
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {eligibleSchemes.map((sc, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                      <span className="font-bold text-slate-900 text-sm block">{sc.scheme}</span>
                      <p className="text-xs text-slate-600">{sc.benefit}</p>
                      <span className="text-xs text-emerald-700 font-semibold block pt-1">
                        ติดต่อ: {sc.contact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Legal References (แหล่งอ้างอิงและระเบียบราชการ) */}
            {extracted.official_references && extracted.official_references.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 space-y-2 text-xs">
                <div className="font-extrabold text-slate-800 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>แหล่งอ้างอิงทางกฎหมายและระเบียบราชการที่รองรับ (Legal Citations):</span>
                </div>
                <div className="space-y-1.5">
                  {extracted.official_references.map((ref: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{ref.title}</span>
                        <span className="text-slate-500 font-medium">{ref.legal_act} — {ref.agency}</span>
                      </div>
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-bold shrink-0 text-[11px]"
                        >
                          อ่านระเบียบทางการ ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDPA Masked Details */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-500 uppercase tracking-wide">
                ข้อมูลภาพถ่ายเอกสารที่ประมวลผล (Masked Preview):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                {Object.entries(scanResult.masked_preview).map(([key, val]) => (
                  <div key={key} className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between">
                    <span className="font-medium text-slate-500">{key}:</span>
                    <span className="font-bold text-slate-800">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>


            {/* Navigation Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleProceedToAssessment}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-primary hover:opacity-90 active:scale-98 text-primary-foreground font-bold text-base sm:text-lg rounded-2xl shadow-md transition-all"
              >
                <span>ไปที่แบบประเมินสิทธิรวมข้ามกระทรวง</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
