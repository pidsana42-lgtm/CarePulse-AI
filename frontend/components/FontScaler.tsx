'use client';

import React, { useState, useEffect } from 'react';
import { Type } from 'lucide-react';

export default function FontScaler() {
  const [scale, setScale] = useState<number>(1);

  const applyScale = (newScale: number) => {
    setScale(newScale);
    document.documentElement.style.setProperty('--font-scale', newScale.toString());
    document.documentElement.style.fontSize = `${newScale * 100}%`;
    localStorage.setItem('carepulse_font_scale', newScale.toString());
  };

  useEffect(() => {
    const saved = localStorage.getItem('carepulse_font_scale');
    if (saved) {
      const val = parseFloat(saved);
      setScale(val);
      document.documentElement.style.setProperty('--font-scale', val.toString());
      document.documentElement.style.fontSize = `${val * 100}%`;
    }
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
      <span className="flex items-center gap-1 px-1 text-sm font-bold text-slate-700">
        <Type className="size-5" /> ตัวอักษร
      </span>
      <button
        type="button"
        onClick={() => applyScale(1)}
        aria-pressed={scale === 1}
        className={`min-h-10 rounded-xl px-3 text-sm font-bold transition-colors ${
          scale === 1 ? 'bg-[#115af2] text-white' : 'text-slate-700 hover:bg-slate-100'
        }`}
        title="ขนาดปกติ"
        aria-label="ตัวอักษรขนาดปกติ"
      >
        A ปกติ
      </button>
      <button
        type="button"
        onClick={() => applyScale(1.15)}
        aria-pressed={scale === 1.15}
        className={`min-h-10 rounded-xl px-3 text-base font-bold transition-colors ${
          scale === 1.15 ? 'bg-[#115af2] text-white' : 'text-slate-700 hover:bg-slate-100'
        }`}
        title="ขนาดใหญ่"
        aria-label="ตัวอักษรขนาดใหญ่"
      >
        A+ ใหญ่
      </button>
      <button
        type="button"
        onClick={() => applyScale(1.3)}
        aria-pressed={scale === 1.3}
        className={`min-h-10 rounded-xl px-3 text-lg font-black transition-colors ${
          scale === 1.3 ? 'bg-[#115af2] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
        }`}
        title="ขนาดใหญ่มาก เหมาะสำหรับผู้สูงอายุ"
        aria-label="ตัวอักษรขนาดใหญ่มาก"
      >
        A++ ใหญ่มาก
      </button>
    </div>
  );
}
