import Link from 'next/link';
import { Camera, FileText, ShieldCheck, HeartPulse, UserCheck, Stethoscope, ChevronRight, PhoneCall } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="text-center py-6 sm:py-10">
        <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold mb-4 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ระบบปลอดภัย ได้รับการคุ้มครองข้อมูลสุขภาพ (PDPA)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
          ตรวจสอบสิทธิการรักษาพยาบาล <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
            เข้าใจง่าย ไม่ต้องโหลดแอป
          </span>
        </h1>

        <p className="mt-4 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium">
          ระบบช่วยเหลือประชาชน ผู้สูงอายุ และญาติผู้ป่วย ในการประเมินสิทธิบัตรทอง ประกันสังคม ข้าราชการ และสวัสดิการสุขภาพฟรี
        </p>

        {/* Primary Action Buttons - Large and accessible */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch justify-center gap-4 max-w-xl mx-auto">
          <Link
            href="/scan"
            className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-lg sm:text-xl py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Camera className="w-7 h-7" />
            <span>ถ่ายรูปเอกสารเพื่อตรวจสิทธิ</span>
          </Link>

          <Link
            href="/assessment"
            className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-800 font-bold text-lg py-4 px-6 rounded-2xl shadow-sm transition-all"
          >
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>กรอกข้อมูลประเมินสิทธิ</span>
          </Link>
        </div>
      </section>

      {/* Main Benefit Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 font-bold">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">ถ่ายรูปเอกสารผ่านมือถือ</h3>
            <p className="mt-2 text-slate-600 text-base">
              ถ่ายรูปบัตรประชาชน ใบส่งตัว หรือใบรับรองแพทย์ ระบบอ่านข้อมูลอัตโนมัติและเบลอข้อมูลส่วนบุคคลทันที
            </p>
          </div>
          <Link href="/scan" className="mt-4 inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline">
            เริ่มสแกนรูป <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 font-bold">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">คำนวณสิทธิทุกกองทุน</h3>
            <p className="mt-2 text-slate-600 text-base">
              ตรวจสอบครอบคลุมทั้งบัตรทอง 30 บาท, ประกันสังคม, ข้าราชการ, สิทธิผู้สูงอายุ และเงินช่วยเหลือคนพิการ
            </p>
          </div>
          <Link href="/assessment" className="mt-4 inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline">
            ทำแบบประเมิน <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">ความปลอดภัย PDPA สูงสุด</h3>
            <p className="mt-2 text-slate-600 text-base">
              ทำการ Masking เลขบัตรประชาชนและข้อมูลละเอียดอ่อนอัตโนมัติ ประมวลผลปลอดภัยตามมาตรฐานสากล
            </p>
          </div>
          <div className="mt-4 text-xs font-semibold text-slate-500">
            ระบบความปลอดภัย On-Premise / Secure Cloud
          </div>
        </div>
      </section>

      {/* Emergency Hotline Banner */}
      <section className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <PhoneCall className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-extrabold">เจ็บป่วยฉุกเฉินวิกฤต มีสิทธิทุกที่ (UCEP)</h4>
            <p className="text-white/90 text-sm mt-0.5">
              หมดสติ หายใจไม่ออก เจ็บหน้าอกรุนแรง เข้ารับการรักษาได้ทุกโรงพยาบาล ฟรี 72 ชั่วโมงแรก
            </p>
          </div>
        </div>
        <a
          href="tel:1669"
          className="bg-white text-red-600 hover:bg-red-50 font-black px-6 py-3 rounded-xl text-lg shadow-md whitespace-nowrap"
        >
          โทรเรียกรถพยาบาล 1669
        </a>
      </section>
    </div>
  );
}
