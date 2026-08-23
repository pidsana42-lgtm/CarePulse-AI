'use client'

import { useMemo, useState } from 'react'
import { Info, Wallet, PiggyBank, Receipt, Sparkles } from 'lucide-react'
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
import { EquipmentPriceTable } from '@/components/equipment-price-table'

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
      className="scroll-mt-20 py-20 relative overflow-hidden"
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 space-y-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            ประมาณการค่ารักษาพยาบาล
          </h2>
          <p className="max-w-xl text-pretty leading-relaxed text-slate-600 text-sm sm:text-base font-medium">
            เลือกสิทธิ การรักษา และประเภทโรงพยาบาล
            เพื่อดูค่าใช้จ่ายโดยประมาณและส่วนที่คุณอาจต้องจ่ายเอง
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Liquid Glass Form */}
          <div className="liquid-glass rounded-[32px] p-6 sm:p-8 flex flex-col gap-6 lg:col-span-2 shadow-xl border border-white/80">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="scheme-select"
                className="text-sm font-black text-slate-900"
              >
                1. สิทธิรักษาพยาบาลของคุณ
              </label>
              <select
                id="scheme-select"
                value={schemeId}
                onChange={(e) => setSchemeId(e.target.value as SchemeId)}
                className="h-12 w-full rounded-2xl border border-black/[0.08] bg-white/90 px-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 shadow-xs"
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
                className="text-sm font-black text-slate-900"
              >
                2. การรักษาที่ต้องการประมาณการ
              </label>
              <select
                id="treatment-select"
                value={treatmentId}
                onChange={(e) => setTreatmentId(e.target.value)}
                className="h-12 w-full rounded-2xl border border-black/[0.08] bg-white/90 px-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 shadow-xs"
              >
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {treatment.note && (
                <p className="text-xs leading-relaxed text-slate-500 font-medium">
                  {treatment.note}
                </p>
              )}
            </div>

            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-1 text-sm font-black text-slate-900">
                3. ประเภทโรงพยาบาล
              </legend>
              <div className="flex flex-col gap-2">
                {hospitalTypes.map((h) => (
                  <label
                    key={h.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all duration-200',
                      hospital === h.id
                        ? 'bg-emerald-50/90 backdrop-blur-md border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white/60 border-white/80 hover:bg-white/90',
                    )}
                  >
                    <input
                      type="radio"
                      name="hospital-type"
                      value={h.id}
                      checked={hospital === h.id}
                      onChange={() => setHospital(h.id)}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">
                        {h.name}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {h.desc}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Liquid Glass Result */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            <div className="liquid-glass rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6 border border-white/80">
              <div>
                <p className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                  ผลการประมาณการค่ารักษา
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-1">
                  {treatment.name} · {hospitalTypes.find((h) => h.id === hospital)?.name}
                </h3>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-3">
                <div className="liquid-glass-card rounded-2xl p-4.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Receipt className="size-3.5 text-slate-400" />
                    ค่ารักษาโดยประมาณ
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-950">
                    {formatBaht(result.low)} - {formatBaht(result.high)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold">บาท</p>
                </div>

                <div className="liquid-glass-card rounded-2xl p-4.5 space-y-1 bg-emerald-50/70 border-emerald-300/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <PiggyBank className="size-3.5 text-emerald-600" />
                    สิทธิครอบคลุม
                  </div>
                  <p className="text-xl font-black text-emerald-700">{pct}%</p>
                  <p className="text-[11px] text-emerald-800 font-semibold">ของค่ารักษา</p>
                </div>

                <div
                  className={cn(
                    'liquid-glass-card rounded-2xl p-4.5 space-y-1',
                    result.outHigh === 0
                      ? 'bg-teal-50/70 border-teal-300/40'
                      : 'bg-rose-50/70 border-rose-300/40',
                  )}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Wallet className="size-3.5 text-slate-500" />
                    คุณอาจต้องจ่ายเอง
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-950">
                    {result.outHigh === 0
                      ? '0'
                      : `${formatBaht(result.outLow)} - ${formatBaht(result.outHigh)}`}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold">บาท</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-emerald-700">{result.coverage.label}</span>
                  <span className="text-slate-600">{pct}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-3.5 w-full overflow-hidden rounded-full bg-black/[0.04] p-0.5"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-700 shadow-sm"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <ul className="flex flex-col gap-2.5 pt-2 border-t border-black/[0.05]">
                {result.coverage.notes.map((n, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-medium"
                  >
                    <Info
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    {n}
                  </li>
                ))}
              </ul>
            </div>

            <div className="liquid-glass rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600 font-medium border border-white/80">
              <Info className="mt-0.5 size-4 shrink-0 text-emerald-700" />
              <p>
                ตัวเลขนี้เป็นการประมาณการเบื้องต้นจากอัตราค่ารักษาทั่วไป
                ค่าใช้จ่ายจริงขึ้นอยู่กับอาการ ภาวะแทรกซ้อน และโรงพยาบาลแต่ละแห่ง
                โปรดสอบถามโรงพยาบาลหรือหน่วยงานเจ้าของสิทธิก่อนเข้ารับการรักษา
              </p>
            </div>
          </div>
        </div>

        {/* Medical Equipment Reference Prices */}
        <EquipmentPriceTable />
      </div>
    </section>
  )
}
