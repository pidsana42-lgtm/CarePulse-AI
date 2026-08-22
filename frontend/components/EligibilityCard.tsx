import React from 'react';
import { CheckCircle2, Hospital, Sparkles, Building2, PhoneCall, PackageCheck, Banknote, AlertCircle } from 'lucide-react';
import { HealthcareRightDetail } from '@/types';

interface EligibilityCardProps {
  right: HealthcareRightDetail;
  isPrimary?: boolean;
}

export default function EligibilityCard({ right, isPrimary = false }: EligibilityCardProps) {
  return (
    <div
      className={`rounded-3xl p-6 sm:p-7 border-2 transition-all shadow-md ${
        isPrimary
          ? 'bg-gradient-to-b from-emerald-50/80 via-white to-white border-emerald-500 ring-4 ring-emerald-500/10'
          : 'bg-white border-slate-200 hover:border-emerald-300'
      }`}
    >
      {/* Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {isPrimary ? (
            <span className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> สิทธิหลักของท่าน
            </span>
          ) : (
            <span className="bg-teal-700 text-white text-xs font-bold px-3 py-1 rounded-full">
              สวัสดิการเสริม / กายอุปกรณ์
            </span>
          )}
          {right.responsible_agency && (
            <span className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              {right.responsible_agency}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-4 h-4" />
          <span>มีสิทธิได้รับความคุ้มครอง</span>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
        {right.scheme_name}
      </h3>

      <p className="mt-2 text-base text-slate-600 leading-relaxed font-medium">
        {right.coverage_summary}
      </p>

      {/* Eligible Medical Equipment & Assistive Devices (กายอุปกรณ์) */}
      {right.eligible_equipment && right.eligible_equipment.length > 0 && (
        <div className="mt-4 bg-teal-50/70 border border-teal-200 rounded-2xl p-4.5">
          <h4 className="font-extrabold text-teal-900 text-sm sm:text-base mb-2.5 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-teal-700" />
            กายอุปกรณ์ & สิทธิประโยชน์พิเศษที่ขอรับได้:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-teal-950 font-semibold text-sm">
            {right.eligible_equipment.map((eq, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-teal-100 shadow-xs">
                <span className="text-teal-600 font-bold">✓</span>
                <span>{eq}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free Covered Items */}
      {right.free_items && right.free_items.length > 0 && (
        <div className="mt-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5">
          <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            รายการที่รัฐคุ้มครองฟรี / ไม่ต้องจ่ายเงิน:
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 font-medium text-sm">
            {right.free_items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Financial & Cost Estimation */}
      {(right.estimated_coverage_value || right.estimated_out_of_pocket) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
          {right.estimated_coverage_value && (
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-center gap-2.5 text-emerald-900">
              <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">มูลค่าความคุ้มครองโดยรัฐ:</span>
                <span className="font-medium text-emerald-700">{right.estimated_coverage_value}</span>
              </div>
            </div>
          )}
          {right.estimated_out_of_pocket && (
            <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 text-slate-800">
              <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <span className="font-bold block">ประมาณการค่าใช้จ่ายส่วนเกิน:</span>
                <span className="font-medium text-slate-600">{right.estimated_out_of_pocket}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Legal References (แหล่งอ้างอิงและระเบียบราชการ) */}
      {right.official_references && right.official_references.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-100/90 text-xs text-slate-500 space-y-1">
          <span className="font-bold text-slate-700 block">📜 แหล่งอ้างอิงระเบียบราชการ:</span>
          {right.official_references.map((ref, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
              <span className="truncate max-w-[80%] font-medium text-slate-700">
                {ref.title} ({ref.legal_act})
              </span>
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-900 font-bold shrink-0"
                >
                  เว็บทางการ ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* How to use & Contact Action */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Hospital className="w-4 h-4 text-slate-500 shrink-0" />
          <span><strong>สถานพยาบาล:</strong> {right.hospital_network}</span>
        </div>
        {right.contact_channel && (
          <div className="flex items-center gap-1.5 text-teal-800 font-bold bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-xl">
            <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
            <span>ติดต่อ: {right.contact_channel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

