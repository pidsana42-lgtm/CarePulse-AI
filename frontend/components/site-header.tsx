'use client';

import { useEffect, useState } from 'react';
import { HeartPulse, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearCarePulseSession, hasCarePulseSession } from '@/lib/session-memory';

const NAV_LINKS = [
  { href: '/assessment', label: 'ตรวจสิทธิ' },
  //{ href: '/estimate', label: 'ประเมินค่ารักษา' },
  //{ href: '/scan', label: 'อ่านเอกสารแพทย์' },
  { href: '/search', label: 'CarePulse AI' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    const refreshSessionState = () => setSessionActive(hasCarePulseSession());
    refreshSessionState();
    window.addEventListener('carepulse:session-updated', refreshSessionState);
    return () => window.removeEventListener('carepulse:session-updated', refreshSessionState);
  }, []);

  const endSession = () => {
    if (!window.confirm('จบช่วงการใช้งานและล้างข้อมูลสิทธิ ผลเอกสาร และบริบท AI ชั่วคราวทั้งหมดใช่หรือไม่?')) return;
    clearCarePulseSession();
    window.location.assign('/assessment');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5.5 bg-white">
      <div className="mx-auto flex h-20 sm:h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
        <a href="/assessment" className="flex items-center gap-2 text-[#1d1d1f] transition-opacity hover:opacity-70">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#072b77] text-white">
            <HeartPulse className="size-4" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">CarePulse AI</span>
        </a>

        <nav aria-label="เมนูหลัก" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-[#1d1d1f] transition-opacity hover:opacity-55">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 sm:flex">
          {sessionActive && (
            <Button type="button" variant="ghost" size="sm" onClick={endSession} className="rounded-full px-3 text-sm text-[#6e6e73]">
              <LogOut className="size-3.5" /> จบช่วงการใช้งาน
            </Button>
          )}
          <a href="/assessment" className="inline-flex h-9 items-center rounded-full bg-[#115af2] px-3.5 text-sm font-semibold text-white transition hover:bg-cyan-600">
            เริ่มตรวจสิทธิ
          </a>
        </div>

        <button type="button" className="flex size-8 items-center justify-center rounded-full text-[#1d1d1f] md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={menuOpen}>
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {menuOpen && (
        <nav aria-label="เมนูบนมือถือ" className="border-t border-black/5.5 bg-white px-5 py-5 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="border-b border-black/5.5 py-3.5 text-lg font-semibold text-[#1d1d1f] last:border-0">
                {link.label}
              </a>
            ))}
            {sessionActive && (
              <Button type="button" variant="ghost" onClick={endSession} className="mt-2 h-11 justify-start rounded-none px-0 text-sm text-[#6e6e73]">
                <LogOut className="size-4" /> จบช่วงการใช้งานและล้างข้อมูล
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
