import { HeartPulse } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="relative z-10 bg-white text-[#6e6e73]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
        <div className="text-sm leading-relaxed">
          CarePulse AI เป็นระบบสาธิตเพื่อช่วยรวบรวมและอธิบายสิทธิ ข้อมูลที่จำเป็นจะอยู่ชั่วคราวเฉพาะช่วงการใช้งานในแท็บนี้เพื่อให้ AI ช่วยต่อเนื่อง และจะถูกลบเมื่อจบช่วงการใช้งานหรือปิดแท็บ
        </div>
        <div className="flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <a href="/assessment" className="flex items-center gap-2 text-[#1d1d1f]">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#072b77] text-white"><HeartPulse className="size-4" /></span>
            <span className="text-sm font-semibold">CarePulse AI</span>
          </a>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#424245]">
            <a href="/assessment" className="hover:underline">ตรวจสิทธิ</a>
            <a href="/estimate" className="hover:underline">ประเมินค่ารักษา</a>
            <a href="/scan" className="hover:underline">อ่านเอกสารแพทย์</a>
            <a href="/search" className="hover:underline">ถาม AI</a>
          </nav>
        </div>
        <div className="text-sm text-[#424245]">สายด่วน: สปสช. 1330 · ประกันสังคม 1506 · ฉุกเฉิน 1669</div>
      </div>
    </footer>
  );
}
