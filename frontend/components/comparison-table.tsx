import { Check, Minus } from 'lucide-react'

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
      <span className="inline-flex items-center justify-center">
        <Check className="size-5 text-primary" aria-hidden="true" />
        <span className="sr-only">ได้</span>
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <Minus className="size-5 text-muted-foreground/50" aria-hidden="true" />
        <span className="sr-only">ไม่ได้</span>
      </span>
    )
  }
  return <span className="text-sm text-foreground">{value}</span>
}

export function ComparisonTable() {
  return (
    <section id="compare" className="scroll-mt-20 py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground">
            เปรียบเทียบ 3 สิทธิหลักของคนไทย
          </h2>
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            ภาพรวมความแตกต่างของสิทธิบัตรทอง ประกันสังคม และสวัสดิการข้าราชการ
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">
              ตารางเปรียบเทียบสิทธิรักษาพยาบาล บัตรทอง ประกันสังคม และข้าราชการ
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted">
                <th scope="col" className="p-4 text-sm font-semibold text-foreground">
                  สิทธิประโยชน์
                </th>
                <th scope="col" className="p-4 text-center text-sm font-semibold text-foreground">
                  บัตรทอง
                </th>
                <th scope="col" className="p-4 text-center text-sm font-semibold text-foreground">
                  ประกันสังคม
                </th>
                <th scope="col" className="p-4 text-center text-sm font-semibold text-foreground">
                  ข้าราชการ
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i % 2 === 1 ? 'bg-muted/50' : undefined}
                >
                  <th
                    scope="row"
                    className="p-4 text-sm font-medium leading-relaxed text-foreground"
                  >
                    {row.feature}
                  </th>
                  <td className="p-4 text-center">
                    <Cell value={row.ucs} />
                  </td>
                  <td className="p-4 text-center">
                    <Cell value={row.sso} />
                  </td>
                  <td className="p-4 text-center">
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
