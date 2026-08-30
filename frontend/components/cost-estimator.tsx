'use client'

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  BrainCircuit,
  Camera,
  CheckCircle2,
  FileImage,
  ImagePlus,
  Info,
  Loader2,
  ScanLine,
  Wallet,
  PiggyBank,
  Receipt,
  ShieldCheck,
  X,
  FileText,
  Sparkles,
  Building2,
  Edit3,
  ListFilter,
  Activity,
} from 'lucide-react'
import {
  schemes,
  treatments,
  hospitalTypes,
  getCoverage,
  formatBaht,
  type SchemeId,
  type HospitalType,
  type Treatment,
} from '@/lib/health-data'
import { cn } from '@/lib/utils'
import { askAiAdvisor, uploadDocument } from '@/lib/api'
import { MarkdownText } from '@/components/markdown-text'

type TreatmentMode = 'doc' | 'custom' | 'popular' | 'scan'

function extractScannedAmount(rawText: string): number | null {
  const labels = /(?:ยอดสุทธิ|ยอดรวม(?:ทั้งสิ้น)?|รวมทั้งสิ้น|ค่าใช้จ่ายรวม|total(?:\s*amount)?|grand\s*total|amount)/gi
  const matches = Array.from(rawText.matchAll(labels)).map((match) => {
    const followingText = rawText.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 48)
    const amountMatch = followingText.match(/(?:฿|บาท)?\s*([\d,]{3,}(?:\.\d{1,2})?)/)
    return amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0
  }).filter((amount) => Number.isFinite(amount) && amount >= 100 && amount <= 10_000_000)

  return matches.length ? Math.max(...matches) : null
}

function matchTreatmentFromKeyword(keyword: string): Treatment | null {
  const k = keyword.toLowerCase()
  if (k.includes('ไต') || k.includes('kidney') || k.includes('dialysis')) {
    return treatments.find((t) => t.id === 'dialysis') ?? null
  }
  if (k.includes('ไส้ติ่ง') || k.includes('append')) {
    return treatments.find((t) => t.id === 'appendectomy') ?? null
  }
  if (k.includes('ต้อ') || k.includes('cataract') || k.includes('ตา')) {
    return treatments.find((t) => t.id === 'cataract') ?? null
  }
  if (k.includes('มะเร็ง') || k.includes('cancer') || k.includes('chemo') || k.includes('เคมี')) {
    return treatments.find((t) => t.id === 'chemo') ?? null
  }
  if (k.includes('เข่า') || k.includes('knee') || k.includes('ข้อ')) {
    return treatments.find((t) => t.id === 'knee-replacement') ?? null
  }
  if (k.includes('คลอด') || k.includes('birth') || k.includes('ทารก')) {
    return treatments.find((t) => t.id === 'natural-birth') ?? null
  }
  if (k.includes('หัวใจ') || k.includes('heart') || k.includes('bypass')) {
    return treatments.find((t) => t.id === 'heart-bypass') ?? null
  }
  if (k.includes('หลอดเลือดสมอง') || k.includes('stroke') || k.includes('อัมพาต')) {
    return treatments.find((t) => t.id === 'stroke') ?? null
  }
  if (k.includes('นิ่ว') || k.includes('gallbladder')) {
    return treatments.find((t) => t.id === 'gallbladder') ?? null
  }
  if (k.includes('ไข้เลือดออก') || k.includes('dengue')) {
    return treatments.find((t) => t.id === 'dengue') ?? null
  }
  return null
}

interface CostEstimatorProps {
  initialScheme?: SchemeId
  detectedSchemeName?: string
  detectedSchemeStatus?: string
  primaryProvider?: {
    name: string
    hcode?: string
    province?: string
  }
  medicalDocumentDiagnosis?: string
  allDiagnoses?: string[]
  privateHealthPolicy?: {
    planName: string
    sumInsured: string
  }
  lifePolicyName?: string
}

