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
  PhoneCall
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
    <section id="search" className="scroll-mt-20 py-16 bg-slate-50 border-b border-border">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>ค้นหาข้อมูลสิทธิ & ระเบียบราชการออนไลน์ (Web Search Tool)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            ค้นหาสิทธิประโยชน์ & กายอุปกรณ์ออนไลน์
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-medium">
            ค้นหาข้อมูลระเบียบราชการ สิทธิบัตรทอง ประกันสังคม กระทรวง พม. และกองทุนสุขภาพตำบล ได้ทันทีโดยไม่ต้องสแกนบัตรประชาชน
          </p>
        </div>

        {/* Search Input Box */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์สิทธิที่ต้องการค้นหา เช่น ผ้าอ้อมผู้ใหญ่, เตียงผู้ป่วย พม., ทำฟันฟรี, สิทธิ 30 บาท..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-primary hover:opacity-90 active:scale-98 text-primary-foreground font-bold px-7 py-3.5 rounded-2xl text-base shadow-md transition-all shrink-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span>ค้นหาข้อมูล</span>
            </button>
          </form>

          {/* Quick Keyword Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
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
                className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-medium px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                {keyword}
              </button>
            ))}
          </div>

          {/* Filter by Agency */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> กรองตามหน่วยงาน:
            </span>
            {AGENCY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedAgency(f.id);
                  handleSearch(undefined, f.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedAgency === f.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Stream */}
        {loading && (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs max-w-4xl mx-auto space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto" />
            <p className="text-slate-600 font-semibold text-sm">กำลังสืบค้นข้อมูลระเบียบและสิทธิประโยชน์ออนไลน์...</p>
          </div>
        )}

        {!loading && hasSearched && (
          <div className="max-w-4xl mx-auto space-y-3">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              ผลการค้นหา ({results.length} รายการ)
            </h3>
            {results.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
                ไม่พบข้อมูลตรงกับคำค้นหา ลองค้นหาด้วยคำอื่น เช่น &quot;สิทธิบัตรทอง&quot;, &quot;ผ้าอ้อมผู้ใหญ่&quot;
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                        {res.agency}
                      </span>
                      {res.verified && (
                        <span className="flex items-center gap-1 text-teal-700 text-xs font-semibold bg-teal-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> ข้อมูลระเบียบทางการ
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{res.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{res.snippet}</p>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                      <span className="text-slate-500">แหล่งข้อมูล: {res.source}</span>
                      {res.url && (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold"
                        >
                          <span>ดูเว็บทางการ</span>
                          <ExternalLink className="w-3 h-3" />
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
