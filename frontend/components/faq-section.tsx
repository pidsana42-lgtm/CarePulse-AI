const faqs = [
  {
    q: 'จะรู้ได้อย่างไรว่าตัวเองมีสิทธิรักษาพยาบาลแบบไหน?',
    a: 'ตรวจสอบได้ 3 ช่องทาง: โทรสายด่วน สปสช. 1330 กด 2, ผ่านแอปพลิเคชัน เป๋าตัง เมนูกระเป๋าสุขภาพ, หรือเว็บไซต์ สปสช. โดยใช้เลขบัตรประชาชน 13 หลัก คนไทยทุกคนจะมีสิทธิใดสิทธิหนึ่งเสมอ',
  },
  {
    q: 'เจ็บป่วยฉุกเฉิน เข้าโรงพยาบาลเอกชนใกล้บ้านได้ไหม?',
    a: 'ได้ หากเป็นภาวะฉุกเฉินวิกฤตถึงแก่ชีวิต (เช่น หมดสติ หัวใจหยุดเต้น เจ็บหน้าอกรุนแรง) ตามนโยบาย UCEP สามารถเข้าโรงพยาบาลที่ใกล้ที่สุดได้ทุกแห่ง โดยไม่เสียค่าใช้จ่ายใน 72 ชั่วโมงแรก โทร 1669 เพื่อเรียกรถพยาบาลฟรี',
  },
  {
    q: 'ลาออกจากงานแล้ว สิทธิประกันสังคมยังใช้ได้ไหม?',
    a: 'ใช้สิทธิรักษาพยาบาลต่อได้อีก 6 เดือนหลังออกจากงาน หลังจากนั้นหากไม่สมัครมาตรา 39 ภายใน 6 เดือน จะกลับไปใช้สิทธิบัตรทองโดยอัตโนมัติ',
  },
  {
    q: 'นโยบาย 30 บาทรักษาทุกที่ คืออะไร?',
    a: 'ผู้มีสิทธิบัตรทองสามารถใช้บัตรประชาชนใบเดียวเข้ารับบริการที่หน่วยบริการในระบบได้ทุกแห่งในจังหวัดที่เข้าร่วมโครงการ ไม่ต้องกลับไปโรงพยาบาลตามสิทธิ ครอบคลุมโรงพยาบาลรัฐ คลินิกเอกชน และร้านยาที่เข้าร่วม',
  },
  {
    q: 'ถ้าอยากย้ายโรงพยาบาลตามสิทธิ ทำอย่างไร?',
    a: 'สิทธิบัตรทอง: เปลี่ยนหน่วยบริการได้ 4 ครั้งต่อปี ผ่านแอปเป๋าตังหรือสายด่วน 1330 / สิทธิประกันสังคม: เปลี่ยนโรงพยาบาลได้ปีละ 1 ครั้ง ช่วงเดือนธันวาคม-มีนาคม ผ่านแอป SSO Plus หรือสำนักงานประกันสังคม',
  },
  {
    q: 'ค่ารักษาที่ประมาณการในเว็บนี้แม่นยำแค่ไหน?',
    a: 'เป็นการประมาณการจากช่วงอัตราค่ารักษาทั่วไปของโรงพยาบาลรัฐและเอกชน เพื่อช่วยวางแผนการเงินเบื้องต้นเท่านั้น ค่าใช้จ่ายจริงขึ้นกับอาการ ภาวะแทรกซ้อน และนโยบายของแต่ละโรงพยาบาล ควรสอบถามโรงพยาบาลโดยตรงก่อนตัดสินใจ',
  },
]

export function FaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 py-20 relative overflow-hidden"
    >
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 space-y-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            คำถามที่พบบ่อย
          </h2>
          <p className="max-w-xl text-pretty leading-relaxed text-slate-600 text-sm sm:text-base font-medium">
            รวมคำตอบเรื่องสิทธิรักษาพยาบาลและสวัสดิการที่คนไทยถามบ่อยที่สุด
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group liquid-glass-card rounded-[24px] p-5 sm:p-6 open:shadow-xl transition-all duration-300"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-slate-900 text-sm sm:text-base [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-black/4 text-slate-600 font-bold transition-transform duration-300 group-open:rotate-45 group-open:bg-cyan-600 group-open:text-white"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-600 font-medium pt-3 border-t border-black/4">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