export function CostEstimator({
  initialScheme = 'ucs',
  detectedSchemeName,
  detectedSchemeStatus = 'มีสิทธิใช้งาน (ACTIVE)',
  primaryProvider,
  medicalDocumentDiagnosis,
  allDiagnoses = [],
  privateHealthPolicy,
  lifePolicyName,
}: CostEstimatorProps) {
  const [schemeId, setSchemeId] = useState<SchemeId>(initialScheme)
  const [showSchemeSelect, setShowSchemeSelect] = useState(false)
  
  // Available diagnoses from certificate
  const docDiagnoses = useMemo(() => {
    const list = [...allDiagnoses]
    if (medicalDocumentDiagnosis && !list.includes(medicalDocumentDiagnosis)) {
      list.unshift(medicalDocumentDiagnosis)
    }
    return list.filter(Boolean)
  }, [allDiagnoses, medicalDocumentDiagnosis])

  const initialMode: TreatmentMode = docDiagnoses.length > 0 ? 'doc' : 'popular'
  const [treatmentMode, setTreatmentMode] = useState<TreatmentMode>(initialMode)
  const [selectedDocDiagnosis, setSelectedDocDiagnosis] = useState<string>(docDiagnoses[0] || '')
  const [customTreatmentName, setCustomTreatmentName] = useState<string>('')
  const [customCostLow, setCustomCostLow] = useState<string>('')
  const [customCostHigh, setCustomCostHigh] = useState<string>('')
  const [popularTreatmentId, setPopularTreatmentId] = useState<string>('appendectomy')
  
  const [hospital, setHospital] = useState<HospitalType>('public-registered')
  const [includePrivatePolicy, setIncludePrivatePolicy] = useState(Boolean(privateHealthPolicy))
  
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  
  const [scannedAmount, setScannedAmount] = useState<number | null>(null)
  const [scanFileName, setScanFileName] = useState('')
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle')
  const [scanMessage, setScanMessage] = useState('')
  const scanInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setSchemeId(initialScheme), [initialScheme])
  useEffect(() => setIncludePrivatePolicy(Boolean(privateHealthPolicy)), [privateHealthPolicy])
  useEffect(() => {
    if (docDiagnoses.length > 0 && !selectedDocDiagnosis) {
      setSelectedDocDiagnosis(docDiagnoses[0])
    }
  }, [docDiagnoses, selectedDocDiagnosis])

  useEffect(() => () => {
    if (scanPreviewUrl) URL.revokeObjectURL(scanPreviewUrl)
  }, [scanPreviewUrl])

  // Derive active treatment details
  const activeTreatment = useMemo((): Treatment => {
    if (treatmentMode === 'doc') {
      const matched = matchTreatmentFromKeyword(selectedDocDiagnosis)
      if (matched) {
        return { ...matched, name: `${selectedDocDiagnosis} (${matched.name})` }
      }
      return {
        id: 'doc-custom',
        name: selectedDocDiagnosis || 'การวินิจฉัยจากใบรับรองแพทย์',
        note: 'ประเมินจากข้อบ่งชี้ทางการแพทย์ในใบรับรองแพทย์',
        cost: { public: [20000, 50000], private: [60000, 150000] },
      }
    }

    if (treatmentMode === 'custom') {
      const low = Number(customCostLow) || 15000
      const high = Number(customCostHigh) || Math.max(low, 40000)
      const matched = matchTreatmentFromKeyword(customTreatmentName)
      return {
        id: 'user-custom',
        name: customTreatmentName.trim() || 'การรักษาที่ระบุเอง',
        note: matched?.note || 'ประเมินตามการรักษาที่ผู้ใช้ระบุ',
        cost: {
          public: [low, high],
          private: [Math.round(low * 2.5), Math.round(high * 3)],
        },
      }
    }

    if (treatmentMode === 'scan') {
      const amt = scannedAmount || 30000
      return {
        id: 'scan-treatment',
        name: scanFileName ? `เอกสาร: ${scanFileName}` : 'ยอดตามเอกสารที่สแกน',
        note: 'คำนวณตามยอดรวมที่อ่านได้จากภาพ',
        cost: { public: [amt, amt], private: [amt, amt] },
      }
    }

    return treatments.find((t) => t.id === popularTreatmentId) ?? treatments[0]
  }, [treatmentMode, selectedDocDiagnosis, customTreatmentName, customCostLow, customCostHigh, scanFileName, scannedAmount, popularTreatmentId])

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

  // Cost calculation
  const result = useMemo(() => {
    const coverage = getCoverage(schemeId, hospital, activeTreatment.id)
    const isPrivate = hospital === 'private'
    const [baseLow, baseHigh] = isPrivate ? activeTreatment.cost.private : activeTreatment.cost.public
    const useScannedAmount = treatmentMode === 'scan' && scannedAmount !== null && scannedAmount >= 0
    const low = useScannedAmount ? (scannedAmount as number) : baseLow
    const high = useScannedAmount ? (scannedAmount as number) : baseHigh
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
  }, [schemeId, hospital, activeTreatment, includePrivatePolicy, privateHealthPolicy, treatmentMode, scannedAmount])

  const pct = Math.round(result.coverage.coverageRate * 100)

  // AI Advisor evaluation runner
  const runAiEvaluation = async () => {
    setAiLoading(true)
    setAiError('')
    const schemeName = detectedSchemeName || schemes.find((scheme) => scheme.id === schemeId)?.name || 'ไม่พบสิทธิภาครัฐ'
    const hospitalName = hospitalTypes.find((item) => item.id === hospital)?.name || hospital
    const providerInfo = primaryProvider ? ` (หน่วยบริการประจำ: ${primaryProvider.name})` : ''
    const privatePolicyText = privateHealthPolicy && includePrivatePolicy
      ? `${privateHealthPolicy.planName} วงเงิน ${privateHealthPolicy.sumInsured}`
      : 'ไม่ได้นำประกันเอกชนมาคำนวณ'
    const coordinationRule = `ใช้สิทธิภาครัฐเป็นสิทธิหลักก่อน${privateHealthPolicy && includePrivatePolicy ? ' แล้วส่งยอดคงเหลือให้ประกันสุขภาพพิจารณา' : ''}${lifePolicyName ? ' โดยไม่นำประกันชีวิตมาหักค่ารักษาอัตโนมัติ' : ''}`
    
    const fallbackAnalysis = [
      `• **สิทธิและการเบิกจ่าย**: ${schemeName}${providerInfo}${privateHealthPolicy && includePrivatePolicy ? ` ร่วมกับ ${privateHealthPolicy.planName}` : ''} ครอบคลุมการรักษามาตรฐาน ณ ${hospitalName}`,
      `• **สรุปยอดจ่ายจริง**: สิทธิและประกันช่วยจ่ายรวม ${formatBaht(result.totalCoveredLow)} - ${formatBaht(result.totalCoveredHigh)} บาท ทำให้คุณเหลือจ่ายเองประมาณ **${result.outHigh === 0 ? '0 บาท' : `${formatBaht(result.outLow)} - ${formatBaht(result.outHigh)} บาท`}**`,
      '• **สิ่งที่ต้องเตรียม/ยืนยัน**: ติดต่อยืนยันการใช้สิทธิหรือขอใบส่งตัว ณ หน่วยบริการประจำก่อนเข้ารับบริการ (ตัวเลขเป็นการประมาณการเบื้องต้น)',
    ].join('\n')

    try {
      const response = await askAiAdvisor([
        {
          role: 'system',
          content: 'คุณคือ CarePulse AI ผู้เชี่ยวชาญด้านสิทธิการรักษาพยาบาลและค่ารักษาของไทย\n\n[ข้อกำหนดการตอบอย่างเด็ดขาด]:\n1. ห้ามเขียนคำขึ้นต้นที่เป็นทางการ เช่น "เรียน ท่านผู้ใช้งาน", "ในฐานะ CarePulse AI...", หรือ "ข้าพเจ้าขอเรียนยืนยันว่า..." เด็ดขาด!\n2. ห้ามทำตารางซ้ำซ้อน\n3. ให้สรุปเนื้อหาเป็น 3 ข้อย่อยที่กระชับ สั้น ชัดเจน ตรงไปตรงมาทันที:\n• **สิทธิและการเบิกจ่าย**: สิทธิหลักและประกันคุ้มครองอย่างไรในโรงพยาบาลที่เลือก\n• **สรุปยอดจ่ายจริง**: สรุปยอดที่สิทธิช่วยจ่ายและส่วนต่างที่ผู้ป่วยต้องจ่ายเองอย่างชัดเจน\n• **สิ่งที่ต้องเตรียม/ยืนยัน**: เอกสารหรือขั้นตอนส่งตัวที่ต้องเตรียมกับโรงพยาบาล',
        },
        {
          role: 'user',
          content: [
            `สิทธิภาครัฐ: ${schemeName}${providerInfo}`,
            `ประกันสุขภาพ: ${privatePolicyText}`,
            `การรักษา/การวินิจฉัย: ${activeTreatment.name}`,
            `ประเภทโรงพยาบาล: ${hospitalName}`,
            `ค่ารักษาโดยประมาณ: ${formatBaht(result.low)} - ${formatBaht(result.high)} บาท`,
            `สิทธิภาครัฐช่วยจ่าย: ${formatBaht(result.coveredLow)} - ${formatBaht(result.coveredHigh)} บาท`,
            `ประกันเอกชนช่วยจ่าย: ${formatBaht(result.privateCoveredLow)} - ${formatBaht(result.privateCoveredHigh)} บาท`,
            `ผู้ใช้อาจต้องจ่ายเอง: ${formatBaht(result.outLow)} - ${formatBaht(result.outHigh)} บาท`,
            `เงื่อนไขจากระบบ: ${result.coverage.notes.join(' | ')}`,
            `กติกาสิทธิทับซ้อน: ${coordinationRule}`,
          ].join('\n'),
        },
      ], true, false)

      let analysis = response.provider.includes('Live Web Synthesizer') ? fallbackAnalysis : response.content
      // Clean any accidental formal intro if model emitted it
      analysis = analysis.replace(/^เรียน\s+ท่านผู้ใช้งาน[\s\S]*?(?=•|\d\)|###|\*\*)/i, '').trim()
      setAiAnalysis(analysis || fallbackAnalysis)
    } catch (error) {
      setAiAnalysis(fallbackAnalysis)
      setAiError('AI ตอบกลับไม่สำเร็จ จึงแสดงผลสรุปจากระบบคำนวณแทน')
    } finally {
      setAiLoading(false)
    }
  }

  // Auto-run on initial mount with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      runAiEvaluation()
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeId, hospital, activeTreatment.id, includePrivatePolicy])

  return (
    <section
      id="estimator"
      className="estimate-standard relative scroll-mt-20 overflow-hidden py-8 sm:py-10"
    >
      <div className="w-full space-y-8 px-4 sm:px-8 lg:px-10 2xl:px-14">
        <div className="grid gap-6 xl:grid-cols-12">
          {/* ── Left Form Panel ── */}
          <div className="flex flex-col gap-6 rounded-[32px] border border-black/[0.06] bg-white p-6 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-8 xl:col-span-4">
            
            {/* 1. สิทธิการรักษาของคุณ */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-slate-950 flex items-center gap-2">
                  <ShieldCheck className="size-5 text-cyan-600" />
                  1. สิทธิรักษาพยาบาลของคุณ
                </span>
                {detectedSchemeName && (
                  <button
                    type="button"
                    onClick={() => setShowSchemeSelect(!showSchemeSelect)}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-800 underline cursor-pointer"
                  >
                    {showSchemeSelect ? 'ซ่อนการเลือกสิทธิ' : 'สลับสิทธิอื่น'}
                  </button>
                )}
              </div>

              {detectedSchemeName && !showSchemeSelect ? (
                <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-[#eef5ff] to-cyan-50/50 p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-xs">
                      <ShieldCheck className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800">
                          <CheckCircle2 className="size-3 text-cyan-600" /> ดึงจากผลตรวจสิทธิล่าสุด
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {detectedSchemeStatus}
                        </span>
                      </div>
                      <strong className="mt-1.5 block text-base font-bold text-slate-900 leading-snug">
                        {detectedSchemeName}
                      </strong>
                      {primaryProvider && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-600 font-medium truncate">
                          <Building2 className="size-3.5 text-cyan-600 shrink-0" />
                          <span>{primaryProvider.name} {primaryProvider.hcode ? `(${primaryProvider.hcode})` : ''}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <select
                  id="scheme-select"
                  aria-label="เลือกสิทธิรักษาพยาบาล"
                  value={schemeId}
                  onChange={(e) => setSchemeId(e.target.value as SchemeId)}
                  className="h-12 w-full rounded-2xl border-2 border-black/[0.10] bg-white px-4 text-base font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
                >
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shortName === 'จ่ายเอง' ? 'ไม่มีสิทธิ / จ่ายเอง' : s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 2. การรักษาที่ต้องการประมาณการ */}
            <div className="flex flex-col gap-2.5">
              <span className="text-base font-black text-slate-950 flex items-center gap-2">
                <Activity className="size-5 text-cyan-600" />
                2. การรักษาที่ต้องการประมาณการ
              </span>

              {/* Mode Tabs */}
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#f5f5f7] p-1.5 text-xs font-bold">
                {docDiagnoses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTreatmentMode('doc')}
                    className={cn(
                      'flex items-center justify-center gap-1 rounded-xl py-2 transition cursor-pointer',
                      treatmentMode === 'doc'
                        ? 'bg-white text-cyan-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <FileText className="size-3.5" />
                    <span>จากใบรับรอง</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTreatmentMode('custom')}
                  className={cn(
                    'flex items-center justify-center gap-1 rounded-xl py-2 transition cursor-pointer',
                    treatmentMode === 'custom'
                      ? 'bg-white text-cyan-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                    docDiagnoses.length === 0 && 'col-span-1'
                  )}
                >
                  <Edit3 className="size-3.5" />
                  <span>พิมพ์เอง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTreatmentMode('popular')}
                  className={cn(
                    'flex items-center justify-center gap-1 rounded-xl py-2 transition cursor-pointer',
                    treatmentMode === 'popular'
                      ? 'bg-white text-cyan-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                    docDiagnoses.length === 0 && 'col-span-2'
                  )}
                >
                  <ListFilter className="size-3.5" />
                  <span>รายการยอดนิยม</span>
                </button>
              </div>

              {/* Mode A: From Medical Document */}
              {treatmentMode === 'doc' && docDiagnoses.length > 0 && (
                <div className="space-y-2.5 rounded-2xl border border-cyan-100 bg-[#eef5ff] p-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-800">
                    <Sparkles className="size-3.5 text-cyan-600" />
                    พบคำวินิจฉัยจากใบรับรองแพทย์ ({docDiagnoses.length} รายการ)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {docDiagnoses.map((diag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDocDiagnosis(diag)}
                        className={cn(
                          'rounded-xl px-3 py-2 text-xs font-bold transition text-left cursor-pointer',
                          selectedDocDiagnosis === diag
                            ? 'bg-cyan-700 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-cyan-50 border border-black/[0.06]'
                        )}
                      >
                        {diag}
                      </button>
                    ))}
                  </div>
                  {activeTreatment.note && (
                    <p className="text-xs text-slate-500 leading-relaxed pt-1">
                      {activeTreatment.note}
                    </p>
                  )}
                </div>
              )}

              {/* Mode B: Custom Typed Treatment */}
              {treatmentMode === 'custom' && (
                <div className="space-y-3 rounded-2xl border border-black/[0.08] bg-[#f9fafb] p-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">ชื่อโรค / หัตถการที่ต้องการประมาณการ</label>
                    <input
                      type="text"
                      placeholder="เช่น ผ่าตัดส่องกล้อง, ฟอกไต, เปลี่ยนข้อสะโพก"
                      value={customTreatmentName}
                      onChange={(e) => setCustomTreatmentName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-black/[0.12] bg-white px-3.5 text-sm font-bold text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600">ราคาขั้นต่ำ (บาท)</label>
                      <input
                        type="number"
                        placeholder="15,000"
                        value={customCostLow}
                        onChange={(e) => setCustomCostLow(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.12] bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-cyan-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600">ราคาสูงสุด (บาท)</label>
                      <input
                        type="number"
                        placeholder="45,000"
                        value={customCostHigh}
                        onChange={(e) => setCustomCostHigh(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-black/[0.12] bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-cyan-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mode C: Popular Treatments Dropdown */}
              {treatmentMode === 'popular' && (
                <div className="space-y-2">
                  <select
                    id="treatment-select"
                    value={popularTreatmentId}
                    onChange={(e) => setPopularTreatmentId(e.target.value)}
                    className="h-12 w-full rounded-2xl border-2 border-black/[0.10] bg-white px-4 text-sm font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
                  >
                    {treatments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {activeTreatment.note && (
                    <p className="text-xs leading-relaxed text-slate-500 font-medium px-1">
                      {activeTreatment.note}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 3. ประเภทโรงพยาบาล */}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-base font-black text-slate-950 flex items-center gap-2">
                <Building2 className="size-5 text-cyan-600" />
                3. ประเภทโรงพยาบาล
              </legend>
              <div className="flex flex-col gap-2">
                {hospitalTypes.map((h) => (
                  <label
                    key={h.id}
                    className={cn(
                      'flex min-h-16 cursor-pointer items-start gap-3 rounded-2xl border-2 p-3.5 transition-colors duration-200',
                      hospital === h.id
                        ? 'border-cyan-600 bg-[#eef5ff]'
                        : 'border-transparent bg-[#f5f5f7] hover:bg-[#ececf0]'
                    )}
                  >
                    <input
                      type="radio"
                      name="hospital-type"
                      value={h.id}
                      checked={hospital === h.id}
                      onChange={() => setHospital(h.id)}
                      className="mt-1 size-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-bold text-slate-950">
                        {h.name} {h.id === 'public-registered' && primaryProvider ? `(${primaryProvider.name})` : ''}
                      </span>
                      <span className="text-xs leading-relaxed text-slate-500 font-medium">
                        {h.desc}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* 4. รวมประกันสุขภาพเสริม (ถ้าพบ) */}
            {privateHealthPolicy && (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-cyan-200 bg-[#eef5ff] p-4">
                <input
                  type="checkbox"
                  checked={includePrivatePolicy}
                  onChange={(event) => setIncludePrivatePolicy(event.target.checked)}
                  className="mt-0.5 size-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-500"
                />
                <span>
                  <strong className="block text-sm text-cyan-950">รวมประกันสุขภาพที่พบ</strong>
                  <span className="mt-0.5 block text-xs leading-relaxed text-cyan-700">
                    {privateHealthPolicy.planName} · วงเงิน {privateHealthPolicy.sumInsured}
                  </span>
                </span>
              </label>
            )}

            {/* Action Trigger Button: เริ่มประมาณค่ารักษาและประเมินด้วย AI */}
            <button
              type="button"
              onClick={runAiEvaluation}
              disabled={aiLoading}
              className="mt-2 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-[#115af2] px-6 text-base font-bold text-white shadow-lg transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>AI กำลังประเมินค่ารักษา...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-5" />
                  <span>เริ่มประมาณค่ารักษาและประเมินด้วย AI</span>
                </>
              )}
            </button>
          </div>

          {/* ── Right Result Dashboard Panel ── */}
          <div className="flex flex-col gap-6 rounded-[32px] border border-black/[0.06] bg-white p-6 shadow-[0_16px_50px_-36px_rgba(7,43,119,0.45)] sm:p-8 xl:col-span-8">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
                <div>
                  <p className="text-xs font-black text-cyan-800">
                    {result.usesScannedAmount ? 'ผลคำนวณจากยอดที่สแกนและยืนยัน' : 'ผลการประมาณการค่ารักษา'}
                  </p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {activeTreatment.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 font-medium">
                    สถานพยาบาล: {hospitalTypes.find((h) => h.id === hospital)?.name} {hospital === 'public-registered' && primaryProvider ? `(${primaryProvider.name})` : ''}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#eef5ff] px-4 py-2 text-right">
                  <span className="block text-[11px] font-bold text-cyan-700">สัดส่วนความคุ้มครอง</span>
                  <span className="text-xl font-black text-cyan-900">{pct}%</span>
                </div>
              </div>

              {/* 6-Column Summary Cards */}
              <div className="overflow-x-auto pb-1">
                <dl
                  aria-label="สรุปค่ารักษาและผู้รับผิดชอบค่าใช้จ่าย"
                  className="grid min-w-[900px] grid-cols-6 overflow-hidden rounded-2xl border border-black/[0.08] bg-white text-xs"
                >
                  <div className="min-w-0 border-r border-black/[0.08] bg-[#f5f5f7] p-4">
                    <dt className="flex items-center gap-1.5 font-bold text-slate-600">
                      <Receipt className="size-4 shrink-0 text-slate-500" /> ราคาการรักษา
                    </dt>
                    <dd className="mt-2 whitespace-nowrap text-base font-black text-slate-950">
                      {formatBaht(result.low)} - {formatBaht(result.high)}
                    </dd>
                    <p className="mt-1 truncate text-[11px] text-slate-500">บาท (ประมาณการ)</p>
                  </div>

                  <div className="min-w-0 border-r border-black/[0.08] bg-[#eef5ff] p-4">
                    <dt className="flex items-center gap-1.5 font-bold text-cyan-800">
                      <PiggyBank className="size-4 shrink-0 text-cyan-600" /> สิทธิรัฐช่วยจ่าย
                    </dt>
                    <dd className="mt-2 whitespace-nowrap text-base font-black text-cyan-700">
                      {formatBaht(result.coveredLow)} - {formatBaht(result.coveredHigh)}
                    </dd>
                    <p className="mt-1 truncate text-[11px] text-cyan-800" title={detectedSchemeName || schemes.find((s) => s.id === schemeId)?.name}>
                      {detectedSchemeName || schemes.find((s) => s.id === schemeId)?.shortName}
                    </p>
                  </div>

                  <div className="min-w-0 border-r border-black/[0.08] bg-[#eef5ff] p-4">
                    <dt className="flex items-center gap-1.5 font-bold text-cyan-800">
                      <ShieldCheck className="size-4 shrink-0 text-cyan-600" /> ประกันสุขภาพ
                    </dt>
                    <dd className="mt-2 whitespace-nowrap text-base font-black text-cyan-700">
                      {includePrivatePolicy && privateHealthPolicy
                        ? `${formatBaht(result.privateCoveredLow)} - ${formatBaht(result.privateCoveredHigh)}`
                        : '0 บาท'}
                    </dd>
                    <p className="mt-1 truncate text-[11px] text-cyan-800">
                      {includePrivatePolicy && privateHealthPolicy ? privateHealthPolicy.planName : 'ไม่ได้นำมาคำนวณ'}
                    </p>
                  </div>

                  <div className="min-w-0 border-r border-black/[0.08] bg-[#f5f5f7] p-4">
                    <dt className="font-bold text-slate-600">ประเภทโรงพยาบาล</dt>
                    <dd className="mt-2 truncate text-base font-black text-slate-950" title={hospitalTypes.find((item) => item.id === hospital)?.name}>
                      {hospitalTypes.find((item) => item.id === hospital)?.name}
                    </dd>
                    <p className="mt-1 text-[11px] text-slate-500">ฐานราคาที่ใช้</p>
                  </div>

                  <div className="min-w-0 border-r border-black/[0.08] bg-[#dcfce7] p-4">
                    <dt className="font-black text-emerald-900">รวมช่วยจ่าย</dt>
                    <dd className="mt-2 whitespace-nowrap text-base font-black text-emerald-800">
                      {formatBaht(result.totalCoveredLow)} - {formatBaht(result.totalCoveredHigh)}
                    </dd>
                    <p className="mt-1 text-[11px] font-bold text-emerald-800">สิทธิรัฐ + ประกัน</p>
                  </div>

                  <div className={cn('min-w-0 p-4', result.outHigh === 0 ? 'bg-[#eef5ff]' : 'bg-[#fee2e2]')}>
                    <dt className="flex items-center gap-1.5 font-black text-slate-800">
                      <Wallet className="size-4 shrink-0 text-slate-700" /> เหลือจ่ายเอง
                    </dt>
                    <dd className="mt-2 whitespace-nowrap text-lg font-black text-slate-950">
                      {result.outHigh === 0 ? '0 บาท' : `${formatBaht(result.outLow)} - ${formatBaht(result.outHigh)}`}
                    </dd>
                    <p className="mt-1 text-[11px] font-bold text-slate-700">หลังหักทุกสิทธิ</p>
                  </div>
                </dl>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-cyan-800">{result.coverage.label}</span>
                  <span className="text-slate-600">{pct}% ครอบคลุม</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-4 w-full overflow-hidden rounded-full bg-black/[0.06] p-0.5"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-[#115af2] transition-all duration-700 shadow-sm"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Coordination of Benefits (ลำดับสิทธิทับซ้อน) */}
              <div className="rounded-3xl bg-[#f5f5f7] p-5 sm:p-6 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[#115af2]">การจัดลำดับสิทธิทับซ้อน</p>
                  <h4 className="mt-0.5 text-base font-black text-[#1d1d1f]">ระบบเรียงผู้รับผิดชอบค่าใช้จ่ายตามข้อกฎหมาย</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 shadow-xs">
                    <span className="text-xs font-bold text-[#115af2]">ลำดับ 1 · สิทธิหลัก</span>
                    <strong className="mt-1.5 block text-sm font-bold text-[#1d1d1f]">
                      {detectedSchemeName || schemes.find((s) => s.id === schemeId)?.name}
                    </strong>
                    <span className="mt-1 block text-xs text-[#6e6e73]">
                      {primaryProvider ? `รพ.ตามสิทธิ: ${primaryProvider.name}` : 'ยึดผลจากระบบเชื่อมต่อกลาง'}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-xs">
                    <span className="text-xs font-bold text-[#115af2]">ลำดับ 2 · ประกันสุขภาพเสริม</span>
                    <strong className="mt-1.5 block text-sm font-bold text-[#1d1d1f]">
                      {privateHealthPolicy && includePrivatePolicy ? privateHealthPolicy.planName : 'ไม่มีประกันสุขภาพร่วมคำนวณ'}
                    </strong>
                    <span className="mt-1 block text-xs text-[#6e6e73]">พิจารณาเฉพาะยอดส่วนต่างจากสิทธิหลัก</span>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-xs">
                    <span className="text-xs font-bold text-[#115af2]">ลำดับ 3 · ผู้ป่วยจ่ายเอง</span>
                    <strong className="mt-1.5 block text-base font-black text-[#1d1d1f]">
                      {result.outHigh === 0 ? '0 บาท' : `${formatBaht(result.outLow)} - ${formatBaht(result.outHigh)} บาท`}
                    </strong>
                    <span className="mt-1 block text-xs text-[#6e6e73]">ส่วนที่เหลือหลังหักความคุ้มครองครบ</span>
                  </div>
                </div>
              </div>

              {/* AI Evaluation Output Card */}
              <div className="flex items-start gap-4 rounded-3xl bg-gradient-to-br from-[#eef5ff] to-cyan-50/40 p-6 border border-cyan-100/80 shadow-xs">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#115af2] shadow-xs">
                  {aiLoading ? <Loader2 className="size-5 animate-spin text-cyan-600" /> : <BrainCircuit className="size-5 text-cyan-600" />}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-slate-900">AI สรุปเงื่อนไขและค่าใช้จ่าย</h4>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-cyan-700 border border-cyan-200">
                        CarePulse Advisor
                      </span>
                    </div>
                  </div>
                  {aiLoading ? (
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-cyan-600" />
                      กำลังตรวจสอบเงื่อนไขสิทธิ กรมธรรม์ และคำนวณสัดส่วนค่าใช้จ่ายจริง...
                    </p>
                  ) : aiAnalysis ? (
                    <div className="text-sm leading-relaxed text-slate-800">
                      <MarkdownText content={aiAnalysis} className="font-medium" />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      กดปุ่ม &ldquo;เริ่มประมาณค่ารักษาและประเมินด้วย AI&rdquo; เพื่อให้ AI วิเคราะห์เงื่อนไขเฉพาะบุคคล
                    </p>
                  )}
                  {aiError && <p className="text-xs font-bold text-amber-800">{aiError}</p>}
                </div>
              </div>

            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 rounded-2xl bg-[#fff7e5] p-4 text-xs font-medium leading-relaxed text-slate-700 border border-amber-200/50">
              <Info className="mt-0.5 size-4 shrink-0 text-amber-700" />
              <p>
                ตัวเลขนี้เป็นผลจากการจำลองประมาณการตามอัตรากลางและกฎหมายสิทธิประโยชน์เบื้องต้น
                หากใช้ประกันสุขภาพเอกชน ระบบจะคำนวณชดเชย 80% ของยอดคงเหลือภายในวงเงิน
                ค่าใช้จ่ายจริงอาจเปลี่ยนแปลงตามดุลยพินิจของแพทย์ อาการ และโรงพยาบาลที่เข้ารับบริการ
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

