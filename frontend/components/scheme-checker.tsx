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
    <section id="check-rights" className="scroll-mt-20 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground">
            ตรวจสอบสิทธิของคุณ
          </h2>
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            เลือกสิทธิที่คุณมี เพื่อดูสิทธิประโยชน์และข้อจำกัดโดยละเอียด
            หากไม่แน่ใจว่ามีสิทธิใด โทรสายด่วน สปสช. 1330 หรือตรวจสอบผ่านแอปเป๋าตัง
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="เลือกสิทธิรักษาพยาบาล"
          className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4"
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
                  'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                  active
                    ? 'border-primary bg-secondary shadow-sm'
                    : 'border-border bg-card hover:border-primary/50',
                )}
              >
                <span
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    active ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {s.shortName}
                </span>
              </button>
            )
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="text-xl font-bold text-foreground">{scheme.name}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              ผู้มีสิทธิ: {scheme.eligibility}
            </p>
            <p className="text-sm text-muted-foreground">
              หน่วยงานดูแล: {scheme.agency}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <BadgeCheck className="size-5 text-primary" aria-hidden="true" />
                สิทธิประโยชน์ที่ได้รับ
              </h4>
              <ul className="flex flex-col gap-3">
                {scheme.benefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
                  >
                    <BadgeCheck
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <AlertCircle
                  className="size-5 text-accent-foreground"
                  aria-hidden="true"
                />
                ข้อจำกัดที่ควรทราบ
              </h4>
              <ul className="flex flex-col gap-3">
                {scheme.limitations.map((l) => (
                  <li
                    key={l}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                  >
                    <AlertCircle
                      className="mt-0.5 size-4 shrink-0 text-accent-foreground"
                      aria-hidden="true"
                    />
                    {l}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center gap-2 rounded-lg bg-secondary p-4 text-sm font-medium text-secondary-foreground">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                {scheme.hotline}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
