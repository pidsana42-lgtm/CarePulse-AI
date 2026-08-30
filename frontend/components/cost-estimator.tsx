'use client'

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { BrainCircuit, Camera, CheckCircle2, FileImage, ImagePlus, Info, Loader2, ScanLine, Wallet, PiggyBank, Receipt, ShieldCheck, X } from 'lucide-react'
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
import { askAiAdvisor, uploadDocument } from '@/lib/api'

type PriceInputMode = 'estimate' | 'scan'

function extractScannedAmount(rawText: string): number | null {
  const labels = /(?:ยอดสุทธิ|ยอดรวม(?:ทั้งสิ้น)?|รวมทั้งสิ้น|ค่าใช้จ่ายรวม|total(?:\s*amount)?|grand\s*total|amount)/gi
  const matches = Array.from(rawText.matchAll(labels)).map((match) => {
    const followingText = rawText.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 48)
    const amountMatch = followingText.match(/(?:฿|บาท)?\s*([\d,]{3,}(?:\.\d{1,2})?)/)
    return amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0
  }).filter((amount) => Number.isFinite(amount) && amount >= 100 && amount <= 10_000_000)

  return matches.length ? Math.max(...matches) : null
}

interface CostEstimatorProps {
  initialScheme?: SchemeId
  detectedSchemeName?: string
  privateHealthPolicy?: {
    planName: string
    sumInsured: string
  }
  lifePolicyName?: string
}

