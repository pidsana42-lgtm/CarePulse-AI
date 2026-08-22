'use client';

import React, { useState } from 'react';
import { HeartPulse, Stethoscope, Globe, ShieldCheck, Menu, X } from 'lucide-react';

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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 shadow-sm">
            <HeartPulse className="size-5 text-white" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">
            CarePulse <span className="text-emerald-600">AI</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 lg:flex">
          <a href="/assessment" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ประเมินสิทธิ
          </a>
          <a href="/scan" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            สแกนใบรับรองแพทย์
          </a>
          <a href="/search" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
            <Globe className="w-4 h-4 text-blue-500" />
            ค้นหาออนไลน์
          </a>
          <a href="/#estimator" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
            ประมาณค่ารักษา
          </a>
          <a href="/#compare" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
            เปรียบเทียบสิทธิ
          </a>
          <a href="/#faq" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
            FAQ
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden sm:flex items-center gap-2">
          <a
            href="/scan"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 px-3.5 text-sm font-bold text-emerald-800 transition-all hover:bg-emerald-100"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            สแกนเอกสาร AI
          </a>
          <a
            href="/assessment"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-all hover:bg-emerald-700 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            เริ่มประเมินสิทธิ
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="เปิดเมนู"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 mt-2">
            <a href="/scan" className="flex justify-center items-center gap-2 py-2.5 rounded-xl border border-emerald-500 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all">
              <Stethoscope className="w-4 h-4" /> สแกนเอกสาร AI
            </a>
            <a href="/assessment" className="flex justify-center items-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all">
              <ShieldCheck className="w-4 h-4" /> เริ่มประเมินสิทธิ
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
