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
  FileText,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const DOC_TYPES = [
  { id: 'medical_certificate', label: 'ใบรับรองแพทย์ / ผลตรวจ', icon: Stethoscope, desc: 'ใบรับรองทั่วไป, ผลตรวจโรค, บันทึกอาการ' },
  { id: 'referral_letter', label: 'ใบส่งตัว / บันทึกประวัติ', icon: FileText, desc: 'ใบส่งตัว รพ., บันทึกการรักษา' },
  { id: 'id_card', label: 'เอกสารแสดงตน / บัตรสิทธิ', icon: ShieldCheck, desc: 'บัตรประชาชน, บัตรประกันสังคม' },
];

export default function ScanPage() {
  const router = useRouter();
  const [docType, setDocType] = useState<string>('medical_certificate');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);

  const handleImageCaptured = async (file: File) => {
    setIsLoading(true);
    setScanResult(null);
    try {
      const res = await uploadDocument(file, docType);
      setScanResult(res);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const extracted = scanResult?.extracted_data || {};
  const matchedEquipment: Array<{ item: string; agency: string; cost_saved: string; how_to_claim: string }> =
    extracted.matched_equipment || [];
  const eligibleSchemes: Array<{ scheme: string; agency: string; benefit: string; contact: string }> =
    extracted.eligible_schemes || [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1 py-10 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-6 pb-24">

        {/* Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-emerald-700" />
            AI Medical Document Analyzer
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            สแกนใบรับรองแพทย์<br />
            <span className="text-emerald-600">วิเคราะห์สิทธิด้วย AI</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed">
            ถ่ายรูปหรืออัปโหลดใบรับรองแพทย์ — ระบบจะอ่านผลวินิจฉัยและประเมินสิทธิขอรับกายอุปกรณ์ (เตียง, รถเข็น, ผ้าอ้อมผู้ใหญ่ กปท.) อัตโนมัติ ปกปิดข้อมูลส่วนบุคคลตามมาตรฐาน PDPA
          </p>
        </div>

        {/* Document Type Selector */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <label className="block text-sm font-bold text-slate-800">
            เลือกประเภทเอกสารทางการแพทย์:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DOC_TYPES.map((item) => {
              const Icon = item.icon;
              const isSelected = docType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDocType(item.id)}
                  className={`flex flex-col items-start gap-1 py-3.5 px-4 rounded-2xl text-left border-2 transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  <span className={`text-xs font-medium ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Camera / Upload Box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
          <CameraCapture onImageCaptured={handleImageCaptured} isLoading={isLoading} />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white border-2 border-emerald-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-slate-700 font-bold text-base">AI กำลังอ่านและวิเคราะห์เอกสาร...</p>
            <p className="text-slate-400 text-sm">OCR + Qwen Clinical Reasoning Engine</p>
          </div>
        )}

        {/* Scan Results */}
        {!isLoading && scanResult && (
          <div className="bg-white border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 space-y-7 shadow-xl">

            {/* Result Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-xl">
                <FileCheck className="w-7 h-7 text-emerald-600" />
                <span>ผลการวิเคราะห์เอกสารโดย AI</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-950 font-extrabold px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                PDPA Protected
              </div>
            </div>

            {/* Real OCR Text */}
            {extracted.ocr_raw_text && extracted.ocr_raw_text !== 'อ่านข้อมูลภาพเรียบร้อยแล้ว (ไม่พบตัวอักษรพิมพ์ชัดเจน)' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-700 font-bold text-sm">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    ข้อความที่อ่านได้จากภาพ (Real OCR):
                  </span>
                  <span className="text-[11px] bg-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-600">
                    {extracted.ocr_engine || 'Auto'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-slate-800 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed text-xs">
                  {extracted.ocr_raw_text}
                </div>
              </div>
            )}

            {/* AI Clinical Summary */}
            {extracted.ai_clinical_summary && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
                <h3 className="font-extrabold text-emerald-950 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
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
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-teal-600" />
                  กายอุปกรณ์และสวัสดิการที่ขอรับได้ ({matchedEquipment.length} รายการ):
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {matchedEquipment.map((eq, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">{eq.item}</span>
                        <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-lg">
                          {eq.cost_saved}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        หน่วยงาน: <strong>{eq.agency}</strong>
                      </div>
                      <div className="text-xs text-teal-800 bg-teal-50 border border-teal-100 p-2.5 rounded-xl font-semibold">
                        📌 {eq.how_to_claim}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eligible Schemes */}
            {eligibleSchemes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-emerald-600" />
                  สิทธิการรักษาและดูแลระยะยาว (LTC):
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {eligibleSchemes.map((sc, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                      <span className="font-bold text-slate-900 text-sm block">{sc.scheme}</span>
                      <p className="text-xs text-slate-500 leading-relaxed">{sc.benefit}</p>
                      <span className="text-xs text-emerald-700 font-semibold block">ติดต่อ: {sc.contact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal References */}
            {extracted.official_references && extracted.official_references.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="font-extrabold text-slate-800 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  แหล่งอ้างอิงทางกฎหมาย (Legal Citations):
                </div>
                <div className="space-y-1.5">
                  {extracted.official_references.map((ref: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{ref.title}</span>
                        <span className="text-slate-400 font-medium">{ref.legal_act} — {ref.agency}</span>
                      </div>
                      {ref.url && (
                        <a href={ref.url} target="_blank" rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-bold shrink-0 whitespace-nowrap">
                          อ่านระเบียบ ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDPA Masked Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-400 uppercase tracking-wide text-xs">
                Masked Preview (PDPA)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {Object.entries(scanResult.masked_preview).map(([key, val]) => (
                  <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between gap-2">
                    <span className="font-medium text-slate-400 truncate">{key}:</span>
                    <span className="font-bold text-slate-800 text-right">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={() => { setScanResult(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 border-2 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm rounded-2xl transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                สแกนใหม่
              </button>
              <button
                onClick={() => router.push('/assessment')}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all"
              >
                ไปที่แบบประเมินสิทธิรวม
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
