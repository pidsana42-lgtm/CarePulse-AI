import React from 'react';
import { CheckCircle2, Hospital, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { HealthcareRightDetail } from '@/types';

interface EligibilityCardProps {
  right: HealthcareRightDetail;
  isPrimary?: boolean;
}

export default function EligibilityCard({ right, isPrimary = false }: EligibilityCardProps) {
  return (
    <div
      className={`rounded-2xl p-6 sm:p-7 border-2 transition-all card-shadow ${
        isPrimary
          ? 'bg-gradient-to-b from-emerald-50/70 to-white border-emerald-500 ring-2 ring-emerald-400/20'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isPrimary && (
            <span className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> สิทธิหลักของท่าน
            </span>
          )}
          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-md">
            รหัสสิทธิ: {right.scheme_code}
          </span>
        </div>
        <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
          <CheckCircle2 className="w-5 h-5" />
          <span>มีสิทธิได้รับความคุ้มครอง</span>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
        {right.scheme_name}
      </h3>

      <p className="mt-2 text-base text-slate-600 leading-relaxed font-medium">
        {right.coverage_summary}
      </p>

      {/* Free Covered Items */}
      {right.free_items.length > 0 && (
        <div className="mt-5 bg-white/80 border border-emerald-100 rounded-xl p-4">
          <h4 className="font-bold text-emerald-800 text-base mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            รายการที่ได้รับฟรี / ไม่ต้องจ่ายเงิน:
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium text-sm sm:text-base">
            {right.free_items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* How to use */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <Hospital className="w-4 h-4 text-slate-500 shrink-0" />
          <span><strong>สถานพยาบาล:</strong> {right.hospital_network}</span>
        </div>
        <div className="text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg">
          วิธีใช้สิทธิ: {right.how_to_use}
        </div>
      </div>
    </div>
  );
}
