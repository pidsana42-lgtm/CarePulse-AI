'use client';

import React, { useState, useEffect } from 'react';
import { Type } from 'lucide-react';

export default function FontScaler() {
  const [scale, setScale] = useState<number>(1);

  const applyScale = (newScale: number) => {
    setScale(newScale);
    document.documentElement.style.setProperty('--font-scale', newScale.toString());
    localStorage.setItem('carepulse_font_scale', newScale.toString());
  };

  useEffect(() => {
    const saved = localStorage.getItem('carepulse_font_scale');
    if (saved) {
      const val = parseFloat(saved);
      setScale(val);
      document.documentElement.style.setProperty('--font-scale', val.toString());
    }
  }, []);

  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-2 py-1 shadow-sm">
      <span className="text-xs text-slate-500 font-medium px-1 flex items-center gap-1">
        <Type className="w-3.5 h-3.5" /> ขนาดตัวอักษร:
      </span>
      <button
        onClick={() => applyScale(0.9)}
        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-colors ${
          scale === 0.9 ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
        }`}
        title="ขนาดเล็ก"
        aria-label="ตัวอักษรขนาดเล็ก"
      >
        A-
      </button>
      <button
        onClick={() => applyScale(1.0)}
        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-colors ${
          scale === 1.0 ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
        }`}
        title="ขนาดปกติ"
        aria-label="ตัวอักษรขนาดปกติ"
      >
        A ปกติ
      </button>
      <button
        onClick={() => applyScale(1.25)}
        className={`px-2.5 py-1 text-sm font-bold rounded-full transition-colors ${
          scale === 1.25 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
        }`}
        title="ขนาดใหญ่พิเศษ (เหมาะสำหรับผู้สูงอายุ)"
        aria-label="ตัวอักษรขนาดใหญ่พิเศษ"
      >
        A+ ใหญ่
      </button>
    </div>
  );
}
