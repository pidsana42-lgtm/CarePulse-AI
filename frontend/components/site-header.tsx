'use client';

import React, { useState } from 'react';
import { HeartPulse, Stethoscope, Globe, ShieldCheck, Menu, X, Sparkles } from 'lucide-react';

const NAV_LINKS = [
  { href: '/assessment', label: 'ประเมินสิทธิสุขภาพ', icon: ShieldCheck },
  { href: '/scan', label: 'สแกนใบรับรองแพทย์', icon: Stethoscope },
  { href: '/search', label: 'ถาม AI', icon: Globe },
  { href: '/#estimator', label: 'ประมาณค่ารักษา' },
  { href: '/#equipment', label: 'อุปกรณ์ฟรี' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 pt-3 px-3 sm:px-6 w-full max-w-7xl mx-auto">
      <div className="liquid-glass rounded-full px-4 sm:px-6 h-16 flex items-center justify-between shadow-xl gap-2">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0 group transition-transform duration-300 hover:scale-105 active:scale-95">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-700 shadow-md shadow-emerald-600/30 ring-2 ring-white/60 shrink-0">
            <HeartPulse className="size-5 text-white" aria-hidden="true" />
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
            CarePulse <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">AI</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 xl:flex bg-white/40 p-1 rounded-full border border-white/60 backdrop-blur-md shrink-0">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-white/90 hover:text-emerald-900 hover:shadow-xs transition-all duration-200 whitespace-nowrap shrink-0"
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <a
            href="/scan"
            className="liquid-btn-secondary inline-flex h-9 items-center gap-1.5 px-3.5 text-xs font-bold whitespace-nowrap shrink-0"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>สแกนเอกสาร</span>
          </a>
          <a
            href="/assessment"
            className="liquid-btn-primary inline-flex h-9 items-center gap-1.5 px-3.5 text-xs font-bold whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>เริ่มประเมินสิทธิ</span>
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="xl:hidden p-2 rounded-full text-slate-800 hover:bg-white/60 active:scale-90 transition-all cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="เปิดเมนู"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="lg:hidden mt-2 liquid-glass rounded-[28px] p-4 space-y-1.5 shadow-2xl animate-apple-fade-in border border-white/80">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 hover:bg-emerald-500/10 hover:text-emerald-900 active:scale-98 transition-all"
            >
              {link.icon && <link.icon className="w-4 h-4 text-emerald-600" />}
              {link.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-white/50 mt-2">
            <a href="/scan" className="liquid-btn-secondary flex justify-center items-center gap-2 py-3 text-xs font-bold">
              <Stethoscope className="w-4 h-4 text-emerald-600" /> สแกนเอกสาร AI
            </a>
            <a href="/assessment" className="liquid-btn-primary flex justify-center items-center gap-2 py-3 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> เริ่มประเมินสิทธิ
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
