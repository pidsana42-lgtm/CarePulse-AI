'use client'

import { useMemo, useState } from 'react'
import { Calculator, Info, Wallet, PiggyBank, Receipt } from 'lucide-react'
import {
  schemes,
  treatments,
  hospitalTypes,
  getCoverage,
  formatBaht,
  type SchemeId,
  type HospitalType,
} from '@/lib/health-data'
import { cn } from '@/lib/utils'

export function CostEstimator() {
  const [schemeId, setSchemeId] = useState<SchemeId>('ucs')
  const [treatmentId, setTreatmentId] = useState<string>('appendectomy')
  const [hospital, setHospital] = useState<HospitalType>('public-registered')

  const treatment = treatments.find((t) => t.id === treatmentId) ?? treatments[0]

  const result = useMemo(() => {
    const coverage = getCoverage(schemeId, hospital, treatment.id)
    const isPrivate = hospital === 'private'
    const [low, high] = isPrivate ? treatment.cost.private : treatment.cost.public
    const coveredLow = Math.round(low * coverage.coverageRate)
    const coveredHigh = Math.round(high * coverage.coverageRate)
    return {
      coverage,
      low,
      high,
      outLow: low - coveredLow,
      outHigh: high - coveredHigh,
    }
  }, [schemeId, hospital, treatment])

  const pct = Math.round(result.coverage.coverageRate * 100)

  return (
    <section
      id="estimator"
      className="scroll-mt-20 border-y border-border bg-muted py-16 md:py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <h2 className="flex items-center gap-2 text-balance text-3xl font-bold text-foreground">
            <Calculator className="size-7 text-primary" aria-hidden="true" />
            ประมาณค่ารักษาพยาบาล
          </h2>
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            เลือกสิทธิ การรักษา และประเภทโรงพยาบาล
            เพื่อดูค่าใช้จ่ายโดยประมาณและส่วนที่คุณอาจต้องจ่ายเอง
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Form */}
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="scheme-select"
                className="text-sm font-semibold text-foreground"
              >
                1. สิทธิรักษาพยาบาลของคุณ
              </label>
              <select
                id="scheme-select"
                value={schemeId}
                onChange={(e) => setSchemeId(e.target.value as SchemeId)}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortName === 'จ่ายเอง'
                      ? 'ไม่มีสิทธิ / จ่ายเอง'
                      : s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="treatment-select"
                className="text-sm font-semibold text-foreground"
              >
                2. การรักษาที่ต้องการประมาณการ
              </label>
              <select
                id="treatment-select"
                value={treatmentId}
                onChange={(e) => setTreatmentId(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {treatment.note && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {treatment.note}
                </p>
              )}
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold text-foreground">
                3. ประเภทโรงพยาบาล
              </legend>
              <div className="flex flex-col gap-2">
                {hospitalTypes.map((h) => (
                  <label
                    key={h.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                      hospital === h.id
                        ? 'border-primary bg-secondary'
                        : 'border-border bg-background hover:border-primary/50',
                    )}
                  >
                    <input
                      type="radio"
                      name="hospital-type"
                      value={h.id}
                      checked={hospital === h.id}
                      onChange={() => setHospital(h.id)}
                      className="mt-1 accent-[oklch(0.5_0.1_190)]"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {h.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {h.desc}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="mb-1 text-sm text-muted-foreground">
                ผลการประมาณการ
              </p>
              <h3 className="mb-4 text-lg font-bold text-foreground">
                {treatment.name} ·{' '}
                {hospitalTypes.find((h) => h.id === hospital)?.name}
              </h3>

              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted p-4">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Receipt className="size-3.5" aria-hidden="true" />
                    ค่ารักษาโดยประมาณ
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {formatBaht(result.low)} - {formatBaht(result.high)}
                  </p>
                  <p className="text-xs text-muted-foreground">บาท</p>
                </div>
                <div className="rounded-xl bg-secondary p-4">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-secondary-foreground">
                    <PiggyBank className="size-3.5" aria-hidden="true" />
                    สิทธิครอบคลุม
                  </div>
                  <p className="text-lg font-bold text-primary">{pct}%</p>
                  <p className="text-xs text-secondary-foreground">
                    ของค่ารักษา
                  </p>
                </div>
                <div
                  className={cn(
                    'rounded-xl p-4',
                    result.outHigh === 0
                      ? 'bg-secondary'
                      : 'bg-accent/25',
                  )}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Wallet className="size-3.5" aria-hidden="true" />
                    คุณอาจต้องจ่ายเอง
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {result.outHigh === 0
                      ? '0'
                      : `${formatBaht(result.outLow)} - ${formatBaht(result.outHigh)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">บาท</p>
                </div>
              </div>

              {/* Coverage bar */}
              <div className="mb-2 flex items-center justify-between text-xs font-medium">
                <span className="text-primary">{result.coverage.label}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="สัดส่วนที่สิทธิครอบคลุม"
                className="h-3 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <ul className="mt-5 flex flex-col gap-2.5">
                {result.coverage.notes.map((n) => (
                  <li
                    key={n}
                    className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    <Info
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {n}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-accent/60 bg-accent/15 p-4 text-sm leading-relaxed text-foreground">
              <Info
                className="mt-0.5 size-4 shrink-0 text-accent-foreground"
                aria-hidden="true"
              />
              <p>
                ตัวเลขนี้เป็นการประมาณการเบื้องต้นจากอัตราค่ารักษาทั่วไป
                ค่าใช้จ่ายจริงขึ้นอยู่กับอาการ ภาวะแทรกซ้อน และโรงพยาบาลแต่ละแห่ง
                โปรดสอบถามโรงพยาบาลหรือหน่วยงานเจ้าของสิทธิก่อนเข้ารับการรักษา
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
