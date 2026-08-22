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
      className={`rounded-[32px] p-6 sm:p-8 transition-all duration-300 shadow-xl ${
        isPrimary
          ? 'liquid-glass bg-white/90 border-2 border-emerald-500/50 ring-4 ring-emerald-500/10'
          : 'liquid-glass-card'
      }`}
    >
      {/* Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          {isPrimary ? (
            <span className="liquid-glass-pill flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-black px-3.5 py-1 uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> สิทธิหลักของท่าน
            </span>
          ) : (
            <span className="liquid-glass-pill bg-teal-800 text-white text-xs font-bold px-3.5 py-1">
              สวัสดิการเสริม / กายอุปกรณ์
            </span>
          )}
          {right.responsible_agency && (
            <span className="liquid-glass-pill flex items-center gap-1 bg-white/80 text-slate-700 text-xs font-bold px-3 py-1 border border-black/[0.04]">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {right.responsible_agency}
            </span>
          )}
        </div>
        <div className="liquid-glass-pill flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-100/70 px-3 py-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>มีสิทธิได้รับความคุ้มครอง</span>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
        {right.scheme_name}
      </h3>

      <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
        {right.coverage_summary}
      </p>

      {/* Eligible Medical Equipment & Assistive Devices (กายอุปกรณ์) */}
      {right.eligible_equipment && right.eligible_equipment.length > 0 && (
        <div className="mt-4 liquid-glass-card bg-teal-50/70 border border-teal-300/40 rounded-2xl p-4.5">
          <h4 className="font-black text-teal-950 text-sm sm:text-base mb-2.5 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-teal-700" />
            กายอุปกรณ์ & สิทธิประโยชน์พิเศษที่ขอรับได้:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-teal-950 font-bold text-xs sm:text-sm">
            {right.eligible_equipment.map((eq, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-teal-100 shadow-2xs">
                <span className="text-teal-600 font-black">✓</span>
                <span>{eq}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free Covered Items */}
      {right.free_items && right.free_items.length > 0 && (
        <div className="mt-4 liquid-glass-card rounded-2xl p-4.5">
          <h4 className="font-black text-slate-900 text-sm sm:text-base mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            รายการที่รัฐคุ้มครองฟรี / ไม่ต้องจ่ายเงิน:
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 font-medium text-xs sm:text-sm">
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
            <div className="liquid-glass-card bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-emerald-950">
              <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-black block text-[11px] text-emerald-900 uppercase">มูลค่าความคุ้มครองโดยรัฐ:</span>
                <span className="font-bold text-emerald-800 text-sm">{right.estimated_coverage_value}</span>
              </div>
            </div>
          )}
          {right.estimated_out_of_pocket && (
            <div className="liquid-glass-card bg-slate-50/80 border border-black/[0.05] rounded-2xl p-3.5 flex items-center gap-2.5 text-slate-900">
              <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <span className="font-black block text-[11px] text-slate-500 uppercase">ประมาณการค่าใช้จ่ายส่วนเกิน:</span>
                <span className="font-bold text-slate-700 text-sm">{right.estimated_out_of_pocket}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Legal References (แหล่งอ้างอิงและระเบียบราชการ) */}
      {right.official_references && right.official_references.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-black/[0.05] text-xs text-slate-500 space-y-1.5">
          <span className="font-black text-slate-800 block">แหล่งอ้างอิงระเบียบราชการ:</span>
          {right.official_references.map((ref, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 bg-white/70 px-3 py-2 rounded-xl border border-black/[0.04]">
              <span className="truncate max-w-[80%] font-medium text-slate-700">
                {ref.title} ({ref.legal_act})
              </span>
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-900 font-bold shrink-0 text-[11px]"
                >
                  เว็บทางการ ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* How to use & Contact Action */}
      <div className="mt-4 pt-4 border-t border-black/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <Hospital className="w-4 h-4 text-slate-400 shrink-0" />
          <span><strong>สถานพยาบาล:</strong> {right.hospital_network}</span>
        </div>
        {right.contact_channel && (
          <div className="liquid-glass-pill flex items-center gap-1.5 text-teal-900 font-black px-3.5 py-1.5 shadow-2xs">
            <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
            <span>ติดต่อ: {right.contact_channel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
