'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, FileImage, Images, Plus, RefreshCw, Trash2 } from 'lucide-react';

interface SelectedDocument {
  id: string;
  file: File;
  previewUrl: string | null;
}

interface CameraCaptureProps {
  onImagesCaptured: (files: File[]) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

export default function CameraCapture({ onImagesCaptured, onReset, isLoading = false }: CameraCaptureProps) {
  const [documents, setDocuments] = useState<SelectedDocument[]>([]);
  const documentsRef = useRef<SelectedDocument[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => () => {
    documentsRef.current.forEach((document) => {
      if (document.previewUrl) URL.revokeObjectURL(document.previewUrl);
    });
  }, []);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList).slice(0, Math.max(0, 10 - documents.length));
    const nextDocuments = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}-${crypto.randomUUID()}`,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setDocuments((current) => [...current, ...nextDocuments].slice(0, 10));
    onImagesCaptured(files);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const clearAll = () => {
    documents.forEach((document) => {
      if (document.previewUrl) URL.revokeObjectURL(document.previewUrl);
    });
    setDocuments([]);
    onReset?.();
  };

  return (
    <div className="w-full">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(event) => addFiles(event.target.files)} className="hidden" />
      <input ref={galleryInputRef} type="file" accept="image/*,.pdf" multiple onChange={(event) => addFiles(event.target.files)} className="hidden" />

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 py-8 text-center sm:py-12">
          <div className="flex size-20 items-center justify-center rounded-full bg-[#115af2] text-white">
            <Images className="size-9" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#1d1d1f] sm:text-2xl">แนบเอกสารได้หลายใบ</h3>
            <p className="mt-1 text-sm text-[#6e6e73] sm:text-base">สูงสุด 10 ไฟล์ รองรับรูปภาพและเอกสารพีดีเอฟ ไฟล์ละไม่เกิน 10 เมกะไบต์</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => cameraInputRef.current?.click()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#115af2] px-5 text-sm font-semibold text-white hover:bg-[#1a7bf0]">
              <Camera className="size-4" /> ถ่ายรูปเอกสาร
            </button>
            <button type="button" onClick={() => galleryInputRef.current?.click()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/[0.12] bg-white px-5 text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7]">
              <Images className="size-4" /> เลือกหลายไฟล์
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#1d1d1f]">เอกสารที่เลือก {documents.length} ใบ</h3>
              <p className="text-xs text-[#6e6e73]">AI จะอ่านทีละใบและรวมผลให้โดยอัตโนมัติ</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={isLoading || documents.length >= 10} onClick={() => cameraInputRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-full border border-black/[0.12] bg-white px-4 text-xs font-semibold text-[#1d1d1f] disabled:opacity-40">
                <Camera className="size-3.5" /> ถ่ายเพิ่ม
              </button>
              <button type="button" disabled={isLoading || documents.length >= 10} onClick={() => galleryInputRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#115af2] px-4 text-xs font-semibold text-white disabled:opacity-40">
                <Plus className="size-3.5" /> เพิ่มหลายไฟล์
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {documents.map((document, index) => (
              <article key={document.id} className="relative overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
                <div className="aspect-[4/3] bg-[#f5f5f7]">
                  {document.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={document.previewUrl} alt={`เอกสารใบที่ ${index + 1}`} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[#115af2]"><FileImage className="size-8" /></div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-semibold text-[#1d1d1f]">{index + 1}. {document.file.name}</p>
                  <p className="mt-0.5 text-[10px] text-[#86868b]">{(document.file.size / 1024 / 1024).toFixed(1)} เมกะไบต์</p>
                </div>
                {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-[#072b77]/80 text-white"><RefreshCw className="size-6 animate-spin" /></div>}
              </article>
            ))}
          </div>

          <button type="button" onClick={clearAll} disabled={isLoading} className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-40">
            <Trash2 className="size-3.5" /> ล้างเอกสารทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}
