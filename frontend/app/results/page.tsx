'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EligibilityCard from '@/components/EligibilityCard';
import { AssessmentResult } from '@/types';
import {
  CheckCircle2,
  ShieldCheck,
  Printer,
  ArrowLeft,
  PhoneCall,
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
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 py-20 px-4 max-w-xl mx-auto text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">ไม่พบข้อมูลผลการประเมินสิทธิ</h2>
          <p className="text-muted-foreground">
            กรุณากรอกแบบประเมินสิทธิการรักษาพยาบาลเพื่อรับการวิเคราะห์สิทธิประโยชน์ข้ามกระทรวงและการประเมินค่าใช้จ่ายจาก AI
          </p>
          <div className="pt-2">
            <Link
              href="/assessment"
              className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold px-6 py-3 shadow-md hover:opacity-90 transition-all"
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
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <SiteHeader />
      <main className="flex-1 py-10 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-6 pb-16">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-90 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>รหัสประเมิน: {result.assessment_id} (PDPA Masked)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              สรุปสิทธิการรักษา & สวัสดิการข้ามกระทรวง
            </h1>
            <p className="opacity-90 text-sm sm:text-base font-medium">
              CarePulse AI รวบรวมสิทธิจาก สปสช., กระทรวง พม., กองทุนสุขภาพตำบล และประกันสังคม ให้ท่านครบในที่เดียว
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="print:hidden flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-5 rounded-2xl text-sm transition-all shadow-sm shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์เอกสารสรุป</span>
          </button>
        </div>

        {/* Cost Planning & Welfare Value Summary Card */}
        {result.cost_planning && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base sm:text-lg">
              <Banknote className="w-6 h-6 text-emerald-600" />
              <h2>ประมาณการค่ารักษาพยาบาล & สวัสดิการที่รัฐรองรับ (Financial Planning)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  มูลค่าความคุ้มครองโดยรัฐ
                </span>
                <p className="text-base sm:text-lg font-black text-emerald-950 leading-tight">
                  {result.cost_planning.total_estimated_benefit_value}
                </p>
              </div>

              <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 space-y-1">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                  ค่าใช้จ่ายส่วนเกิน (Out-of-Pocket)
                </span>
                <p className="text-base sm:text-lg font-black text-teal-950 leading-tight">
                  {result.cost_planning.estimated_out_of_pocket}
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-1">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5 text-amber-700" /> กายอุปกรณ์ที่ขอรับได้
                </span>
                <p className="text-base sm:text-lg font-black text-amber-950 leading-tight">
                  {result.cost_planning.eligible_equipment_count} หมวดหมู่ (เช่น เตียง, รถเข็น, ผ้าอ้อม)
                </p>
              </div>
            </div>

            {/* Agencies Involved */}
            {result.cost_planning.participating_agencies && result.cost_planning.participating_agencies.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1 text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> ฐานข้อมูลเชื่อมโยงจาก:
                </span>
                {result.cost_planning.participating_agencies.map((agency, idx) => (
                  <span key={idx} className="bg-slate-100 px-2.5 py-1 rounded-md font-medium text-slate-700">
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

        {/* Additional Cross-Agency Rights (e.g. MSDHS / Local Fund / Elderly / Bedridden) */}
        {result.additional_rights.length > 0 && (
          <div className="space-y-3 pt-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-teal-600" />
              2. สิทธิประโยชน์เพิ่มเติม & กายอุปกรณ์ข้ามกระทรวง (พม. / กองทุนสุขภาพตำบล)
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              คำแนะนำและขั้นตอนการติดต่อใช้สิทธิ:
            </h3>
            <ul className="space-y-2 text-slate-700 text-sm sm:text-base font-medium">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-lg leading-none">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Official References & Legal Acts Section */}
        {result.all_official_references && result.all_official_references.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              แหล่งอ้างอิงทางกฎหมายและระเบียบราชการที่คุ้มครองสิทธิ (Official Legal References):
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {result.all_official_references.map((ref, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">{ref.title}</span>
                    <span className="text-slate-600 font-medium">{ref.legal_act} — ออกโดย {ref.agency}</span>
                  </div>
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-3.5 py-1.5 rounded-xl shrink-0 text-center transition-all"
                    >
                      เปิดอ่านระเบียบทางการ ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Agency Hotline Directory */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
          <div>
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              ศูนย์ติดต่อสายด่วนภาครัฐที่เกี่ยวข้อง (โทรฟรี 24 ชั่วโมง)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              ท่านสามารถโทรสอบถามและยื่นเรื่องขอรับสิทธิหรือกายอุปกรณ์ได้โดยตรงผ่านหมายเลขด้านล่าง
            </p>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="tel:1330"
              className="bg-white/10 hover:bg-white/20 p-3.5 rounded-2xl border border-white/10 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs text-emerald-300 font-bold uppercase block">สปสช. (บัตรทอง)</span>
                <span className="text-xs text-slate-300">สิทธิ 30 บาทรักษาทุกที่</span>
              </div>
              <span className="text-lg font-black text-white mt-2 block">โทร 1330</span>
            </a>

            <a
              href="tel:1300"
              className="bg-white/10 hover:bg-white/20 p-3.5 rounded-2xl border border-white/10 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs text-teal-300 font-bold uppercase block">กระทรวง พม.</span>
                <span className="text-xs text-slate-300">ผู้สูงอายุ / คนพิการ / กายอุปกรณ์</span>
              </div>
              <span className="text-lg font-black text-white mt-2 block">โทร 1300</span>
            </a>

            <a
              href="tel:1506"
              className="bg-white/10 hover:bg-white/20 p-3.5 rounded-2xl border border-white/10 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs text-blue-300 font-bold uppercase block">ประกันสังคม (สปส.)</span>
                <span className="text-xs text-slate-300">ม.33, 39, 40 / ทันตกรรม</span>
              </div>
              <span className="text-lg font-black text-white mt-2 block">โทร 1506</span>
            </a>

            <a
              href="tel:1669"
              className="bg-red-500/20 hover:bg-red-500/30 p-3.5 rounded-2xl border border-red-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs text-red-300 font-bold uppercase block">ฉุกเฉินวิกฤต (UCEP)</span>
                <span className="text-xs text-slate-300">เข้า รพ. ใดก็ได้ ฟรี 72 ชม.</span>
              </div>
              <span className="text-lg font-black text-red-200 mt-2 block">โทร 1669</span>
            </a>
          </div>
        </div>

        {/* Back to Home button */}
        <div className="text-center pt-4 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-base transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับหน้าแรก</span>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
