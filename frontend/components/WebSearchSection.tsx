'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Search, Sparkles, ArrowUpRight } from 'lucide-react';

const EXAMPLE_QUESTIONS = [
  'แม่ผมติดเตียง ขอเตียงผู้ป่วยฟรีได้ไหม?',
  'ผ้าอ้อมผู้ใหญ่ เบิกจากกองทุนสุขภาพตำบลยังไง?',
  'ใช้บัตรทองรักษาที่ต่างจังหวัดได้ไหม?',
  'ประกันสังคมทำฟัน เบิกได้กี่บาทต่อปี?',
  'ฉุกเฉิน UCEP เข้าโรงพยาบาลเอกชนได้ไหม?',
  'ผู้พิการขอรถเข็นจาก พม. ได้อย่างไร?',
];

export function WebSearchSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const goAsk = (text?: string) => {
    const q = (text ?? query).trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <section id="ask-ai" className="scroll-mt-20 py-20 relative overflow-x-clip">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            มีคำถาม ถาม AI เลย
          </h2>
          <p className="text-slate-500 text-sm sm:text-base font-normal max-w-xl mx-auto">
            AI ค้นหาจากเว็บไซต์ทางการแบบ Real-time พร้อมอ้างอิงแหล่งข้อมูลจริงทุกครั้ง
          </p>
        </div>

        {/* Prompt Box — hands off to /search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goAsk();
          }}
          className="liquid-glass rounded-[32px] p-2.5 sm:p-3 flex items-center gap-2.5 shadow-2xl border border-white/90"
        >
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-700 flex items-center justify-center text-white shrink-0 shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="อธิบายความต้องการของคุณที่นี่..."
            className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
          />
          <button
            type="submit"
            className="liquid-btn-primary size-11 shrink-0 flex items-center justify-center shadow-lg cursor-pointer"
            aria-label="ถาม AI"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>

        {/* Example Questions */}
        <div className="space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            คำถามที่คนอยากรู้:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXAMPLE_QUESTIONS.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goAsk(q)}
                className="liquid-glass-card rounded-[22px] p-4 text-left flex items-start justify-between gap-2.5 text-xs sm:text-sm text-slate-800 font-bold group cursor-pointer"
              >
                <span>{q}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
