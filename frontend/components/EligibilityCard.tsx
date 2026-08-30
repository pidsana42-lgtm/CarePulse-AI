import React from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Hospital,
  Info,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { HealthcareRightDetail } from '@/types';

interface EligibilityCardProps {
  right: HealthcareRightDetail;
  isPrimary?: boolean;
}

const statusConfig = {
  likely: {
    label: 'ข้อมูลตรงเกณฑ์เบื้องต้น',
    description: 'ควรติดต่อหน่วยงานเพื่อยืนยัน',
    className: 'border-cyan-200 bg-cyan-50 text-cyan-900',
    icon: CheckCircle2,
  },
  needs_review: {
    label: 'อาจเข้าเกณฑ์',
    description: 'ต้องมีข้อมูลหรือผลประเมินเพิ่ม',
    className: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: AlertCircle,
  },
  not_matched: {
    label: 'ยังไม่พบเงื่อนไขที่ตรง',
    description: 'ตรวจสอบกับหน่วยงานอีกครั้ง',
    className: 'border-slate-200 bg-slate-50 text-slate-800',
    icon: Info,
  },
};

export default function EligibilityCard({ right, isPrimary = false }: EligibilityCardProps) {
  const status = statusConfig[right.eligibility_status ?? (right.is_eligible ? 'likely' : 'needs_review')];
  const StatusIcon = status.icon;

  return (
    <article className={`overflow-hidden border-t-2 ${isPrimary ? 'border-[#115af2]' : 'border-black/[0.12]'}`}>
      <div className="py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${isPrimary ? 'bg-cyan-700 text-white' : 'bg-slate-900 text-white'}`}>
                {isPrimary ? <Sparkles className="size-3.5" /> : <ClipboardList className="size-3.5" />}
                {isPrimary ? 'สิทธิรักษาหลักที่ผู้ใช้ระบุ' : 'สิทธิหรือบริการที่ควรตรวจต่อ'}
              </span>
              {right.responsible_agency && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  <Building2 className="size-3.5" />
                  {right.responsible_agency}
                </span>
              )}
            </div>
            <h3 className="text-xl font-black leading-tight text-slate-950 sm:text-2xl">{right.scheme_name}</h3>
          </div>

          <div className={`shrink-0 border-l-2 px-4 py-1 ${status.className}`}>
            <div className="flex items-center gap-2 text-sm font-black">
              <StatusIcon className="size-4" />
              {status.label}
            </div>
            <p className="mt-0.5 pl-6 text-[11px] font-medium opacity-80">{status.description}</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600 sm:text-base">{right.coverage_summary}</p>

        {right.matching_reasons && right.matching_reasons.length > 0 && (
          <section className="mt-5 border-t border-black/[0.1] pt-4">
            <h4 className="flex items-center gap-2 text-sm font-black text-cyan-950">
              <CheckCircle2 className="size-4 text-cyan-700" />
              เหตุผลที่ระบบจับคู่รายการนี้
            </h4>
            <ul className="mt-2 grid gap-1.5 text-sm text-cyan-950 sm:grid-cols-2">
              {right.matching_reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-600" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {right.missing_information && right.missing_information.length > 0 && (
          <section className="mt-4 border-t border-amber-300/60 pt-4">
            <h4 className="flex items-center gap-2 text-sm font-black text-amber-950">
              <AlertCircle className="size-4 text-amber-700" />
              ข้อมูลที่ยังต้องยืนยัน
            </h4>
            <ul className="mt-2 space-y-1.5 text-sm text-amber-950">
              {right.missing_information.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="font-black text-amber-700">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {right.eligible_equipment && right.eligible_equipment.length > 0 && (
          <section className="mt-4 border-t border-black/[0.1] pt-4">
            <h4 className="text-sm font-black text-cyan-950">รายการที่เกี่ยวข้องกับข้อมูลของคุณ</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-cyan-950">
              {right.eligible_equipment.map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="font-black text-cyan-700">•</span>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {right.required_documents && right.required_documents.length > 0 && (
            <section className="border-t border-black/[0.1] pt-4">
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-900">
                <FileText className="size-4 text-slate-600" /> เอกสารที่ควรเตรียม
              </h4>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {right.required_documents.map((document) => (
                  <li key={document} className="flex items-start gap-2"><span className="font-black text-slate-400">•</span>{document}</li>
                ))}
              </ul>
            </section>
          )}

          {right.application_steps && right.application_steps.length > 0 && (
            <section className="border-t border-black/[0.1] pt-4">
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-900">
                <ClipboardList className="size-4 text-slate-600" /> ขั้นตอนถัดไป
              </h4>
              <ol className="mt-2 space-y-2 text-sm text-slate-700">
                {right.application_steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-black text-slate-700">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>

      <div className="border-t border-black/[0.1] py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-xs text-slate-600">
            <p className="flex items-start gap-2"><Hospital className="mt-0.5 size-3.5 shrink-0" /><span><strong>จุดเริ่มต้น:</strong> {right.hospital_network}</span></p>
            {right.contact_channel && <p className="flex items-center gap-2"><PhoneCall className="size-3.5 shrink-0" /><span><strong>ติดต่อ:</strong> {right.contact_channel}</span></p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {right.official_references?.map((reference) => (
              <a
                key={reference.url}
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                ดูแหล่งข้อมูลทางการ <ArrowUpRight className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
        {right.last_reviewed && <p className="mt-3 text-[10px] font-medium text-slate-400">ตรวจสอบแหล่งข้อมูลล่าสุดโดยทีมโครงการ: {right.last_reviewed}</p>}
      </div>
    </article>
  );
}
