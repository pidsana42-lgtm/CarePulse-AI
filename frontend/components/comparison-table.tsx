import { Check, Minus, Sparkles } from 'lucide-react'

const rows: {
  feature: string
  ucs: string | boolean
  sso: string | boolean
  csmbs: string | boolean
}[] = [
  {
    feature: 'ค่ารักษาที่โรงพยาบาลตามสิทธิ',
    ucs: 'ฟรี',
    sso: 'ฟรี',
    csmbs: 'เบิกตามจริง',
  },
  {
    feature: 'เลือกโรงพยาบาลรัฐได้ทุกแห่ง',
    ucs: false,
    sso: false,
    csmbs: true,
  },
  {
    feature: 'ครอบคลุมครอบครัว (พ่อแม่ คู่สมรส บุตร)',
    ucs: false,
    sso: false,
    csmbs: true,
  },
  {
    feature: 'ค่าคลอดบุตร',
    ucs: 'ฟรีตามสิทธิ',
    sso: 'เหมาจ่าย 15,000 บาท',
    csmbs: 'เบิกตามจริง',
  },
  {
    feature: 'เงินทดแทนขาดรายได้เมื่อป่วย',
    ucs: false,
    sso: '50% ของค่าจ้าง',
    csmbs: 'ลาป่วยรับเงินเดือนปกติ',
  },
  {
    feature: 'ทันตกรรมพื้นฐาน',
    ucs: 'ฟรีตามสิทธิ',
    sso: '900 บาท/ปี',
    csmbs: 'เบิกตามอัตรากำหนด',
  },
  {
    feature: 'ยานอกบัญชียาหลัก',
    ucs: false,
    sso: false,
    csmbs: 'เบิกได้หากแพทย์รับรอง',
  },
  {
    feature: 'ฉุกเฉินวิกฤต 72 ชม. ทุกโรงพยาบาล (UCEP)',
    ucs: true,
    sso: true,
    csmbs: true,
  },
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="liquid-glass-pill size-7 inline-flex items-center justify-center text-emerald-600 bg-emerald-100/80 shadow-xs">
        <Check className="size-4" aria-hidden="true" />
        <span className="sr-only">ได้</span>
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-slate-300">
        <Minus className="size-5" aria-hidden="true" />
        <span className="sr-only">ไม่ได้</span>
      </span>
    )
  }
  return <span className="liquid-glass-pill px-3 py-1 text-xs font-black text-slate-900">{value}</span>
}

export function ComparisonTable() {
  return (
    <section id="compare" className="scroll-mt-20 py-20 relative overflow-hidden">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 space-y-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="liquid-glass-pill px-4 py-1 text-xs font-black text-emerald-900 inline-flex items-center gap-1.5 shadow-xs">
            <Sparkles className="size-3.5 text-emerald-600" />
            Core Welfare Comparison Matrix
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            เปรียบเทียบ 3 สิทธิหลักของคนไทย
          </h2>
          <p className="max-w-xl text-pretty leading-relaxed text-slate-600 text-sm sm:text-base font-medium">
            ภาพรวมความแตกต่างของสิทธิบัตรทอง ประกันสังคม และสวัสดิการข้าราชการ
          </p>
        </div>

        <div className="overflow-x-auto liquid-glass rounded-[36px] shadow-2xl border border-white/80 p-2 sm:p-4">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">
              ตารางเปรียบเทียบสิทธิรักษาพยาบาล บัตรทอง ประกันสังคม และข้าราชการ
            </caption>
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th scope="col" className="p-4 sm:p-5 text-sm font-black text-slate-900">
                  สิทธิประโยชน์
                </th>
                <th scope="col" className="p-4 sm:p-5 text-center text-sm font-black text-emerald-800">
                  บัตรทอง (สปสช.)
                </th>
                <th scope="col" className="p-4 sm:p-5 text-center text-sm font-black text-blue-800">
                  ประกันสังคม
                </th>
                <th scope="col" className="p-4 sm:p-5 text-center text-sm font-black text-slate-900">
                  ข้าราชการ (CSMBS)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-black/[0.03] transition-colors hover:bg-white/60 ${
                    i % 2 === 1 ? 'bg-white/30' : undefined
                  }`}
                >
                  <th
                    scope="row"
                    className="p-4 sm:p-5 text-xs sm:text-sm font-bold text-slate-800"
                  >
                    {row.feature}
                  </th>
                  <td className="p-4 sm:p-5 text-center">
                    <Cell value={row.ucs} />
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <Cell value={row.sso} />
                  </td>
                  <td className="p-4 sm:p-5 text-center">
                    <Cell value={row.csmbs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
