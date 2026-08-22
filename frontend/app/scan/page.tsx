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
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Liquid Mesh Orbs */}
      <div className="liquid-mesh-orb-1 top-10 -left-10" />
      <div className="liquid-mesh-orb-2 top-1/3 right-0" />
      <div className="liquid-mesh-orb-3 bottom-0 left-1/4" />

      <SiteHeader />

      <main className="relative z-10 flex-1 py-10 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-7 pb-24 animate-apple-fade-in">

        {/* Page Header */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            สแกนใบรับรองแพทย์<br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              วิเคราะห์สิทธิด้วย AI
            </span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-xl mx-auto">
            ถ่ายรูปหรืออัปโหลดใบรับรองแพทย์ — AI จะอ่านผลวินิจฉัยและประเมินสิทธิขอรับกายอุปกรณ์ (เตียง, รถเข็น, ผ้าอ้อมผู้ใหญ่) พร้อมปกปิดข้อมูลส่วนบุคคล (PDPA)
          </p>
        </div>

        {/* Document Type Selector */}
        <div className="liquid-glass rounded-[32px] p-6 shadow-xl space-y-3.5">
          <label className="block text-sm font-black text-slate-900">
            เลือกประเภทเอกสารทางการแพทย์:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DOC_TYPES.map((item) => {
              const Icon = item.icon;
              const isSelected = docType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDocType(item.id)}
                  className={`flex flex-col items-start gap-1.5 py-4 px-4.5 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-lg ring-4 ring-emerald-500/20 scale-[1.02]'
                      : 'bg-white/80 text-slate-800 border-black/[0.08] hover:bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                    <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{item.label}</span>
                  </div>
                  <span className={`text-xs font-medium leading-relaxed ${isSelected ? 'text-emerald-50' : 'text-slate-500'}`}>
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Camera / Upload Box */}
        <div className="liquid-glass rounded-[32px] p-6 sm:p-8 shadow-2xl">
          <CameraCapture onImageCaptured={handleImageCaptured} isLoading={isLoading} />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="liquid-glass rounded-[32px] p-12 text-center space-y-3 shadow-xl animate-apple-fade-in">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-slate-800 font-black text-base">AI กำลังอ่านและวิเคราะห์เอกสาร...</p>
            <p className="text-slate-400 text-xs font-semibold">OCR + Qwen Clinical Reasoning Engine</p>
          </div>
        )}

        {/* Scan Results */}
        {!isLoading && scanResult && (
          <div className="liquid-glass rounded-[36px] p-6 sm:p-9 space-y-7 shadow-2xl animate-apple-fade-in border-2 border-emerald-500/30">

            {/* Result Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
              <div className="flex items-center gap-2.5 text-emerald-950 font-black text-xl">
                <FileCheck className="w-7 h-7 text-emerald-600" />
                <span>ผลการวิเคราะห์เอกสารโดย AI</span>
              </div>
              <div className="liquid-glass-pill px-3.5 py-1 text-xs bg-emerald-100/80 text-emerald-900 font-extrabold flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                PDPA Protected
              </div>
            </div>

            {/* Real OCR Text */}
            {extracted.ocr_raw_text && extracted.ocr_raw_text !== 'อ่านข้อมูลภาพเรียบร้อยแล้ว (ไม่พบตัวอักษรพิมพ์ชัดเจน)' && (
              <div className="liquid-glass-card rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between text-slate-800 font-bold text-sm">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    ข้อความที่อ่านได้จากภาพ (Real OCR):
                  </span>
                  <span className="text-[11px] bg-black/[0.04] px-2.5 py-0.5 rounded-full font-bold text-slate-600">
                    {extracted.ocr_engine || 'Auto'}
                  </span>
                </div>
                <div className="bg-white/80 p-3.5 rounded-xl border border-black/[0.04] font-mono text-slate-800 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed text-xs">
                  {extracted.ocr_raw_text}
                </div>
              </div>
            )}

            {/* AI Clinical Summary */}
            {extracted.ai_clinical_summary && (
              <div className="liquid-glass-card bg-emerald-50/80 rounded-2xl p-5 space-y-2 border border-emerald-300/40">
                <h3 className="font-black text-emerald-950 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
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
                  <PackageCheck className="w-5 h-5 text-teal-600" />
                  กายอุปกรณ์และสวัสดิการที่ขอรับได้ ({matchedEquipment.length} รายการ):
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {matchedEquipment.map((eq, i) => (
                    <div key={i} className="liquid-glass-card rounded-2xl p-4.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">{eq.item}</span>
                        <span className="liquid-glass-pill bg-emerald-100/90 text-emerald-900 text-xs font-black px-3 py-1">
                          {eq.cost_saved}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        หน่วยงาน: <strong>{eq.agency}</strong>
                      </div>
                      <div className="text-xs text-teal-900 bg-teal-500/10 border border-teal-500/20 p-3 rounded-xl font-semibold">
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
                  <HeartHandshake className="w-5 h-5 text-emerald-600" />
                  สิทธิการรักษาและดูแลระยะยาว (LTC):
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {eligibleSchemes.map((sc, i) => (
                    <div key={i} className="liquid-glass-card rounded-2xl p-4 space-y-1">
                      <span className="font-bold text-slate-900 text-sm block">{sc.scheme}</span>
                      <p className="text-xs text-slate-500 leading-relaxed">{sc.benefit}</p>
                      <span className="text-xs text-emerald-700 font-bold block">ติดต่อ: {sc.contact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal References */}
            {extracted.official_references && extracted.official_references.length > 0 && (
              <div className="liquid-glass-card rounded-2xl p-4.5 space-y-2.5">
                <div className="font-black text-slate-800 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  แหล่งอ้างอิงทางกฎหมาย (Legal Citations):
                </div>
                <div className="space-y-2">
                  {extracted.official_references.map((ref: any, idx: number) => (
                    <div key={idx} className="bg-white/80 p-3.5 rounded-xl border border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => { setScanResult(null); }}
                className="liquid-btn-secondary flex-1 flex items-center justify-center gap-2 py-4 px-5 font-black text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                สแกนใหม่
              </button>
              <button
                onClick={() => router.push('/assessment')}
                className="liquid-btn-primary flex-1 flex items-center justify-center gap-2 py-4 px-5 font-black text-sm shadow-xl cursor-pointer"
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
