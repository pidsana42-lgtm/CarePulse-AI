'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/CameraCapture';
import { uploadDocument } from '@/lib/api';
import { DocumentScanResult } from '@/types';
import { ShieldCheck, CheckCircle, ArrowRight, FileCheck } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const [docType, setDocType] = useState<string>('id_card');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);

  const handleImageCaptured = async (file: File) => {
    setIsLoading(true);
    try {
      const res = await uploadDocument(file, docType);
      setScanResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToAssessment = () => {
    // Navigate to assessment with pre-filled state if available
    router.push('/assessment');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          ถ่ายรูปเอกสารเพื่อตรวจสอบสิทธิ
        </h1>
        <p className="text-slate-600 mt-1 text-base">
          ใช้งานง่ายผ่านกล้องมือถือ ระบบจะทำการ Masking ข้อมูลส่วนตัวอัตโนมัติ (PDPA)
        </p>
      </div>

      {/* Document Type Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <label className="block text-sm font-bold text-slate-700">เลือกประเภทเอกสารที่ต้องการสแกน:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'id_card', label: 'บัตรประชาชน' },
            { id: 'referral_letter', label: 'ใบส่งตัว รพ.' },
            { id: 'medical_certificate', label: 'ใบรับรองแพทย์' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDocType(item.id)}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all ${
                docType === item.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Capture Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <CameraCapture onImageCaptured={handleImageCaptured} isLoading={isLoading} />
      </div>

      {/* Scan Result & PDPA Masked Preview */}
      {scanResult && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
              <FileCheck className="w-6 h-6 text-emerald-600" />
              <span>อ่านข้อมูลเอกสารเรียบร้อยแล้ว</span>
            </div>
            <div className="flex items-center gap-1 text-xs bg-emerald-200/80 text-emerald-900 font-bold px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>PDPA Masked</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-2 text-slate-800 text-sm sm:text-base">
            <div className="font-semibold text-slate-500 text-xs uppercase tracking-wide">
              ตัวอย่างข้อมูลที่ตรวจพบ (ทำการปกปิดข้อมูลส่วนบุคคล):
            </div>
            {Object.entries(scanResult.masked_preview).map(([key, val]) => (
              <div key={key} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-600 font-medium">{key}:</span>
                <span className="font-bold text-slate-900">{String(val)}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleProceedToAssessment}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-lg rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>ดำเนินการประเมินสิทธิการรักษาต่อ</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
