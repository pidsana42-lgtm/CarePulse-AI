'use client';

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, CheckCircle, RefreshCw, Upload } from 'lucide-react';

interface CameraCaptureProps {
  onImageCaptured: (file: File, previewUrl: string) => void;
  isLoading?: boolean;
}

export default function CameraCapture({ onImageCaptured, isLoading = false }: CameraCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onImageCaptured(file, objectUrl);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file input supporting mobile camera direct snap */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="camera-input"
      />

      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4"
        >
          <div className="w-20 h-20 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform group-hover:scale-105 transition-transform">
            <Camera className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">แตะที่นี่เพื่อ "ถ่ายรูปเอกสาร"</h3>
            <p className="text-slate-600 mt-1 text-base">หรือเลือกรูปภาพจากคลังภาพบนโทรศัพท์ของท่าน</p>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-full">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>ไม่ต้องติดตั้งแอปพลิเคชันเพิ่มเติม • ระบบ Mask ข้อมูลอัตโนมัติ</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-black max-h-[400px] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="รูปเอกสารที่ถ่าย"
              className="max-h-[400px] w-auto object-contain"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3">
                <RefreshCw className="w-10 h-10 animate-spin text-emerald-400" />
                <p className="font-semibold text-lg">กำลังอ่านข้อมูลและเซนเซอร์ข้อมูลส่วนบุคคล (PDPA)...</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetake}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-base transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>ถ่ายใหม่ / เลือกรูปใหม่</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
