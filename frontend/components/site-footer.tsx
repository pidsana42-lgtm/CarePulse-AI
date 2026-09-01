import { HeartPulse } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-8">
        <div className="flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <a href="/assessment" className="flex items-center gap-2 text-[#1d1d1f]">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#072b77] text-white"><HeartPulse className="size-4" /></span>
            <span className="text-sm font-semibold">CarePulse AI</span>
          </a>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#424245]">
            <a href="/assessment" className="hover:underline">ตรวจสิทธิ</a>
            <a href="/search" className="hover:underline">ถาม AI</a>
          </nav>
        </div>
        <div className="text-sm text-[#424245]">สายด่วน: สปสช. 1330 · ประกันสังคม 1506 · ฉุกเฉิน 1669</div>
      </div>
    </footer>
  );
}

// import { HeartPulse } from 'lucide-react'

// export function SiteFooter() {
//   return (
//     <footer className="border-t border-border bg-card">
//       <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
//         <div className="flex max-w-sm flex-col gap-3">
//           <div className="flex items-center gap-2">
//             <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
//               <HeartPulse
//                 className="size-4 text-primary-foreground"
//                 aria-hidden="true"
//               />
//             </span>
//             <span className="font-bold text-foreground">สิทธิ์ดี</span>
//           </div>
//           <p className="text-sm leading-relaxed text-muted-foreground">
//             เครื่องมือช่วยคนไทยตรวจสอบสิทธิรักษาพยาบาลและประมาณค่าใช้จ่าย
//             เพื่อวางแผนการเงินด้านสุขภาพอย่างมั่นใจ
//             ข้อมูลนี้เป็นการประมาณการเบื้องต้น ไม่ใช่คำแนะนำทางการแพทย์หรือการเงิน
//           </p>
//         </div>
//         <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
//           <div className="flex flex-col gap-2">
//             <h3 className="text-sm font-semibold text-foreground">
//               สายด่วนสำคัญ
//             </h3>
//             <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
//               <li>สปสช. (บัตรทอง) 1330</li>
//               <li>ประกันสังคม 1506</li>
//               <li>เจ็บป่วยฉุกเฉิน 1669</li>
//               <li>กรมบัญชีกลาง 02-270-6400</li>
//             </ul>
//           </div>
//           <div className="flex flex-col gap-2">
//             <h3 className="text-sm font-semibold text-foreground">เมนู</h3>
//             <ul className="flex flex-col gap-1.5 text-sm">
//               <li>
//                 <a
//                   href="#check-rights"
//                   className="text-muted-foreground transition-colors hover:text-foreground"
//                 >
//                   ตรวจสอบสิทธิ
//                 </a>
//               </li>
//               <li>
//                 <a
//                   href="#estimator"
//                   className="text-muted-foreground transition-colors hover:text-foreground"
//                 >
//                   ประมาณค่ารักษา
//                 </a>
//               </li>
//               <li>
//                 <a
//                   href="#compare"
//                   className="text-muted-foreground transition-colors hover:text-foreground"
//                 >
//                   เปรียบเทียบสิทธิ
//                 </a>
//               </li>
//               <li>
//                 <a
//                   href="#faq"
//                   className="text-muted-foreground transition-colors hover:text-foreground"
//                 >
//                   คำถามที่พบบ่อย
//                 </a>
//               </li>
//             </ul>
//           </div>
//         </div>
//       </div>
//       <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
//         สิทธิ์ดี — สร้างเพื่อคนไทยทุกคน | ข้อมูลอ้างอิงจาก สปสช. สปส. และกรมบัญชีกลาง
//       </div>
//     </footer>
//   )
// }
