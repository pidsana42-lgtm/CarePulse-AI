'use client';

import React, { useState } from 'react';
import { HeartPulse, Stethoscope, Globe, ShieldCheck, Menu, X, Sparkles } from 'lucide-react';

const NAV_LINKS = [
  { href: '/assessment', label: 'ประเมินสิทธิสุขภาพ' },
  { href: '/scan', label: 'สแกนใบรับรองแพทย์' },
  { href: '/search', label: 'ค้นหาออนไลน์' },
  { href: '/#estimator', label: 'ประมาณค่ารักษา' },
  { href: '/#compare', label: 'เปรียบเทียบสิทธิ' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 apple-glass border-b border-black/[0.06] transition-all duration-300">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0 group transition-transform duration-300 hover:scale-105 active:scale-95">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-600/20">
            <HeartPulse className="size-5 text-white" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            CarePulse <span className="text-emerald-600 font-extrabold">AI</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 lg:flex bg-black/[0.03] p-1 rounded-full border border-black/[0.04]">
          <a href="/assessment" className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all duration-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ประเมินสิทธิ
          </a>
          <a href="/scan" className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all duration-200">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            สแกนใบรับรองแพทย์
          </a>
          <a href="/search" className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all duration-200">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            ค้นหาออนไลน์
          </a>
          <a href="/#estimator" className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all duration-200">
            ประมาณค่ารักษา
          </a>
          <a href="/#compare" className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all duration-200">
            เปรียบเทียบสิทธิ
          </a>
          <a href="/#faq" className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all duration-200">
            FAQ
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden sm:flex items-center gap-2.5">
          <a
            href="/scan"
            className="apple-button-secondary inline-flex h-9 items-center gap-1.5 px-4 text-xs font-bold"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            สแกนเอกสาร
          </a>
          <a
            href="/assessment"
            className="apple-button-primary inline-flex h-9 items-center gap-1.5 px-4 text-xs font-bold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            เริ่มประเมินสิทธิ
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden p-2 rounded-2xl text-slate-700 hover:bg-black/5 active:scale-95 transition-all"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="เปิดเมนู"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-black/[0.06] bg-white/95 backdrop-blur-2xl px-4 py-4 space-y-1.5 shadow-xl animate-apple-fade-in">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 active:scale-98 transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-black/[0.06] mt-2">
            <a href="/scan" className="apple-button-secondary flex justify-center items-center gap-2 py-3 text-xs font-bold">
              <Stethoscope className="w-4 h-4 text-emerald-600" /> สแกนเอกสาร AI
            </a>
            <a href="/assessment" className="apple-button-primary flex justify-center items-center gap-2 py-3 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> เริ่มประเมินสิทธิ
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