export function CostEstimator({ initialScheme = 'ucs', detectedSchemeName, privateHealthPolicy, lifePolicyName }: CostEstimatorProps) {
  const [schemeId, setSchemeId] = useState<SchemeId>(initialScheme)
  const [treatmentId, setTreatmentId] = useState<string>('appendectomy')
  const [hospital, setHospital] = useState<HospitalType>('public-registered')
  const [includePrivatePolicy, setIncludePrivatePolicy] = useState(Boolean(privateHealthPolicy))
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [priceInputMode, setPriceInputMode] = useState<PriceInputMode>('estimate')
  const [scannedAmount, setScannedAmount] = useState<number | null>(null)
  const [scanFileName, setScanFileName] = useState('')
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle')
  const [scanMessage, setScanMessage] = useState('')
  const scanInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setSchemeId(initialScheme), [initialScheme])

  useEffect(() => setIncludePrivatePolicy(Boolean(privateHealthPolicy)), [privateHealthPolicy])

  useEffect(() => () => {
    if (scanPreviewUrl) URL.revokeObjectURL(scanPreviewUrl)
  }, [scanPreviewUrl])

  const treatment = treatments.find((t) => t.id === treatmentId) ?? treatments[0]

  const handleCostDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setScanStatus('error')
      setScanMessage('ไฟล์มีขนาดใหญ่เกิน 10 เมกะไบต์ กรุณาเลือกรูปใหม่')
      return
    }

    setScanFileName(file.name)
    setScanPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
    setScanStatus('scanning')
    setScanMessage('กำลังอ่านยอดค่าใช้จ่ายจากภาพ...')

    try {
      const response = await uploadDocument(file, 'other')
      const rawText = typeof response.extracted_data?.ocr_raw_text === 'string' ? response.extracted_data.ocr_raw_text : ''
      const detectedAmount = extractScannedAmount(rawText)
      setScannedAmount(detectedAmount)
      setScanStatus('done')
      setScanMessage(detectedAmount
        ? `พบยอด ${formatBaht(detectedAmount)} บาท กรุณาตรวจสอบและแก้ไขได้ด้านล่าง`
        : 'ยังไม่พบยอดรวมที่อ่านได้ กรุณากรอกยอดจากเอกสารเพื่อคำนวณ')
    } catch (error) {
      setScanStatus('error')
      setScanMessage(error instanceof Error ? error.message : 'สแกนภาพไม่สำเร็จ กรุณาลองใหม่')
    }
  }

  const clearCostDocument = () => {
    setScanFileName('')
    setScanPreviewUrl(null)
    setScannedAmount(null)
    setScanStatus('idle')
    setScanMessage('')
  }

  const result = useMemo(() => {
    const coverage = getCoverage(schemeId, hospital, treatment.id)
    const isPrivate = hospital === 'private'
    const [baseLow, baseHigh] = isPrivate ? treatment.cost.private : treatment.cost.public
    const useScannedAmount = priceInputMode === 'scan' && scannedAmount !== null && scannedAmount >= 0
    const low = useScannedAmount ? scannedAmount : baseLow
    const high = useScannedAmount ? scannedAmount : baseHigh
    const coveredLow = Math.round(low * coverage.coverageRate)
    const coveredHigh = Math.round(high * coverage.coverageRate)
    const governmentOutLow = low - coveredLow
    const governmentOutHigh = high - coveredHigh
    const policyLimit = privateHealthPolicy
      ? Number(privateHealthPolicy.sumInsured.replace(/\D/g, '')) || 0
      : 0
    const privateCoveredLow = includePrivatePolicy
      ? Math.min(Math.round(governmentOutLow * 0.8), policyLimit)
      : 0
    const privateCoveredHigh = includePrivatePolicy
      ? Math.min(Math.round(governmentOutHigh * 0.8), policyLimit)
      : 0

    return {
      coverage,
      low,
      high,
      usesScannedAmount: useScannedAmount,
      coveredLow,
      coveredHigh,
      privateCoveredLow,
      privateCoveredHigh,
      totalCoveredLow: coveredLow + privateCoveredLow,
      totalCoveredHigh: coveredHigh + privateCoveredHigh,
      outLow: governmentOutLow - privateCoveredLow,
      outHigh: governmentOutHigh - privateCoveredHigh,
    }
  }, [schemeId, hospital, treatment, includePrivatePolicy, privateHealthPolicy, priceInputMode, scannedAmount])

  const pct = Math.round(result.coverage.coverageRate * 100)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setAiLoading(true)
      setAiError('')
      const schemeName = detectedSchemeName || schemes.find((scheme) => scheme.id === schemeId)?.name || 'ไม่พบสิทธิภาครัฐ'
      const hospitalName = hospitalTypes.find((item) => item.id === hospital)?.name || hospital
      const privatePolicyText = privateHealthPolicy && includePrivatePolicy
        ? `${privateHealthPolicy.planName} วงเงิน ${privateHealthPolicy.sumInsured}`
        : 'ไม่ได้นำประกันเอกชนมาคำนวณ'
      const coordinationRule = `ใช้สิทธิภาครัฐเป็นสิทธิหลักก่อน${privateHealthPolicy && includePrivatePolicy ? ' แล้วส่งยอดคงเหลือให้ประกันสุขภาพพิจารณา' : ''}${lifePolicyName ? ' โดยไม่นำประกันชีวิตมาหักค่ารักษาอัตโนมัติ' : ''}`
      const fallbackAnalysis = [
        `1) สิทธิที่ใช้: ${schemeName}${privateHealthPolicy && includePrivatePolicy ? ` และ ${privateHealthPolicy.planName}` : ''}`,
        `2) หลังหักความคุ้มครองตามข้อมูลที่พบ คุณอาจต้องจ่ายเองประมาณ ${formatBaht(result.outLow)} - ${formatBaht(result.outHigh)} บาท`,
        '3) ควรยืนยันเครือข่ายโรงพยาบาล วงเงินคงเหลือ ข้อยกเว้น และค่าเสียหายส่วนแรกก่อนเข้ารับบริการ ตัวเลขทั้งหมดเป็นค่าประมาณ',
      ].join('\n')

      try {
        const response = await askAiAdvisor([
          {
            role: 'system',
            content: 'คุณคือ CarePulse AI ผู้ช่วยตรวจทานสิทธิและค่ารักษา ใช้ตัวเลขจากระบบคำนวณค่าใช้จ่ายตามที่ให้มา ห้ามสร้างวงเงินหรือเงื่อนไขใหม่ ตอบเป็นภาษาไทยทั้งหมดอย่างสั้นและกระชับ โดยแยก 1) สิทธิที่ใช้ 2) เหตุผลของยอดจ่ายเอง 3) สิ่งที่ต้องยืนยันกับโรงพยาบาลหรือบริษัทประกัน และย้ำว่าเป็นค่าประมาณ',
          },
          {
            role: 'user',
            content: [
              `สิทธิภาครัฐ: ${schemeName}`,
              `ประกันสุขภาพ: ${privatePolicyText}`,
              `การรักษา: ${treatment.name}`,
              `ประเภทโรงพยาบาล: ${hospitalName}`,
              `แหล่งราคาที่ใช้: ${result.usesScannedAmount ? `ยอด ${formatBaht(result.low)} บาทจากภาพ ${scanFileName || 'เอกสารที่สแกน'}` : 'ช่วงราคากลางตามประเภทการรักษาและโรงพยาบาล'}`,
              `ค่ารักษาโดยประมาณ: ${formatBaht(result.low)} - ${formatBaht(result.high)} บาท`,
              `สิทธิภาครัฐช่วยจ่าย: ${formatBaht(result.coveredLow)} - ${formatBaht(result.coveredHigh)} บาท`,
              `ประกันเอกชนช่วยจ่าย: ${formatBaht(result.privateCoveredLow)} - ${formatBaht(result.privateCoveredHigh)} บาท`,
              `ผู้ใช้อาจต้องจ่ายเอง: ${formatBaht(result.outLow)} - ${formatBaht(result.outHigh)} บาท`,
              `เงื่อนไขจากระบบคำนวณค่าใช้จ่าย: ${result.coverage.notes.join(' | ')}`,
              `กติกาสิทธิทับซ้อน: ${coordinationRule}`,
            ].join('\n'),
          },
        ], true, false)
        if (!cancelled) {
          const analysis = response.provider.includes('Live Web Synthesizer') ? fallbackAnalysis : response.content
          setAiAnalysis(analysis)
        }
      } catch (error) {
        if (!cancelled) {
          setAiAnalysis(fallbackAnalysis)
          setAiError('AI ตอบกลับไม่สำเร็จ จึงแสดงสรุปจากระบบคำนวณค่าใช้จ่ายแทน')
        }
      } finally {
        if (!cancelled) setAiLoading(false)
      }
    }, 650)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    detectedSchemeName,
    hospital,
    includePrivatePolicy,
    lifePolicyName,
    privateHealthPolicy,
    result.coverage.notes,
    result.coveredHigh,
    result.coveredLow,
    result.high,
    result.low,
    result.outHigh,
    result.outLow,
    result.privateCoveredHigh,
    result.privateCoveredLow,
    result.usesScannedAmount,
    scanFileName,
    schemeId,
    treatment.name,
  ])

  return (
    <section
      id="estimator"
      className="estimate-standard relative scroll-mt-20 overflow-hidden py-8 sm:py-10"
    >
      <div className="w-full space-y-8 px-5 sm:px-8 lg:px-10 2xl:px-14">
        <div className="grid gap-6 xl:grid-cols-12">
          {/* Liquid Glass Form */}
          <div className="flex flex-col gap-7 rounded-[32px] border border-black/[0.06] bg-white p-6 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-8 xl:col-span-3">
            {/* <div>
              <span className="text-lg font-black text-slate-950">เลือกวิธีระบุราคาการรักษา</span>
              <div role="tablist" aria-label="วิธีระบุราคาการรักษา" className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-[#f5f5f7] p-2">
                <button
                  type="button"
                  role="tab"
                  aria-selected={priceInputMode === 'estimate'}
                  onClick={() => setPriceInputMode('estimate')}
                  className={cn('min-h-16 rounded-xl px-3 text-left transition', priceInputMode === 'estimate' ? 'bg-white text-[#072b77] shadow-sm' : 'text-slate-600 hover:bg-white/70')}
                >
                  <span className="flex items-center gap-2 text-base font-black"><Receipt className="size-5" /> เลือกการรักษา</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={priceInputMode === 'scan'}
                  onClick={() => setPriceInputMode('scan')}
                  className={cn('min-h-16 rounded-xl px-3 text-left transition', priceInputMode === 'scan' ? 'bg-[#115af2] text-white shadow-sm' : 'text-slate-600 hover:bg-white/70')}
                >
                  <span className="flex items-center gap-2 text-base font-black"><ScanLine className="size-5" /> สแกนภาพ</span>
                </button>
              </div>
            </div> */}

            {priceInputMode === 'scan' && (
              <div role="tabpanel" className="rounded-3xl border-2 border-dashed border-[#115af2]/30 bg-[#eef5ff] p-5">
                <input
                  ref={scanInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  capture="environment"
                  onChange={handleCostDocument}
                  className="hidden"
                />
                {scanStatus === 'idle' ? (
                  <div className="text-center">
                    <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#115af2]"><ImagePlus className="size-7" /></span>
                    <h3 className="mt-3 text-lg font-black text-[#072b77]">สแกนใบเสร็จหรือใบประเมินค่าใช้จ่าย</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#424245]">ถ่ายรูปหรือเลือกภาพ ระบบจะอ่านยอดรวม แล้วให้คุณตรวจสอบก่อนนำไปคำนวณ</p>
                    <button type="button" onClick={() => scanInputRef.current?.click()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#115af2] px-5 text-base font-bold text-white hover:bg-[#1a7bf0]">
                      <Camera className="size-5" /> ถ่ายหรือเลือกภาพ
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start gap-3">
                      {scanPreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={scanPreviewUrl} alt="ภาพเอกสารค่าใช้จ่ายที่เลือก" className="size-20 rounded-2xl border border-[#115af2]/15 object-cover" />
                      ) : (
                        <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white text-[#115af2]"><FileImage className="size-8" /></span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-black text-[#072b77]">{scanFileName}</p>
                        <p role="status" className={cn('mt-1 text-sm leading-relaxed', scanStatus === 'error' ? 'text-rose-700' : 'text-[#424245]')}>
                          {scanStatus === 'scanning' && <Loader2 className="mr-1 inline size-4 animate-spin" />}{scanMessage}
                        </p>
                      </div>
                      <button type="button" onClick={clearCostDocument} aria-label="ล้างภาพที่สแกน" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 hover:bg-slate-100"><X className="size-5" /></button>
                    </div>

                    {scanStatus !== 'scanning' && (
                      <label className="mt-4 block">
                        <span className="text-base font-bold text-slate-800">ยอดจากเอกสาร (บาท)</span>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="กรอกยอดรวมจากเอกสาร"
                          value={scannedAmount ?? ''}
                          onChange={(event) => setScannedAmount(event.target.value === '' ? null : Math.max(0, Number(event.target.value)))}
                          className="mt-2 h-14 w-full rounded-2xl border-2 border-[#115af2]/20 bg-white px-4 text-xl font-black text-slate-950 outline-none focus:border-[#115af2] focus:ring-4 focus:ring-[#115af2]/10"
                        />
                        <span className="mt-2 flex items-center gap-1.5 text-sm text-slate-600"><CheckCircle2 className="size-4 text-[#115af2]" /> ยืนยันยอดนี้ก่อนใช้ตัดสินใจจริง</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-lg font-black text-slate-950">1. สิทธิรักษาพยาบาลของคุณ</span>
              {detectedSchemeName ? (
                <div className="rounded-2xl border border-[#115af2]/10 bg-[#eef5ff] p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cyan-700 text-white"><ShieldCheck className="size-6" /></span>
                    <span>
                      <span className="block text-sm font-black text-cyan-700">ดึงจากผลตรวจสิทธิล่าสุด</span>
                      <strong className="mt-1 block text-lg leading-relaxed text-cyan-950">{detectedSchemeName}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <select
                  id="scheme-select"
                  aria-label="เลือกสิทธิรักษาพยาบาล"
                  value={schemeId}
                  onChange={(e) => setSchemeId(e.target.value as SchemeId)}
                  className="h-14 w-full rounded-2xl border-2 border-black/[0.10] bg-white px-4 text-lg font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
                >
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shortName === 'จ่ายเอง' ? 'ไม่มีสิทธิ / จ่ายเอง' : s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="treatment-select"
                className="text-lg font-black text-slate-950"
              >
                2. การรักษาที่ต้องการประมาณการ
              </label>
              <select
                id="treatment-select"
                value={treatmentId}
                onChange={(e) => setTreatmentId(e.target.value)}
                className="h-14 w-full rounded-2xl border-2 border-black/[0.10] bg-white px-4 text-lg font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
              >
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {treatment.note && (
                <p className="text-base leading-relaxed text-slate-600 font-medium">
                  {treatment.note}
                </p>
              )}
            </div>

            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2 text-lg font-black text-slate-950">
                3. ประเภทโรงพยาบาล
              </legend>
              <div className="flex flex-col gap-2">
                {hospitalTypes.map((h) => (
                  <label
                    key={h.id}
                    className={cn(
                      'flex min-h-20 cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-colors duration-200',
                      hospital === h.id
                        ? 'border-[#115af2] bg-[#eef5ff]'
                        : 'border-transparent bg-[#f5f5f7] hover:bg-[#ececf0]',
                    )}
                  >
                    <input
                      type="radio"
                      name="hospital-type"
                      value={h.id}
                      checked={hospital === h.id}
                      onChange={() => setHospital(h.id)}
                      className="mt-1 size-5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="flex flex-col">
                      <span className="text-lg font-bold text-slate-950">
                        {h.name}
                      </span>
                      <span className="text-base leading-relaxed text-slate-600 font-medium">
                        {h.desc}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {privateHealthPolicy && (
              <label className="flex min-h-20 cursor-pointer items-start gap-4 rounded-2xl border-2 border-[#115af2]/20 bg-[#eef5ff] p-5">
                <input
                  type="checkbox"
                  checked={includePrivatePolicy}
                  onChange={(event) => setIncludePrivatePolicy(event.target.checked)}
                  className="mt-0.5 size-5 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-500"
                />
                <span>
                  <strong className="block text-lg text-cyan-950">รวมประกันสุขภาพที่พบ</strong>
                  <span className="mt-1 block text-base leading-relaxed text-cyan-700">{privateHealthPolicy.planName} · วงเงิน {privateHealthPolicy.sumInsured}</span>
                </span>
              </label>
            )}
          </div>

          {/* Liquid Glass Result */}
          <div className="flex flex-col gap-5 rounded-[32px] border border-black/[0.06] bg-white p-6 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-8 xl:col-span-9">
            <div className="space-y-6">
              <div>
                <p className="text-base font-black text-cyan-800">
                  {result.usesScannedAmount ? 'ผลคำนวณจากยอดที่สแกนและยืนยัน' : 'ผลการประมาณการค่ารักษา'}
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {treatment.name} · {hospitalTypes.find((h) => h.id === hospital)?.name}
                </h3>
              </div>

              <div className="overflow-x-auto pb-1">
                <dl
                  aria-label="สรุปค่ารักษาและผู้รับผิดชอบค่าใช้จ่าย"
                  className="grid min-w-[1380px] grid-cols-[1.05fr_1.2fr_1.2fr_1fr_1.1fr_1.05fr] overflow-hidden rounded-2xl border-2 border-black/[0.08] bg-white"
                >
                  <div className="min-w-0 border-r border-black/[0.08] bg-[#f5f5f7] p-5">
                    <dt className="flex items-center gap-2 text-base font-bold text-slate-600">
                      <Receipt className="size-5 shrink-0 text-slate-500" /> {result.usesScannedAmount ? 'ยอดจากภาพที่สแกน' : 'ราคาการรักษา'}
                    </dt>
                    <dd className="mt-2 whitespace-nowrap text-xl font-black text-slate-950">
                      {formatBaht(result.low)} - {formatBaht(result.high)} บาท
                    </dd>
                    <p className="mt-2 truncate text-sm text-slate-600" title={result.usesScannedAmount ? scanFileName : treatment.name}>{result.usesScannedAmount ? scanFileName : treatment.name}</p>
                  </div>

                  <div className="min-w-0 border-r border-black/[0.08] bg-[#eef5ff] p-5">
                    <dt className="flex items-center gap-2 text-base font-bold text-cyan-800">
                      <PiggyBank className="size-5 shrink-0 text-cyan-600" /> สิทธิภาครัฐช่วยจ่าย
                    </dt>
                    <dd className="mt-2 whitespace-nowrap text-xl font-black text-cyan-700">
                      {formatBaht(result.coveredLow)} - {formatBaht(result.coveredHigh)} บาท
                    </dd>
                    <p className="mt-2 truncate text-sm text-cyan-800" title={detectedSchemeName || schemes.find((scheme) => scheme.id === schemeId)?.name}>
                      {detectedSchemeName || schemes.find((scheme) => scheme.id === schemeId)?.name}
                    </p>
                  </div>

                  <div className="min-w-0 border-r border-black/[0.08] bg-[#eef5ff] p-5">
                    <dt className="flex items-center gap-2 text-base font-bold text-cyan-800">
                      <ShieldCheck className="size-5 shrink-0 text-cyan-600" /> ประกันสุขภาพช่วยจ่าย
                    </dt>
                    <dd className="mt-2 whitespace-nowrap text-xl font-black text-cyan-700">
                      {includePrivatePolicy && privateHealthPolicy
                        ? `${formatBaht(result.privateCoveredLow)} - ${formatBaht(result.privateCoveredHigh)} บาท`
                        : '0 บาท'}
                    </dd>
                    <p
                      className="mt-2 truncate text-sm text-cyan-800"
                      title={privateHealthPolicy?.planName || 'ไม่มีประกันสุขภาพร่วมคำนวณ'}
                    >
                      {privateHealthPolicy
                        ? includePrivatePolicy ? privateHealthPolicy.planName : 'ไม่ได้เลือกใช้ประกัน'
                        : 'ไม่มีประกันสุขภาพร่วมคำนวณ'}
                    </p>
                  </div>

                  <div className="min-w-0 border-r border-black/[0.08] bg-[#f5f5f7] p-5">
                    <dt className="text-base font-bold text-slate-600">ประเภทโรงพยาบาล</dt>
                    <dd
                      className="mt-2 truncate text-xl font-black text-slate-950"
                      title={hospitalTypes.find((item) => item.id === hospital)?.name}
                    >
                      {hospitalTypes.find((item) => item.id === hospital)?.name}
                    </dd>
                    <p className="mt-2 text-sm text-slate-600">ฐานราคาที่ใช้คำนวณ</p>
                  </div>

                  <div className="min-w-0 border-r border-black/[0.08] bg-[#dcfce7] p-5">
                    <dt className="text-base font-black text-emerald-900">ระบบช่วยจ่ายทั้งหมด</dt>
                    <dd className="mt-2 whitespace-nowrap text-xl font-black text-emerald-800">
                      {formatBaht(result.totalCoveredLow)} - {formatBaht(result.totalCoveredHigh)} บาท
                    </dd>
                    <p className="mt-2 text-sm font-bold text-emerald-800">สิทธิภาครัฐ + ประกันสุขภาพ</p>
                  </div>

                  <div className={cn('min-w-0 p-5', result.outHigh === 0 ? 'bg-[#eef5ff]' : 'bg-[#fee2e2]')}>
                    <dt className="flex items-center gap-2 text-base font-black text-slate-800">
                      <Wallet className="size-5 shrink-0 text-slate-700" /> เหลือจ่ายเอง
                    </dt>
                    <dd className="mt-2 whitespace-nowrap text-2xl font-black text-slate-950">
                      {result.outHigh === 0 ? '0 บาท' : `${formatBaht(result.outLow)} - ${formatBaht(result.outHigh)} บาท`}
                    </dd>
                    <p className="mt-2 text-sm font-bold text-slate-700">หลังหักทุกความคุ้มครอง</p>
                  </div>
                </dl>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-base font-black">
                  <span className="text-cyan-700">{result.coverage.label}</span>
                  <span className="text-slate-600">{pct}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-5 w-full overflow-hidden rounded-full bg-black/[0.06] p-1"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-700 shadow-sm"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl bg-[#f5f5f7] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-bold text-[#115af2]">การจัดลำดับสิทธิทับซ้อน</p>
                      <h4 className="mt-1 text-xl font-black text-[#1d1d1f]">ระบบเรียงผู้รับผิดชอบค่าใช้จ่ายก่อนคำนวณ</h4>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl bg-white p-5">
                      <span className="text-sm font-bold text-[#115af2]">ลำดับ 1 · สิทธิหลัก</span>
                      <strong className="mt-2 block text-lg leading-relaxed text-[#1d1d1f]">{detectedSchemeName || schemes.find((scheme) => scheme.id === schemeId)?.name}</strong>
                      <span className="mt-2 block text-base leading-relaxed text-[#6e6e73]">ยึดผลจากระบบเชื่อมต่อกลาง ไม่ให้ AI เลือกแทน</span>
                    </div>
                    <div className="rounded-2xl bg-white p-5">
                      <span className="text-sm font-bold text-[#115af2]">ลำดับ 2 · ความคุ้มครองเสริม</span>
                      <strong className="mt-2 block text-lg leading-relaxed text-[#1d1d1f]">{privateHealthPolicy && includePrivatePolicy ? privateHealthPolicy.planName : 'ไม่มีประกันสุขภาพร่วมคำนวณ'}</strong>
                      <span className="mt-2 block text-base leading-relaxed text-[#6e6e73]">พิจารณาเฉพาะยอดที่เหลือจากสิทธิหลัก</span>
                    </div>
                    <div className="rounded-2xl bg-white p-5">
                      <span className="text-sm font-bold text-[#115af2]">ลำดับ 3 · ผู้ใช้จ่ายเอง</span>
                      <strong className="mt-2 block text-xl leading-relaxed text-[#1d1d1f]">{formatBaht(result.outLow)} - {formatBaht(result.outHigh)} บาท</strong>
                      <span className="mt-2 block text-base leading-relaxed text-[#6e6e73]">ส่วนที่เหลือหลังหักความคุ้มครองตามลำดับ</span>
                    </div>
                  </div>
                  {lifePolicyName && <p className="mt-5 text-base leading-relaxed text-[#6e6e73]"><strong className="text-[#1d1d1f]">{lifePolicyName}</strong> เป็นประกันชีวิต จึงแสดงเป็นความคุ้มครองที่พบแต่ไม่นำวงเงินมาหักค่ารักษาอัตโนมัติ เว้นแต่มีสัญญาเพิ่มเติมสุขภาพที่ยืนยันได้</p>}
                </div>
                <div className="flex items-start gap-4 rounded-3xl bg-[#eef5ff] p-6">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#115af2]">
                    {aiLoading ? <Loader2 className="size-6 animate-spin" /> : <BrainCircuit className="size-6" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xl font-black text-[#1d1d1f]">AI สรุปเงื่อนไขและค่าใช้จ่าย</h4>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#115af2]">สิทธิ → ประกัน → จ่ายเอง</span>
                    </div>
                    <p className="mt-2 text-base leading-relaxed text-[#6e6e73]">AI อธิบายเงื่อนไขตามสิทธิ โรงพยาบาล และยอดที่เลือกเท่านั้น โดยไม่มีสิทธิแก้ไขข้อมูลจากระบบหรือยอดที่คำนวณไว้</p>
                    {aiLoading ? (
                      <p className="mt-3 text-base text-[#6e6e73]">กำลังอ่านสิทธิภาครัฐ กรมธรรม์ และเงื่อนไขการรักษา...</p>
                    ) : aiAnalysis ? (
                      <p className="mt-3 whitespace-pre-line text-base leading-loose text-[#424245]">{aiAnalysis}</p>
                    ) : (
                      <p className="mt-3 text-base leading-relaxed text-amber-800">{aiError || 'รอข้อมูลสำหรับการวิเคราะห์'}</p>
                    )}
                    {aiError && aiAnalysis && <p className="mt-3 text-sm font-bold text-amber-800">{aiError}</p>}
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-[#fff7e5] p-5 text-base font-medium leading-relaxed text-slate-700">
              <Info className="mt-0.5 size-5 shrink-0 text-cyan-700" />
              <p>
                ตัวเลขนี้เป็นข้อมูลสาธิตจากช่วงค่ารักษาและกฎความคุ้มครองเบื้องต้น
                กรณีใช้ประกัน ระบบสมมติให้ชดเชย 80% ของยอดคงเหลือภายในวงเงิน
                ค่าใช้จ่ายจริงขึ้นกับข้อยกเว้น ค่าเสียหายส่วนแรก อาการ และโรงพยาบาล
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
