'use client';

import React, { useEffect, useRef, useState } from 'react';
import { searchWelfareAndPolicies, uploadDocument, SearchResultItem, DocumentScanResult } from '@/lib/api';
import {
  Search,
  Globe,
  Sparkles,
  Loader2,
  BookOpen,
  Filter,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight,
  ImagePlus,
  X,
  Stethoscope,
  PackageCheck
} from 'lucide-react';

const POPULAR_QUESTIONS = [
  'แม่ผมติดเตียง ขอเตียงผู้ป่วยฟรีได้ไหม?',
  'ผ้าอ้อมผู้ใหญ่ เบิกจากกองทุนสุขภาพตำบลยังไง?',
  'ใช้บัตรทองรักษาที่ต่างจังหวัดได้ไหม?',
  'ประกันสังคมทำฟัน เบิกได้กี่บาทต่อปี?',
  'ฉุกเฉิน UCEP เข้าโรงพยาบาลเอกชนได้ไหม?',
  'ผู้พิการขอรถเข็นจาก พม. ได้อย่างไร?',
];

const AGENCY_FILTERS = [
  { id: 'all', label: 'ทั้งหมดทุกกระทรวง' },
  { id: 'สปสช', label: 'สปสช. (บัตรทอง)' },
  { id: 'พม', label: 'กระทรวง พม. (สวัสดิการ/กายอุปกรณ์)' },
  { id: 'กองทุน', label: 'กองทุนสุขภาพตำบล (กปท.)' },
  { id: 'ประกันสังคม', label: 'ประกันสังคม' },
  { id: 'ข้าราชการ', label: 'กรมบัญชีกลาง' },
];

