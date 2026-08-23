'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';

export default function AiAdvisor() {
  const pathname = usePathname();

  // The full chat experience lives at /search — no shortcut needed there
  if (pathname === '/search') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href="/search"
        className="liquid-glass rounded-full py-3 px-5 flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-emerald-500/15 cursor-pointer group border border-white/80"
      >
        <div className="size-9 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-700 flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform">
          <Bot className="w-5 h-5" />
        </div>
        <span className="text-sm font-black text-slate-900 tracking-tight">ถาม AI สิทธิสุขภาพ</span>
        <span className="liquid-glass-pill bg-emerald-100/90 text-emerald-900 text-[10px] px-2.5 py-0.5 font-black uppercase">
          Live Web
        </span>
      </Link>
    </div>
  );
}
