'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EligibilityCard from '@/components/EligibilityCard';
import { AssessmentResult } from '@/types';
import { CheckCircle2, ShieldCheck, Printer, ArrowLeft, PhoneCall, Sparkles, AlertTriangle } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('latest_assessment_result');
      if (stored) {
        setResult(JSON.parse(stored));
      } else {
        // Fallback default
        setResult({
          assessment_id: 'EVAL-DEMO-001',
          assessed_at: new Date().toISOString(),
          patient_summary: {
            citizen_id_masked: '1-XXXX-XXXXX-XX-9',
            age: 65,
            occupation_status: 'senior',
            registered_province: 'กรุงเทพมหานคร',
            urgency_level: 'normal',
          },
          primary_right: {
            scheme_code: 'UC',
            scheme_name: 'สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง 30 บาทรักษาทุกที่)',
            is_eligible: true,
            coverage_summary: 'ครอบคลุมการรักษาพยาบาลทุกโรคตามมาตรฐาน ค่ายา และการผ่าตัดฟรี',
            free_items: [
              'ตรวจรักษาโรคทั่วไป และโรคเรื้อรัง',
              'บริการทันตกรรม (ถอนฟัน อุดฟัน ขูดหินปูน ฟันเทียม)',
              'ยาในบัญชียาหลักแห่งชาติ',
              'รับยาใกล้บ้านที่ร้านยาคุณภาพ',
            ],
            co_pay_items: ['ยานอกบัญชียาหลักที่ไม่มีข้อบ่งชี้ทางการแพทย์', 'ค่าห้องพิเศษส่วนเกิน'],
            how_to_use: 'ใช้บัตรประชาชนใบเดียว เข้ารับบริการที่หน่วยบริการปฐมภูมิ หรือโรงพยาบาลตามสิทธิ',
            hospital_network: 'หน่วยบริการปฐมภูมิ คลินิกชุมชนอบอุ่น และ รพ.รัฐประจำเขต',
          },
          additional_rights: [
            {
              scheme_code: 'ELDERLY_BENEFIT',
              scheme_name: 'สิทธิและสวัสดิการผู้สูงอายุ (60 ปีขึ้นไป)',
              is_eligible: true,
              coverage_summary: 'บริการช่องทางด่วน คลินิกผู้สูงอายุ ผ้าอ้อมผู้ใหญ่ และวัคซีนไข้หวัดใหญ่ฟรี',
              free_items: ['ผ้าอ้อมผู้ใหญ่และแผ่นรองซับ', 'ตรวจคัดกรองภาวะสมองเสื่อม', 'วัคซีนไข้หวัดใหญ่ฟรีทุกปี'],
              co_pay_items: [],
              how_to_use: 'ติดต่อแผนกผู้สูงอายุ หรือ รพ.สต. ใกล้บ้าน',
              hospital_network: 'สถานพยาบาลของรัฐทุกแห่ง',
            },
          ],
          recommendations: [
            'ท่านสามารถใช้บริการ 30 บาทรักษาทุกที่ ได้ที่หน่วยบริการปฐมภูมิหรือคลินิกชุมชนอบอุ่น',
            'สิทธิครอบคลุมการตรวจสุขภาพประจำปีฟรีสำหรับผู้สูงอายุ',
          ],
          pdpa_protected: true,
        });
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
      <div className="py-20 text-center text-slate-600">
        กำลังโหลดผลการประเมินสิทธิ...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-emerald-600 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> รหัสการประเมิน: {result.assessment_id} (PDPA Masked)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            สรุปผลการประเมินสิทธิการรักษา
          </h1>
          <p className="text-emerald-100 text-base mt-1">
            ท่านได้รับสิทธิการรักษาพยาบาลและการดูแลสุขภาพดังต่อไปนี้
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="print:hidden flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>พิมพ์เอกสาร</span>
        </button>
      </div>

      {/* Primary Right */}
      <div className="space-y-3">
        <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          สิทธิการรักษาหลักของท่าน
        </h2>
        <EligibilityCard right={result.primary_right} isPrimary={true} />
      </div>

      {/* Additional Rights (e.g. Elderly Care, Disability) */}
      {result.additional_rights.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            สิทธิประโยชน์เพิ่มเติมที่ท่านได้รับ
          </h2>
          <div className="space-y-4">
            {result.additional_rights.map((r, i) => (
              <EligibilityCard key={i} right={r} isPrimary={false} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations & Useful Advice */}
      {result.recommendations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            ข้อแนะนำและคำแนะนำที่เป็นประโยชน์:
          </h3>
          <ul className="space-y-1.5 text-slate-700 text-sm sm:text-base font-medium">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hotline Support */}
      <div className="bg-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">สายด่วน สปสช. สอบถามสิทธิบัตรทอง</div>
            <div className="text-xs text-slate-500">โทรฟรีตลอด 24 ชั่วโมง</div>
          </div>
        </div>
        <a
          href="tel:1330"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-base shadow-sm"
        >
          โทร 1330
        </a>
      </div>

      {/* Back to Home button */}
      <div className="text-center pt-4 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-base"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>กลับหน้าแรก</span>
        </Link>
      </div>
    </div>
  );
}
