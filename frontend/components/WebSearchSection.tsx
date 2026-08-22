'use client';

import React, { useState } from 'react';
import { searchWelfareAndPolicies, SearchResultItem } from '@/lib/api';
import {
  Search,
  Globe,
  Sparkles,
  Loader2,
  BookOpen,
  Filter,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';

const POPULAR_QUERIES = [
  'เบิกผ้าอ้อมผู้ใหญ่ กองทุนสุขภาพตำบล',
  'ขอรับเตียงผู้ป่วย / รถเข็น กระทรวง พม.',
  'สิทธิ 30 บาทรักษาทุกที่ ต่างจังหวัด',
  'ทันตกรรมประกันสังคม 900 บาท',
  'สิทธิฉุกเฉินวิกฤต UCEP 72 ชม.',
  'เครื่องผลิตออกซิเจน ผู้ป่วยติดเตียง',
  'ฟอกไตฟรี สปสช.',
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

  const handleSearch = async (searchQuery?: string, agency?: string) => {
    const q = (searchQuery !== undefined ? searchQuery : query).trim();
    const ag = (agency !== undefined ? agency : selectedAgency);
    if (!q) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await searchWelfareAndPolicies(q, ag === 'all' ? undefined : ag);
      setResults(data.results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="search" className="scroll-mt-20 py-20 bg-[#f5f5f7] border-b border-black/[0.06] relative overflow-hidden">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 space-y-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/90 px-4 py-1 text-xs font-bold text-slate-800 shadow-xs backdrop-blur-md">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Real-Time Welfare Search</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            สืบค้นสิทธิประโยชน์ & ระเบียบทางการ
          </h2>
          <p className="text-slate-500 text-sm sm:text-base font-normal max-w-xl mx-auto">
            ดึงข้อมูลแบบ Real-time จาก สปสช., กระทรวง พม., ประกันสังคม และ อปท. โดยตรง ไม่ต้องพึ่งพา Mock Data
          </p>
        </div>

        {/* Apple Glass Search Card */}
        <div className="apple-glass-card p-6 sm:p-8 rounded-[32px] space-y-5 shadow-xl shadow-black/[0.03]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์สิทธิที่ต้องการค้นหา เช่น ผ้าอ้อมผู้ใหญ่, เตียงผู้ป่วย พม., สิทธิ 30 บาท..."
                className="w-full pl-12 pr-4 py-4 bg-white/90 border border-black/[0.08] rounded-2xl text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400 shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="apple-button-primary flex items-center justify-center gap-2 px-8 py-4 text-sm sm:text-base font-bold shrink-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>ค้นหาข้อมูล</span>
            </button>
          </form>

          {/* Quick Keyword Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> คำค้นยอดนิยม:
            </span>
            {POPULAR_QUERIES.map((keyword, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(keyword);
                  handleSearch(keyword);
                }}
                className="bg-black/[0.03] hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-medium px-3 py-1.5 rounded-full border border-black/[0.04] transition-all duration-200 cursor-pointer active:scale-95"
              >
                {keyword}
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
                  handleSearch(undefined, f.id);
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

        {/* Results Stream */}
        {loading && (
          <div className="apple-glass-card rounded-[28px] p-12 text-center space-y-3">
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
              <div className="apple-glass-card rounded-[28px] p-10 text-center text-slate-500 text-sm">
                ไม่พบข้อมูลตรงกับคำค้นหา ลองค้นหาด้วยคำอื่น เช่น &quot;สิทธิบัตรทอง&quot;, &quot;ผ้าอ้อมผู้ใหญ่&quot;
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className="apple-glass-card rounded-3xl p-6 space-y-2.5 group"
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
    </section>
  );
}
