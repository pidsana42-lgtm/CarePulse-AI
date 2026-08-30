import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16">
      <div className="liquid-mesh-orb-1 -left-28 top-0" />
      <div className="liquid-mesh-orb-2 right-0 top-40" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-900">
            <Database className="size-3.5" />
            ระบบสาธิตที่อ้างอิงข้อมูลจากหน่วยงานทางการ
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">
              กรอกข้อมูลครั้งเดียว<br />
              <span className="text-cyan-700">รู้ว่าสิทธิไหนควรตรวจต่อ</span>
            </h1>
            <p className="max-w-xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
              CarePulse AI ช่วยคัดกรองสิทธิสุขภาพและสวัสดิการเบื้องต้น พร้อมบอกเหตุผล เอกสาร ขั้นตอน และแหล่งข้อมูลที่ตรวจสอบได้
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="/assessment" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-cyan-700 px-7 text-base font-black text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:bg-cyan-800">
              <ShieldCheck className="size-5" /> เริ่มคัดกรองสิทธิ <ArrowRight className="size-4" />
            </a>
            <a href="#how-it-works" className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-base font-black text-slate-800 transition hover:border-cyan-300 hover:bg-cyan-50">
              ดูวิธีทำงาน
            </a>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-cyan-600" /> ไม่ต้องกรอกเลขบัตรประชาชน</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-cyan-600" /> ใช้งานได้แม้ไม่เชื่อมระบบข้อมูลภาครัฐ</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-cyan-600" /> อ้างอิงกลับได้ทุกรายการ</span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800"><UserRound className="size-4" /></span>
                <div><p className="text-xs font-black text-slate-900">ตัวอย่างข้อมูลผู้ใช้</p><p className="text-[11px] text-slate-500">อายุ 78 ปี • นครราชสีมา • บัตรทอง</p></div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">ข้อมูลสาธิต</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><span className="text-[10px] font-black uppercase tracking-wide text-cyan-700">ข้อมูลตรงเกณฑ์เบื้องต้น</span><h3 className="mt-1 text-sm font-black text-cyan-950">บริการดูแลระยะยาว</h3></div>
                  <CheckCircle2 className="size-5 shrink-0 text-cyan-700" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-cyan-900">จับคู่จากอายุและภาวะติดเตียง แต่ยังต้องประเมินความสามารถในการทำกิจวัตรประจำวันโดยหน่วยบริการในพื้นที่</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><span className="text-[10px] font-black uppercase tracking-wide text-amber-700">ต้องมีข้อมูลเพิ่ม</span><h3 className="mt-1 text-sm font-black text-amber-950">ผ้าอ้อมผู้ใหญ่และแผ่นรองซับ</h3></div>
                  <AlertCircle className="size-5 shrink-0 text-amber-700" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-amber-900">ต้องให้บุคลากรสาธารณสุขยืนยันภาวะพึ่งพิงและเงื่อนไขในพื้นที่</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3"><FileText className="size-4 text-slate-500" /><p className="mt-2 text-xs font-black text-slate-900">เอกสารที่ต้องเตรียม</p><p className="mt-0.5 text-[11px] text-slate-500">บัตรประชาชน + ผลประเมิน</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><ClipboardList className="size-4 text-slate-500" /><p className="mt-2 text-xs font-black text-slate-900">ขั้นตอนถัดไป</p><p className="mt-0.5 text-[11px] text-slate-500">ติดต่อ รพ.สต. หรือ 1330</p></div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <span className="text-xs font-bold">มีแหล่งข้อมูลทางการให้ตรวจสอบ</span>
              <ExternalLink className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
