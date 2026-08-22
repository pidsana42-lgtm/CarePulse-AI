'use client';

import React, { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { searchWelfareAndPolicies, SearchResultItem } from '@/lib/api';
import {
  Search,
  Globe,
  Building2,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Loader2,
  BookOpen,
  Filter,
  CheckCircle2
} from 'lucide-react';

const POPULAR_QUERIES = [
  'เบิกผ้าอ้อมผู้ใหญ่ กองทุนสุขภาพตำบล',
  'ขอรับเตียงผู้ป่วย / รถเข็น กระทรวง พม.',
  'สิทธิ 30 บาทรักษาทุกที่ ใช้ต่างจังหวัด',
  'ทันตกรรมประกันสังคม 900 บาท',
  'สิทธิฉุกเฉินวิกฤต UCEP 72 ชั่วโมง',
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

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [portals, setPortals] = useState<Array<{ name: string; domain: string; hotline: string }>>([]);
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
      setPortals(data.official_portals || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Perform default initial search for high-value welfare
  useEffect(() => {
    handleSearch('สิทธิประโยชน์ สปสช พม ผ้าอ้อมผู้ใหญ่ กายอุปกรณ์');
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <SiteHeader />
      <main className="flex-1 py-10 px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-8 pb-20">
        {/* Header Title */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>เครื่องมือค้นหาข้อมูลสิทธิ & ระเบียบราชการออนไลน์ (Web Search)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            ค้นหาสิทธิสุขภาพ กายอุปกรณ์ และสวัสดิการภาครัฐ
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-medium">
            ค้นหาข้อมูลระเบียบและสิทธิประโยชน์จาก สปสช., กระทรวง พม., กองทุนสุขภาพตำบล และประกันสังคม ได้ทันทีโดยไม่ต้องสแกนบัตร
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-lg space-y-4">
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
                placeholder="พิมพ์สิ่งที่ต้องการค้นหา เช่น ผ้าอ้อมผู้ใหญ่, เตียงผู้ป่วย, ทำฟันฟรี, สิทธิ 30 บาท..."
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

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              ผลการค้นหาสิทธิและระเบียบภาครัฐ ({results.length} รายการ)
            </h2>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-slate-600 font-semibold">กำลังดึงข้อมูลสิทธิและระเบียบราชการออนไลน์...</p>
            </div>
          ) : results.length === 0 && hasSearched ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-2">
              <p className="text-lg font-bold text-slate-800">ไม่พบผลการค้นหาตรงกับคำว่า &quot;{query}&quot;</p>
              <p className="text-sm text-slate-500">
                ลองใช้คำค้นหาที่กว้างขึ้น เช่น &quot;สิทธิบัตรทอง&quot;, &quot;ผ้าอ้อมผู้ใหญ่&quot;, &quot;กายอุปกรณ์&quot;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {results.map((res, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold px-3 py-1 rounded-full">
                        {res.agency}
                      </span>
                      {res.verified && (
                        <span className="flex items-center gap-1 text-teal-700 text-xs font-semibold bg-teal-50 px-2.5 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> ข้อมูลระเบียบทางการ
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{res.source}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {res.title}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                    {res.snippet}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      แหล่งอ้างอิง: <strong className="text-slate-700">{res.source}</strong>
                    </span>
                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold"
                      >
                        <span>ไปยังเว็บทางการ</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Official Healthcare Portals Directory */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
          <div>
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              เว็บไซต์และสายด่วนทางการของหน่วยงานภาครัฐ (Official Government Channels)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              เข้าถึงพอร์ทัลทางการเพื่อตรวจสอบสิทธิและระเบียบราชการฉบับเต็ม
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {portals.length > 0
              ? portals.map((p, i) => (
                  <a
                    key={i}
                    href={`https://www.${p.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl border border-white/10 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs text-emerald-300 font-bold block">{p.name}</span>
                      <span className="text-xs text-slate-400 mt-0.5 block">{p.domain}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-400">สายด่วน {p.hotline}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </a>
                ))
              : (
                  <>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs text-emerald-300 font-bold block">สปสช. (บัตรทอง 30 บาท)</span>
                      <span className="text-xs text-slate-400">nhso.go.th — สายด่วน 1330</span>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs text-teal-300 font-bold block">กระทรวง พม. (สวัสดิการ/คนพิการ)</span>
                      <span className="text-xs text-slate-400">m-society.go.th — สายด่วน 1300</span>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                      <span className="text-xs text-blue-300 font-bold block">สำนักงานประกันสังคม</span>
                      <span className="text-xs text-slate-400">sso.go.th — สายด่วน 1506</span>
                    </div>
                  </>
                )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
