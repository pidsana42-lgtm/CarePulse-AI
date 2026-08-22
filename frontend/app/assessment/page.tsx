'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitAssessment } from '@/lib/api';
import { AssessmentInput } from '@/types';
import { ShieldCheck, ArrowRight, Shield, Sparkles, User, FileText } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const INSURANCE_PROVIDERS = [
  'AIA',
  'เมืองไทยประกันชีวิต (MTL)',
  'FWD ประกันชีวิต',
  'กรุงเทพประกันชีวิต (BLA)',
  'ไทยประกันชีวิต',
  'SCB Protect',
  'Allianz Ayudhya',
  'ทิพยประกันภัย',
  'วิริยะประกันภัย',
  'อื่นๆ',
];

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
    has_private_insurance: false,
    private_insurance_type: 'health',
    private_insurance_provider: 'AIA',
    private_insurance_annual_limit: 500000,
  });

  const occupationOptions = [
    { value: 'senior', label: 'ผู้สูงอายุ (อายุ 60 ปีขึ้นไป)' },
    { value: 'freelance', label: 'ประชาชนทั่วไป / ค้าขาย / อาชีพอิสระ (สิทธิบัตรทอง)' },
    { value: 'private_employee', label: 'พนักงานบริษัทเอกชน (มีประกันสังคม ม.33/39)' },
    { value: 'gov_employee', label: 'ข้าราชการ / ลูกจ้างประจำ / รัฐวิสาหกิจ' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await submitAssessment(formData);
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
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Liquid Mesh Orbs */}
      <div className="liquid-mesh-orb-1 top-10 -left-10" />
      <div className="liquid-mesh-orb-2 top-1/2 right-0" />
      <div className="liquid-mesh-orb-3 bottom-0 left-1/4" />

      <SiteHeader />

      <main className="relative z-10 flex-1 py-10 px-4 sm:px-6 max-w-3xl mx-auto w-full space-y-6 animate-apple-fade-in">
        <div className="text-center space-y-2.5">
          <div className="liquid-glass-pill px-4 py-1 inline-flex items-center gap-1.5 text-xs font-black text-emerald-900 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            AI Multi-Agency Assessment Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            แบบประเมินสิทธิการรักษา & สวัสดิการ
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-medium max-w-lg mx-auto">
            คำนวณสิทธิการรักษาพยาบาลข้ามกระทรวง (สปสช., พม., กปท., ประกันสังคม) และวิเคราะห์ร่วมกับประกันเอกชนของคุณ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="liquid-glass rounded-[36px] p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Age Input */}
          <div className="space-y-2">
            <label className="block text-base sm:text-lg font-black text-slate-900">
              1. อายุของผู้ขอรับสิทธิ (ปี):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-28 px-4 py-3.5 text-2xl font-black text-center text-emerald-800 bg-white/90 border border-emerald-500/40 rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                required
              />
              <span className="text-base font-bold text-slate-700">ปี</span>
              {formData.age >= 60 && (
                <span className="liquid-glass-pill text-xs bg-emerald-100/80 text-emerald-900 font-extrabold px-3 py-1.5">
                  สิทธิประโยชน์สำหรับผู้สูงอายุ (LTC / ผ้าอ้อมผู้ใหญ่)
                </span>
              )}
            </div>
          </div>

          {/* Occupation / Status */}
          <div className="space-y-2.5">
            <label className="block text-base sm:text-lg font-black text-slate-900">
              2. สถานะการทำงาน / สิทธิหลักปัจจุบัน:
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {occupationOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    formData.occupation_status === opt.value
                      ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 font-black shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white/80 border-black/[0.06] hover:bg-white text-slate-800 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="occupation"
                    value={opt.value}
                    checked={formData.occupation_status === opt.value}
                    onChange={() => setFormData({ ...formData, occupation_status: opt.value })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm sm:text-base">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Disability Card */}
          <div className="space-y-2.5">
            <label className="block text-base sm:text-lg font-black text-slate-900">
              3. มีสมุด/บัตรประจำตัวคนพิการหรือไม่:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_disability_card: false })}
                className={`py-4 rounded-2xl font-black text-sm sm:text-base border transition-all duration-200 cursor-pointer ${
                  !formData.has_disability_card
                    ? 'liquid-btn-primary shadow-lg'
                    : 'liquid-btn-secondary'
                }`}
              >
                ไม่มี
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_disability_card: true })}
                className={`py-4 rounded-2xl font-black text-sm sm:text-base border transition-all duration-200 cursor-pointer ${
                  formData.has_disability_card
                    ? 'liquid-btn-primary shadow-lg'
                    : 'liquid-btn-secondary'
                }`}
              >
                มีบัตรคนพิการ (พม.)
              </button>
            </div>
          </div>

          {/* Private Insurance Section */}
          <div className="pt-4 border-t border-white/60 space-y-4">
            <div>
              <label className="block text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                4. คุณมี &quot;ประกันชีวิต / ประกันสุขภาพเอกชน&quot; หรือไม่?
              </label>
              <p className="text-xs text-slate-500 mt-1">
                ระบบจะคำนวณการใช้สิทธิคู่ขนานระหว่างสิทธิรัฐและประกันเอกชน เพื่อลดค่าใช้จ่ายส่วนเกิน
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_private_insurance: false })}
                className={`py-3.5 rounded-2xl font-bold text-sm sm:text-base border transition-all duration-200 cursor-pointer ${
                  !formData.has_private_insurance
                    ? 'liquid-btn-primary shadow-md'
                    : 'liquid-btn-secondary'
                }`}
              >
                ไม่มีประกันเอกชน
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_private_insurance: true })}
                className={`py-3.5 rounded-2xl font-bold text-sm sm:text-base border transition-all duration-200 cursor-pointer ${
                  formData.has_private_insurance
                    ? 'liquid-btn-primary shadow-md'
                    : 'liquid-btn-secondary'
                }`}
              >
                มีประกันเอกชน
              </button>
            </div>

            {/* Expanded Private Insurance Details */}
            {formData.has_private_insurance && (
              <div className="liquid-glass-card rounded-[24px] p-5 space-y-4 animate-apple-fade-in">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase">
                    ประเภทกรมธรรม์ประกัน:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'health', label: 'ประกันสุขภาพ' },
                      { id: 'life', label: 'ประกันชีวิต' },
                      { id: 'both', label: 'มีทั้งสองอย่าง' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, private_insurance_type: t.id })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all duration-200 cursor-pointer ${
                          formData.private_insurance_type === t.id
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white/80 text-slate-700 border-white/80 hover:bg-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      บริษัทประกัน:
                    </label>
                    <select
                      value={formData.private_insurance_provider || 'AIA'}
                      onChange={(e) => setFormData({ ...formData, private_insurance_provider: e.target.value })}
                      className="w-full px-3.5 py-3 bg-white/90 border border-black/[0.08] rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    >
                      {INSURANCE_PROVIDERS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      วงเงินคุ้มครองต่อปี (บาทโดยประมาณ):
                    </label>
                    <input
                      type="number"
                      step={50000}
                      min={0}
                      value={formData.private_insurance_annual_limit || 500000}
                      onChange={(e) => setFormData({ ...formData, private_insurance_annual_limit: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-3 bg-white/90 border border-black/[0.08] rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      placeholder="เช่น 500,000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Optional Thai Citizen ID */}
          <div className="pt-4 border-t border-white/60 space-y-1">
            <label className="block text-base font-black text-slate-900">
              5. เลขบัตรประชาชน 13 หลัก (ไม่บังคับ - ปลอดภัยตาม PDPA):
            </label>
            <input
              type="text"
              maxLength={13}
              placeholder="1-XXXX-XXXXX-XX-X"
              value={formData.citizen_id}
              onChange={(e) => setFormData({ ...formData, citizen_id: e.target.value })}
              className="w-full px-4 py-3.5 bg-white/90 border border-black/[0.08] rounded-2xl text-base focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none font-medium shadow-inner"
            />
            <div className="flex items-center gap-1.5 pt-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ระบบจะทำการ Masking เลขประจำตัวและเข้ารหัสตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="liquid-btn-primary w-full flex items-center justify-center gap-2 py-4 px-6 text-lg sm:text-xl font-black shadow-xl cursor-pointer"
          >
            {loading ? (
              <span>กำลังคำนวณสิทธิการรักษาและประสานสิทธิ...</span>
            ) : (
              <>
                <span>ดูผลการประเมินสิทธิ & วางแผนค่าใช้จ่าย</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
