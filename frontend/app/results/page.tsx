'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EligibilityCard from '@/components/EligibilityCard';
import { AssessmentResult } from '@/types';
import {
  ShieldCheck,
  Printer,
  Sparkles,
  AlertTriangle,
  Banknote,
  PackageCheck,
  Building2,
  HeartHandshake
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('latest_assessment_result');
      if (stored) {
        setResult(JSON.parse(stored));
      }
    }
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!result) {
    return (
      <div className="relative min-h-screen flex flex-col overflow-x-clip">
        <div className="liquid-mesh-orb-1 top-20 left-10" />
        <SiteHeader />
        <main className="relative z-10 flex-1 py-20 px-4 max-w-xl mx-auto text-center space-y-5">
          <div className="liquid-glass size-20 rounded-full flex items-center justify-center mx-auto shadow-xl">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">ไม่พบข้อมูลผลการประเมินสิทธิ</h2>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            กรุณากรอกแบบประเมินสิทธิการรักษาพยาบาลเพื่อรับการวิเคราะห์สิทธิประโยชน์ข้ามกระทรวงและการประเมินค่าใช้จ่ายจาก AI
          </p>
          <div className="pt-2">
            <Link
              href="/assessment"
              className="liquid-btn-primary inline-flex items-center justify-center px-8 py-3.5 text-base font-black shadow-lg"
            >
              ทำแบบประเมินสิทธิใหม่
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-clip">
      {/* Background Liquid Mesh Orbs */}
      <div className="liquid-mesh-orb-1 top-10 -left-10" />
      <div className="liquid-mesh-orb-2 top-1/2 right-0" />
      <div className="liquid-mesh-orb-3 bottom-0 left-1/4" />

      <SiteHeader />

      <main className="relative z-10 flex-1 py-10 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-7 pb-20 animate-apple-fade-in">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-emerald-600/95 via-teal-700/95 to-emerald-800/95 backdrop-blur-2xl text-white rounded-[36px] p-6 sm:p-9 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-5 border border-white/30">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-200">
              <ShieldCheck className="w-4 h-4  text-emerald-800/90" />
              <span className='text-emerald-800/90'>รหัสประเมิน: {result.assessment_id} (PDPA Protected)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              สรุปสิทธิการรักษา & สวัสดิการข้ามกระทรวง
            </h1>
            <p className="opacity-90 text-xs sm:text-sm font-medium text-slate-900">
              CarePulse AI รวบรวมสิทธิจาก สปสช., กระทรวง พม., กองทุนสุขภาพตำบล, ประกันสังคม และประกันเอกชน
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="print:hidden liquid-btn-secondary flex items-center gap-2 text-slate-900 font-black py-3 px-6 text-xs transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์เอกสารสรุป</span>
          </button>
        </div>

        {/* Cost Planning & Welfare Value Summary Card */}
        {result.cost_planning && (
          <div className="liquid-glass rounded-[32px] p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-base sm:text-lg">
              <Banknote className="w-6 h-6 text-emerald-600" />
              <h2>ประมาณการค่ารักษาพยาบาล & สวัสดิการที่รัฐรองรับ (Financial Planning)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="liquid-glass-card rounded-2xl p-4.5 space-y-1 bg-emerald-50/70 border-emerald-300/40">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                  มูลค่าความคุ้มครองโดยรัฐ
                </span>
                <p className="text-base sm:text-lg font-black text-emerald-950 leading-tight">
                  {result.cost_planning.total_estimated_benefit_value}
                </p>
              </div>

              <div className="liquid-glass-card rounded-2xl p-4.5 space-y-1 bg-teal-50/70 border-teal-300/40">
                <span className="text-xs font-black text-teal-900 uppercase tracking-wide">
                  ค่าใช้จ่ายส่วนเกิน (Out-of-Pocket)
                </span>
                <p className="text-base sm:text-lg font-black text-teal-950 leading-tight">
                  {result.cost_planning.estimated_out_of_pocket}
                </p>
              </div>

              <div className="liquid-glass-card rounded-2xl p-4.5 space-y-1 bg-amber-50/70 border-amber-300/40">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5 text-amber-700" /> กายอุปกรณ์ที่ขอรับได้
                </span>
                <p className="text-base sm:text-lg font-black text-amber-950 leading-tight">
                  {result.cost_planning.eligible_equipment_count} หมวดหมู่ (เตียง, รถเข็น, ผ้าอ้อม)
                </p>
              </div>
            </div>

            {/* Agencies Involved */}
            {result.cost_planning.participating_agencies && result.cost_planning.participating_agencies.length > 0 && (
              <div className="pt-3 border-t border-black/[0.05] flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1 text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> ฐานข้อมูลเชื่อมโยงจาก:
                </span>
                {result.cost_planning.participating_agencies.map((agency, idx) => (
                  <span key={idx} className="liquid-glass-pill px-3 py-1 font-bold text-slate-800 text-[11px]">
                    {agency}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Primary Right */}
        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            1. สิทธิการรักษาพยาบาลหลักของท่าน
          </h2>
          <EligibilityCard right={result.primary_right} isPrimary={true} />
        </div>

        {/* Additional Cross-Agency Rights (e.g. MSDHS / Local Fund / Elderly / Bedridden / Private Insurance) */}
        {result.additional_rights.length > 0 && (
          <div className="space-y-3 pt-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-teal-600" />
              2. สิทธิประโยชน์เพิ่มเติม & ประกันคู่ขนาน (พม. / กองทุนสุขภาพตำบล / ประกันเอกชน)
            </h2>
            <div className="space-y-4">
              {result.additional_rights.map((r, i) => (
                <EligibilityCard key={i} right={r} isPrimary={false} />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations & Actionable Steps */}
        {result.recommendations.length > 0 && (
          <div className="liquid-glass rounded-[32px] p-6 sm:p-8 shadow-lg space-y-3.5">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              คำแนะนำและขั้นตอนการติดต่อใช้สิทธิ:
            </h3>
            <ul className="space-y-2.5 text-slate-700 text-sm sm:text-base font-medium">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-black text-lg leading-none">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Official References & Legal Acts Section */}
        {result.all_official_references && result.all_official_references.length > 0 && (
          <div className="liquid-glass rounded-[32px] p-6 sm:p-8 shadow-lg space-y-3.5">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              แหล่งอ้างอิงทางกฎหมายและระเบียบราชการที่คุ้มครองสิทธิ (Official Legal References):
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {result.all_official_references.map((ref, idx) => (
                <div
                  key={idx}
                  className="liquid-glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-black text-slate-900 text-sm block">{ref.title}</span>
                    <span className="text-slate-500 font-medium">{ref.legal_act} — {ref.agency}</span>
                  </div>
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass-pill px-3.5 py-1.5 text-emerald-700 hover:text-emerald-900 font-bold shrink-0 block text-center"
                    >
                      เปิดระเบียบทางการ ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
