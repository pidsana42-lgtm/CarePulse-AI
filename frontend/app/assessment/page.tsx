'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitAssessment } from '@/lib/api';
import { AssessmentInput } from '@/types';
import { ShieldCheck, UserCheck, Stethoscope, AlertCircle, ArrowRight, HeartHandshake, Shield, Sparkles, Building } from 'lucide-react';
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
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <SiteHeader />
      <main className="flex-1 py-10 px-4 sm:px-6 max-w-3xl mx-auto w-full space-y-6 animate-fade-in-up">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI Multi-Agency Assessment Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            แบบประเมินสิทธิการรักษา & สวัสดิการรวม
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-medium max-w-xl mx-auto">
            คำนวณสิทธิการรักษาพยาบาลข้ามกระทรวง (สปสช., พม., กปท., ประกันสังคม) และวิเคราะห์ร่วมกับประกันเอกชนของคุณฟรี
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-7">
          {/* Age Input */}
          <div>
            <label className="block text-base sm:text-lg font-bold text-slate-900 mb-2">
              1. อายุของผู้ขอรับสิทธิ (ปี):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-28 px-4 py-3 text-2xl font-black text-center text-emerald-700 bg-emerald-50 border-2 border-emerald-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                required
              />
              <span className="text-base font-semibold text-slate-700">ปี</span>
              {formData.age >= 60 && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full">
                  ✨ มีสิทธิประโยชน์สำหรับผู้สูงอายุ (LTC / ผ้าอ้อมผู้ใหญ่)
                </span>
              )}
            </div>
          </div>

          {/* Occupation / Status */}
          <div>
            <label className="block text-base sm:text-lg font-bold text-slate-900 mb-2">
              2. สถานะการทำงาน / สิทธิหลักปัจจุบัน:
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {occupationOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.occupation_status === opt.value
                      ? 'bg-emerald-50/80 border-emerald-600 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
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
          <div>
            <label className="block text-base sm:text-lg font-bold text-slate-900 mb-2">
              3. มีสมุด/บัตรประจำตัวคนพิการหรือไม่:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_disability_card: false })}
                className={`py-3.5 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${
                  !formData.has_disability_card
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ไม่มี
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_disability_card: true })}
                className={`py-3.5 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${
                  formData.has_disability_card
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                มีบัตรคนพิการ (พม.)
              </button>
            </div>
          </div>

          {/* Private Insurance Section */}
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  4. คุณมี &quot;ประกันชีวิต / ประกันสุขภาพเอกชน&quot; หรือไม่?
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบบจะคำนวณการใช้สิทธิคู่ขนานระหว่างสิทธิรัฐและประกันเอกชน เพื่อลดค่าใช้จ่ายส่วนเกิน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_private_insurance: false })}
                className={`py-3.5 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${
                  !formData.has_private_insurance
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ไม่มีประกันเอกชน
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_private_insurance: true })}
                className={`py-3.5 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${
                  formData.has_private_insurance
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                มีประกันเอกชน
              </button>
            </div>

            {/* Expanded Private Insurance Details */}
            {formData.has_private_insurance && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-4 animate-fade-in-up">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
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
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          formData.private_insurance_type === t.id
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="เช่น 500,000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Optional Thai Citizen ID */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-base font-bold text-slate-900 mb-1">
              5. เลขบัตรประชาชน 13 หลัก (ไม่บังคับ - ปลอดภัยตาม PDPA):
            </label>
            <input
              type="text"
              maxLength={13}
              placeholder="1-XXXX-XXXXX-XX-X"
              value={formData.citizen_id}
              onChange={(e) => setFormData({ ...formData, citizen_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none font-medium"
            />
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ระบบจะทำการ Masking เลขประจำตัวและเข้ารหัสตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-lg transition-all"
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
