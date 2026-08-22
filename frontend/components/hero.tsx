import { ShieldCheck, Stethoscope, Phone, ArrowRight } from 'lucide-react'

const HOTLINES = [
  { color: 'text-emerald-600', number: '1330', label: 'สปสช. บัตรทอง' },
  { color: 'text-teal-600', number: '1300', label: 'พม. สวัสดิการ' },
  { color: 'text-blue-600', number: '1506', label: 'ประกันสังคม' },
  { color: 'text-red-500', number: '1669', label: 'ฉุกเฉิน UCEP' },
]

export function Hero() {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-16 text-center sm:px-6 md:py-24">

        {/* Headline */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl font-black leading-tight text-slate-900 md:text-6xl tracking-tight">
            ไม่พลาดทุกสิทธิ<br />
            <span className="text-emerald-600">การรักษาและสวัสดิการ</span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-500 max-w-2xl mx-auto font-medium">
            แก้ปัญหา <strong className="text-slate-700">Information Asymmetry</strong> รวบรวมสิทธิข้ามกระทรวง
            ทั้งบัตรทอง ประกันสังคม กองทุนสุขภาพตำบล และ พม.
            ประเมินสิทธิขอรับกายอุปกรณ์ฟรีด้วย AI
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
          <a
            href="/assessment"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-95"
          >
            <ShieldCheck className="size-5" />
            ประเมินสิทธิสุขภาพ
            <ArrowRight className="size-4" />
          </a>
          <a
            href="/scan"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500 bg-white px-6 py-4 text-base font-bold text-emerald-800 transition-all hover:bg-emerald-50 active:scale-95"
          >
            <Stethoscope className="size-5 text-emerald-600" />
            สแกนใบรับรองแพทย์
          </a>
        </div>

        {/* Hotlines */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 pt-2 border-t border-slate-100 w-full max-w-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-full text-center mb-1">สายด่วนสำคัญ</span>
          {HOTLINES.map((h, i) => (
            <span key={i} className={`flex items-center gap-1.5 font-semibold ${h.color}`}>
              <Phone className="size-3.5" />
              {h.label} <strong>{h.number}</strong>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