export function WebSearchSection() {
  const [query, setQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docResult, setDocResult] = useState<DocumentScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results once a search/upload finishes
  useEffect(() => {
    if (hasSearched && !loading && !uploading) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasSearched, loading, uploading]);

  const handleAttach = (file: File | null) => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setAttachedFile(file);
    setImagePreview(file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const runWebSearch = async (searchQuery?: string, agency?: string) => {
    const targetQuery = (searchQuery !== undefined ? searchQuery : query).trim();
    const q = targetQuery || 'สิทธิประโยชน์บัตรทอง ผ้าอ้อมผู้ใหญ่';
    if (!targetQuery) {
      setQuery(q);
    }
    const ag = (agency !== undefined ? agency : selectedAgency);

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await searchWelfareAndPolicies(q, ag === 'all' ? undefined : ag);
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (attachedFile) {
      setUploading(true);
      setHasSearched(true);
      try {
        const res = await uploadDocument(attachedFile, 'medical_certificate');
        setDocResult(res);
      } catch (err) {
        console.error('Upload error:', err);
        setDocResult(null);
      } finally {
        setUploading(false);
        handleAttach(null);
      }
      if (query.trim()) {
        await runWebSearch();
      }
      return;
    }

    setDocResult(null);
    await runWebSearch();
  };

  const matchedEquipment: Array<{ item: string; agency: string; cost_saved: string; how_to_claim: string }> =
    docResult?.extracted_data?.matched_equipment || [];

  return (
    <section id="search" className="scroll-mt-20 py-20 bg-[#f5f5f7] border-b border-black/[0.06] relative overflow-x-clip">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 space-y-8 relative z-10">

        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            สืบค้นสิทธิประโยชน์ & ระเบียบทางการ
          </h2>
          <p className="text-slate-500 text-sm sm:text-base font-normal max-w-xl mx-auto">
            พิมพ์คำถามที่อยากรู้ หรือแนบรูปใบรับรองแพทย์ AI จะดึงข้อมูลจาก สปสช., กระทรวง พม., ประกันสังคม และ อปท. ให้โดยตรง
          </p>
        </div>

        {/* AI Prompt Card */}
        <div className="liquid-glass-card p-6 sm:p-8 rounded-[32px] space-y-5 shadow-xl shadow-black/[0.03]">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Attached Image Preview */}
            {attachedFile && (
              <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-3 animate-apple-fade-in">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt={attachedFile.name} className="size-14 rounded-xl object-cover border border-emerald-200/70" />
                ) : (
                  <div className="size-14 rounded-xl bg-white flex items-center justify-center border border-emerald-200/70">
                    <Stethoscope className="w-6 h-6 text-emerald-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-900 truncate">{attachedFile.name}</p>
                  <p className="text-[11px] text-emerald-700/80 font-medium">พร้อมให้ AI วิเคราะห์ — กดค้นหาเพื่อเริ่มการสแกน</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAttach(null)}
                  className="p-1.5 rounded-full hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer active:scale-90 shrink-0"
                  aria-label="ลบไฟล์แนบ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Prompt Input Capsule */}
            <div className="flex items-center gap-2.5 bg-white/90 border border-black/[0.08] rounded-[28px] pl-2 pr-2 py-2 shadow-xs focus-within:ring-4 focus-within:ring-emerald-500/15 focus-within:border-emerald-500 transition-all">
              <label
                className="size-11 rounded-2xl flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-all shrink-0"
                title="แนบรูปใบรับรองแพทย์ หรือเอกสารสิทธิ"
              >
                <ImagePlus className="w-5 h-5" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleAttach(e.target.files?.[0] || null)}
                />
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์สิ่งที่ต้องการค้นหา เช่น แม่ติดเตียง อยากขอเตียงผู้ป่วยฟรี..."
                className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
              />
              <button
                type="submit"
                disabled={loading || uploading || (!query.trim() && !attachedFile)}
                className="liquid-btn-primary flex items-center justify-center gap-2 size-11 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="ค้นหาข้อมูล"
              >
                {loading || uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>

          {/* Popular Question Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              คำถามที่คนอยากรู้:
            </span>
            {POPULAR_QUESTIONS.map((question, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(question);
                  setDocResult(null);
                  handleAttach(null);
                  runWebSearch(question);
                }}
                className="bg-black/[0.03] hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-medium px-3 py-1.5 rounded-full border border-black/[0.04] transition-all duration-200 cursor-pointer active:scale-95"
              >
                {question}
              </button>
            ))}
          </div>

          {/* Filter by Agency */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/[0.06] text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> กรองหน่วยงาน:
            </span>
            {AGENCY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedAgency(f.id);
                  runWebSearch(undefined, f.id);
                }}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                  selectedAgency === f.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-black/[0.03] text-slate-600 hover:bg-black/[0.06]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="scroll-mt-28 space-y-4">
          {/* AI Document Analysis Result */}
          {uploading && (
          <div className="liquid-glass-card rounded-[28px] p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-slate-600 font-semibold text-sm">AI กำลังอ่านและวิเคราะห์เอกสารที่แนบมา (OCR + Qwen Vision)...</p>
          </div>
        )}

        {!uploading && docResult && (
          <div className="liquid-glass-card rounded-[28px] p-6 sm:p-8 space-y-4 animate-apple-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                ผลการวิเคราะห์เอกสารโดย AI
              </h3>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                ความแม่นยำ OCR {(docResult.ocr_confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
              {docResult.extracted_data?.ai_clinical_summary || docResult.message || 'วิเคราะห์เอกสารเรียบร้อยแล้ว'}
            </p>
            {matchedEquipment.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
                  กายอุปกรณ์ที่สามารถขอรับได้:
                </p>
                {matchedEquipment.map((eq, i) => (
                  <div key={i} className="bg-white/80 border border-black/[0.05] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-900">{eq.item}</p>
                      <p className="text-xs text-slate-500 font-medium">{eq.how_to_claim}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="bg-emerald-100/70 text-emerald-900 border border-emerald-200/50 text-[11px] font-bold px-3 py-0.5 rounded-full">
                        {eq.agency}
                      </span>
                      <span className="text-xs font-black text-emerald-700">{eq.cost_saved}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Stream */}
        {loading && (
          <div className="liquid-glass-card rounded-[28px] p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-slate-600 font-semibold text-sm">กำลังสืบค้นระเบียบราชการและสิทธิประโยชน์แบบ Real-time...</p>
          </div>
        )}

        {!loading && hasSearched && (
          <div className="space-y-4 animate-apple-fade-in">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                พบข้อมูลระเบียบและสิทธิ ({results.length} รายการ)
              </h3>
            </div>
            {results.length === 0 ? (
              <div className="liquid-glass-card rounded-[28px] p-10 text-center text-slate-500 text-sm">
                ไม่พบข้อมูลตรงกับคำค้นหา ลองค้นหาด้วยคำอื่น เช่น &quot;สิทธิบัตรทอง&quot;, &quot;ผ้าอ้อมผู้ใหญ่&quot;
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className="liquid-glass-card rounded-3xl p-6 space-y-2.5 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="bg-emerald-100/70 text-emerald-900 border border-emerald-200/50 text-[11px] font-bold px-3 py-0.5 rounded-full">
                        {res.agency}
                      </span>
                      {res.verified && (
                        <span className="flex items-center gap-1 text-teal-700 text-xs font-semibold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" /> ข้อมูลระเบียบทางการ
                        </span>
                      )}
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {res.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">{res.snippet}</p>
                    <div className="pt-3 flex items-center justify-between border-t border-black/[0.05] text-xs">
                      <span className="text-slate-400 font-medium">{res.source}</span>
                      {res.url && (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold group/link"
                        >
                          <span>เปิดเว็บทางการ</span>
                          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
