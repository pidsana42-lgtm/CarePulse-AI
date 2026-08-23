'use client';

import React, { useState } from 'react';
import { submitAssessment } from '@/lib/api';
import { AssessmentInput, AssessmentResult } from '@/types';
import {
  ChevronDown,
  ShieldCheck,
  Loader2,
  Sparkles,
  ArrowUpRight,
  Banknote,
  PackageCheck,
  HeartHandshake,
} from 'lucide-react';

const OCCUPATION_OPTIONS = [
  { value: 'senior', label: 'ผู้สูงอายุ (60 ปีขึ้นไป)' },
  { value: 'freelance', label: 'ประชาชนทั่วไป / ค้าขาย (บัตรทอง)' },
  { value: 'private_employee', label: 'พนักงานบริษัทเอกชน (ประกันสังคม)' },
  { value: 'gov_employee', label: 'ข้าราชการ / รัฐวิสาหกิจ' },
];

export default function ChatAssessmentCard() {
  const [open, setOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [form, setForm] = useState<AssessmentInput>({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitAssessment(form);
      setResult(res);
      setOpen(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('latest_assessment_result', JSON.stringify(res));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="liquid-glass rounded-[28px] border border-white/90 shadow-lg overflow-hidden">
      {/* Header — always visible, click to toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer hover:bg-white/40 transition-all text-left"
      >
        <span className="flex items-center gap-2.5 text-sm font-black text-slate-900">
          <span className="size-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </span>
          {result ? 'ผลประเมินสิทธิของคุณ' : 'ประเมินสิทธิข้ามกระทรวงในแชทนี้'}
          <span className="liquid-glass-pill bg-emerald-100/90 text-emerald-900 text-[10px] px-2 py-0.5 font-black">
            กรอก 30 วินาที
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !result && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4 border-t border-white/60 pt-4 animate-apple-fade-in">
          {/* Age + Occupation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">อายุ (ปี)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white/90 border border-black/[0.08] rounded-xl text-sm font-bold text-center text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">สถานะการทำงาน / สิทธิหลัก</label>
              <select
                value={form.occupation_status}
                onChange={(e) => setForm({ ...form, occupation_status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white/90 border border-black/[0.08] rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                {OCCUPATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Disability + Insurance toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">บัตรคนพิการ (พม.)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, has_disability_card: false })}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${!form.has_disability_card ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white/80 text-slate-600 border-white/80'}`}
                >
                  ไม่มี
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, has_disability_card: true })}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${form.has_disability_card ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white/80 text-slate-600 border-white/80'}`}
                >
                  มี
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">ประกันเอกชน</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, has_private_insurance: false })}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${!form.has_private_insurance ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white/80 text-slate-600 border-white/80'}`}
                >
                  ไม่มี
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, has_private_insurance: true })}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${form.has_private_insurance ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white/80 text-slate-600 border-white/80'}`}
                >
                  มี
                </button>
              </div>
            </div>
          </div>

          {/* Citizen ID (optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700">
              เลขบัตรประชาชน 13 หลัก <span className="font-medium text-slate-400">(ไม่บังคับ · PDPA)</span>
            </label>
            <input
              type="text"
              maxLength={13}
              placeholder="1-XXXX-XXXXX-XX-X"
              value={form.citizen_id}
              onChange={(e) => setForm({ ...form, citizen_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white/90 border border-black/[0.08] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="liquid-btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-black cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> กำลังคำนวณสิทธิ...
              </>
            ) : (
              'คำนวณสิทธิข้ามกระทรวง'
            )}
          </button>
        </form>
      )}

      {/* Result summary — collapsible */}
      {open && result && (
        <div className="border-t border-white/60 animate-apple-fade-in">
          {/* Mini banner */}
          <div className="bg-gradient-to-br from-emerald-600/95 via-teal-700/95 to-emerald-800/95 px-5 py-4 space-y-1">
            <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              สรุปสิทธิการรักษา & สวัสดิการข้ามกระทรวง
            </h4>
            <p className="text-[11px] font-semibold text-emerald-50/90">
              CarePulse AI รวบรวมสิทธิจาก สปสช., กระทรวง พม., กองทุนสุขภาพตำบล, ประกันสังคม และประกันเอกชน
            </p>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Primary right */}
            <div className="liquid-glass-card rounded-2xl p-3.5 space-y-1.5">
              <span className="liquid-glass-pill bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 uppercase">
                สิทธิหลัก
              </span>
              <p className="text-sm font-black text-slate-900">{result.primary_right.scheme_name}</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {result.primary_right.coverage_summary}
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="liquid-glass-card rounded-2xl p-3 bg-emerald-50/70 space-y-0.5">
                <span className="text-[10px] font-black text-emerald-900 uppercase flex items-center gap-1">
                  <Banknote className="w-3 h-3" /> มูลค่าที่รัฐรองรับ
                </span>
                <p className="text-sm font-black text-emerald-950">
                  {result.cost_planning?.total_estimated_benefit_value || '—'}
                </p>
              </div>
              <div className="liquid-glass-card rounded-2xl p-3 bg-teal-50/70 space-y-0.5">
                <span className="text-[10px] font-black text-teal-900 uppercase flex items-center gap-1">
                  <PackageCheck className="w-3 h-3" /> อุปกรณ์ที่ขอได้
                </span>
                <p className="text-sm font-black text-teal-950">
                  {result.cost_planning?.eligible_equipment_count ?? 0} หมวด
                </p>
              </div>
            </div>

            {result.additional_rights.length > 0 && (
              <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
                สิทธิเสริมอีก {result.additional_rights.length} รายการ เช่น{' '}
                {result.additional_rights.slice(0, 2).map((r) => r.scheme_name).join(' · ')}
              </p>
            )}

            {/* Full result link */}
            <a
              href="/results"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-btn-primary flex items-center justify-center gap-2 py-3 text-sm font-black cursor-pointer"
            >
              ดูผลฉบับเต็ม & ขั้นตอนการใช้สิทธิ
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <p className="text-center text-[10px] text-slate-400 font-medium">
              รหัสประเมิน {result.assessment_id} · ข้อมูลถูกป้องกันตาม PDPA
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
