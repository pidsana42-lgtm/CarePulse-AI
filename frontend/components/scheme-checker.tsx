'use client'

import { useState } from 'react'
import {
  BadgeCheck,
  AlertCircle,
  Phone,
  Landmark,
  Users,
  Briefcase,
  HelpCircle,
} from 'lucide-react'
import { schemes, type SchemeId } from '@/lib/health-data'
import { cn } from '@/lib/utils'

const schemeIcons: Record<SchemeId, typeof Landmark> = {
  ucs: Users,
  sso: Briefcase,
  csmbs: Landmark,
  none: HelpCircle,
}

export function SchemeChecker() {
  const [selected, setSelected] = useState<SchemeId>('ucs')
  const scheme = schemes.find((s) => s.id === selected) ?? schemes[0]

  return (
    <section id="check-rights" className="scroll-mt-20 py-20 relative overflow-hidden">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            ตรวจสอบสิทธิการรักษาของคุณ
          </h2>
          <p className="max-w-xl text-pretty leading-relaxed text-slate-600 text-sm sm:text-base font-medium">
            เลือกสิทธิที่คุณมี เพื่อดูสิทธิประโยชน์และข้อจำกัดโดยละเอียด
            หากไม่แน่ใจว่ามีสิทธิใด โทรสายด่วน สปสช. 1330 หรือตรวจสอบผ่านแอปเป๋าตัง
          </p>
        </div>

        {/* Liquid Glass Radios */}
        <div
          role="radiogroup"
          aria-label="เลือกสิทธิรักษาพยาบาล"
          className="mb-8 grid grid-cols-2 gap-3.5 md:grid-cols-4"
        >
          {schemes.map((s) => {
            const Icon = schemeIcons[s.id]
            const active = selected === s.id
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(s.id)}
                className={cn(
                  'flex flex-col items-center gap-2.5 rounded-[24px] p-5 text-center transition-all duration-300 cursor-pointer',
                  active
                    ? 'bg-emerald-600/95 backdrop-blur-xl saturate-150 text-white shadow-xl scale-105 ring-2 ring-emerald-400/40 border border-white/40'
                    : 'liquid-glass-card hover:bg-white/90 text-slate-800',
                )}
              >
                <span
                  className={cn(
                    'flex size-12 items-center justify-center rounded-full transition-colors',
                    active
                      ? 'bg-white/20 text-white shadow-inner'
                      : 'bg-emerald-50 text-emerald-700',
                  )}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className={cn('text-sm font-black', active ? 'text-white' : 'text-slate-900')}>
                  {s.shortName}
                </span>
              </button>
            )
          })}
        </div>

        {/* Liquid Glass Detail Card */}
        <div className="liquid-glass rounded-[36px] p-7 md:p-10 shadow-2xl space-y-8 animate-apple-fade-in border border-white/80">
          <div className="flex flex-col gap-1 border-b border-black/[0.05] pb-5">
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">{scheme.name}</h3>
            <p className="text-sm font-medium text-slate-600">
              ผู้มีสิทธิ: <strong className="text-slate-800">{scheme.eligibility}</strong>
            </p>
            <p className="text-xs font-semibold text-emerald-700">
              หน่วยงานดูแล: {scheme.agency}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="mb-4 flex items-center gap-2 font-black text-slate-900 text-base">
                <BadgeCheck className="size-5 text-emerald-600" aria-hidden="true" />
                สิทธิประโยชน์ที่ได้รับ
              </h4>
              <ul className="flex flex-col gap-3">
                {scheme.benefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 font-medium"
                  >
                    <BadgeCheck
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 flex items-center gap-2 font-black text-slate-900 text-base">
                <AlertCircle
                  className="size-5 text-amber-600"
                  aria-hidden="true"
                />
                ข้อจำกัดที่ควรทราบ
              </h4>
              <ul className="flex flex-col gap-3">
                {scheme.limitations.map((l) => (
                  <li
                    key={l}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-500 font-medium"
                  >
                    <AlertCircle
                      className="mt-0.5 size-4 shrink-0 text-amber-500"
                      aria-hidden="true"
                    />
                    {l}
                  </li>
                ))}
              </ul>
              <div className="mt-6 liquid-glass-pill flex items-center gap-2 p-4 text-xs font-bold text-slate-800 shadow-xs">
                <Phone className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                {scheme.hotline}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
