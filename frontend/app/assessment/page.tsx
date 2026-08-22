'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitAssessment } from '@/lib/api';
import { AssessmentInput } from '@/types';
import { ShieldCheck, UserCheck, Stethoscope, AlertCircle, ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function AssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<AssessmentInput>({
    citizen_id: '',
    age: 65,
    occupation_status: 'senior',
    registered_province: 'กรุงเทพมหานคร',
    has_disability_card: false,
    chronic_conditions: [],
    urgency_level: 'normal',
  });

  const occupationOptions = [
    { value: 'senior', label: 'ผู้สูงอายุ (อายุ 60 ปีขึ้นไป)' },
    { value: 'freelance', label: 'ประชาชนทั่วไป / ค้าขาย / อาชีพอิสระ' },
    { value: 'private_employee', label: 'พนักงานบริษัทเอกชน (มีประกันสังคม)' },
    { value: 'gov_employee', label: 'ข้าราชการ / ลูกจ้างประจำ / รัฐวิสาหกิจ' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await submitAssessment(formData);
      // Save result in session storage for result page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('latest_assessment_result', JSON.stringify(result));
      }
      router.push('/results');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการประเมินสิทธิ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-10 px-4 sm:px-6 max-w-3xl mx-auto w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            แบบประเมินสิทธิการรักษาพยาบาล
          </h1>
        <p className="text-slate-600 mt-1 text-base">
          กรอกข้อมูลง่ายๆ เพียงไม่กี่ข้อ เพื่อค้นหาสิทธิประโยชน์ที่ท่านได้รับฟรี
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Age Input */}
        <div>
          <label className="block text-lg font-bold text-slate-800 mb-2">
            1. อายุของผู้ขอรับสิทธิ (ปี):
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="120"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
              className="w-32 px-4 py-3 text-2xl font-black text-center text-emerald-700 bg-emerald-50 border-2 border-emerald-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
              required
            />
            <span className="text-lg font-semibold text-slate-700">ปี</span>
            {formData.age >= 60 && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full">
                ✨ มีสิทธิประโยชน์สำหรับผู้สูงอายุ
              </span>
            )}
          </div>
        </div>

        {/* Occupation / Status */}
        <div>
          <label className="block text-lg font-bold text-slate-800 mb-2">
            2. สถานะการทำงาน / อาชีพ:
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {occupationOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.occupation_status === opt.value
                    ? 'bg-emerald-50/70 border-emerald-600 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="occupation"
                  value={opt.value}
                  checked={formData.occupation_status === opt.value}
                  onChange={() => setFormData({ ...formData, occupation_status: opt.value })}
                  className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-base">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Disability Card */}
        <div>
          <label className="block text-lg font-bold text-slate-800 mb-2">
            3. มีสมุด/บัตรประจำตัวคนพิการหรือไม่:
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, has_disability_card: false })}
              className={`flex-1 py-3 rounded-xl font-bold text-base border-2 transition-all ${
                !formData.has_disability_card
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              ไม่มี
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, has_disability_card: true })}
              className={`flex-1 py-3 rounded-xl font-bold text-base border-2 transition-all ${
                formData.has_disability_card
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              มีบัตรคนพิการ
            </button>
          </div>
        </div>

        {/* Optional Thai Citizen ID for exact lookup */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-base font-bold text-slate-800 mb-1">
            4. เลขบัตรประชาชน 13 หลัก (ไม่บังคับ - ปลอดภัยตาม PDPA):
          </label>
          <input
            type="text"
            maxLength={13}
            placeholder="1-XXXX-XXXXX-XX-X"
            value={formData.citizen_id}
            onChange={(e) => setFormData({ ...formData, citizen_id: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ระบบจะทำการ Masking เลขประจำตัวและไม่เปิดเผยต่อสาธารณะ</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary hover:opacity-90 active:scale-98 text-primary-foreground font-extrabold text-xl rounded-xl shadow-lg transition-all"
        >
          {loading ? (
            <span>กำลังคำนวณสิทธิการรักษา...</span>
          ) : (
            <>
              <span>ดูผลการประเมินสิทธิ</span>
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </form>
      </main>
      <SiteFooter />
    </div>
  );
}
