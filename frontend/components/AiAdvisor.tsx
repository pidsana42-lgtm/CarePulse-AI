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
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      <Link
        href="/search"
        className="flex h-12 items-center gap-2.5 rounded-full bg-[#115af2] px-3 text-white shadow-[0_14px_30px_-12px_rgba(17,90,242,0.7)] transition hover:bg-[#1a7bf0] active:scale-95 sm:px-4"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-white/15"><Bot className="size-4" /></span>
        <span className="hidden text-xs font-semibold sm:inline">ถาม CarePulse AI</span>
      </Link>
    </div>
  );
}
