import {
  AssessmentInput,
  AssessmentResult,
  HealthcareRightDetail,
  MockRegistryResponse,
  OfficialReference,
} from '@/types';

const REVIEWED_AT = '29 ส.ค. 2569';

const REFERENCES = {
  nhsoCheck: {
    title: 'ระบบตรวจสอบสิทธิและลงทะเบียนภาคประชาชน',
    legal_act: 'ระบบตรวจสอบสิทธิหลักประกันสุขภาพด้วย ThaiD',
    agency: 'สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)',
    url: 'https://srmcitizen.nhso.go.th/',
    checked_at: REVIEWED_AT,
  },
  nhsoGuide: {
    title: 'คู่มือสิทธิหลักประกันสุขภาพแห่งชาติ ปี 2569',
    legal_act: 'คู่มือประชาชนสำหรับการใช้สิทธิบัตรทอง',
    agency: 'สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)',
    url: 'https://media.nhso.go.th/assets/portals/1/files/UC_69_final.pdf',
    checked_at: REVIEWED_AT,
  },
  ltc: {
    title: 'ระบบดูแลระยะยาวสำหรับผู้ที่มีภาวะพึ่งพิง',
    legal_act: 'ผลการดำเนินงานบริการดูแลระยะยาว ปีงบประมาณ 2566-2569',
    agency: 'สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)',
    url: 'https://media.nhso.go.th/ebook/flipbook/416/1/1',
    checked_at: REVIEWED_AT,
  },
  diaper: {
    title: 'สิทธิประโยชน์ผ้าอ้อมผู้ใหญ่และแผ่นรองซับ',
    legal_act: 'ข้อมูลบริการสร้างเสริมสุขภาพและป้องกันโรค',
    agency: 'สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)',
    url: 'https://media.nhso.go.th/view/1/Info_%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%AA%E0%B8%A3%E0%B8%B4%E0%B8%A1%E0%B8%AA%E0%B8%B8%E0%B8%82%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%9B%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%82%E0%B8%A3%E0%B8%84/TH-TH/?page=4',
    checked_at: REVIEWED_AT,
  },
  sso: {
    title: 'ระบบ e-Self Service สำหรับผู้ประกันตน',
    legal_act: 'ตรวจสถานะผู้ประกันตนและใบรับรองสิทธิ',
    agency: 'สำนักงานประกันสังคม (สปส.)',
    url: 'https://eself.sso.go.th/',
    checked_at: REVIEWED_AT,
  },
  csmbs: {
    title: 'ระบบตรวจสอบสิทธิสวัสดิการรักษาพยาบาล',
    legal_act: 'ข้อมูลสวัสดิการรักษาพยาบาลข้าราชการ',
    agency: 'กรมบัญชีกลาง',
    url: 'https://www.cgd.go.th/cs/internet/internet/%E0%B8%A3%E0%B8%B1%E0%B8%81%E0%B8%A9%E0%B8%B2%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5.html?page_locale=th_TH',
    checked_at: REVIEWED_AT,
  },
  disability: {
    title: 'พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ',
    legal_act: 'พ.ศ. 2550 และฉบับแก้ไขเพิ่มเติม',
    agency: 'กรมส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ (พก.)',
    url: 'https://dfund.dep.go.th/wp-content/uploads/2023/02/1.%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%9A%E0%B8%B1%E0%B8%8D%E0%B8%8D%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%AA%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%AA%E0%B8%A3%E0%B8%B4%E0%B8%A1%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%9E%E0%B8%B1%E0%B8%92%E0%B8%99%E0%B8%B2%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B8%8A%E0%B8%B5%E0%B8%A7%E0%B8%B4%E0%B8%95%E0%B8%84%E0%B8%99%E0%B8%9E%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3-%E0%B8%9E.%E0%B8%A8.-2550-%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B9%81%E0%B8%81%E0%B9%89%E0%B9%84%E0%B8%82%E0%B9%80%E0%B8%9E%E0%B8%B4%E0%B9%88%E0%B8%A1%E0%B9%80%E0%B8%95%E0%B8%B4%E0%B8%A1%E0%B8%89%E0%B8%9A%E0%B8%B1%E0%B8%9A%E0%B8%97%E0%B8%B5%E0%B9%88-2-%E0%B8%9E.%E0%B8%A8.-2556.pdf',
    checked_at: REVIEWED_AT,
  },
} satisfies Record<string, OfficialReference>;

const schemeLabels: Record<string, string> = {
  ucs: 'สิทธิบัตรทอง (สปสช.)',
  sso33: 'ประกันสังคม มาตรา 33',
  sso39: 'ประกันสังคม มาตรา 39',
  sso40: 'ประกันสังคม มาตรา 40',
  csmbs: 'สวัสดิการรักษาพยาบาลข้าราชการ',
  unknown: 'ยังไม่ทราบสิทธิหลัก',
};

const dailyLivingLabels: Record<string, string> = {
  independent: 'ช่วยเหลือตัวเองได้',
  partial: 'ต้องมีผู้ช่วยบางกิจกรรม',
  dependent: 'ต้องมีผู้ดูแลเป็นส่วนใหญ่',
  bedridden: 'ติดบ้าน/ติดเตียง',
};

function schemeFromRegistry(registryResponse?: MockRegistryResponse): AssessmentInput['current_health_scheme'] {
  switch (registryResponse?.entitlement.scheme_code) {
    case 'UCS':
      return 'ucs';
    case 'SSO33':
      return 'sso33';
    case 'SSO39':
      return 'sso39';
    case 'CSMBS':
      return 'csmbs';
    default:
      return 'unknown';
  }
}

function baseRight(overrides: Partial<HealthcareRightDetail>): HealthcareRightDetail {
  return {
    scheme_code: 'UNKNOWN',
    scheme_name: 'ตรวจสอบสิทธิหลักก่อน',
    is_eligible: false,
    eligibility_status: 'needs_review',
    coverage_summary: 'ข้อมูลที่กรอกยังไม่เพียงพอสำหรับจับคู่สิทธิ ระบบจะแนะนำช่องทางตรวจสอบกับหน่วยงานเจ้าของสิทธิ',
    free_items: [],
    co_pay_items: [],
    how_to_use: 'ยืนยันสิทธิกับหน่วยงานเจ้าของสิทธิก่อนเข้ารับบริการ',
    hospital_network: 'ขึ้นอยู่กับสิทธิที่หน่วยงานยืนยัน',
    matching_reasons: [],
    missing_information: [],
    required_documents: [],
    application_steps: [],
    last_reviewed: REVIEWED_AT,
    ...overrides,
  };
}

function getPrimaryRight(input: AssessmentInput): HealthcareRightDetail {
  switch (input.current_health_scheme) {
    case 'ucs':
      return baseRight({
        scheme_code: 'UCS',
        scheme_name: 'สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง)',
        is_eligible: true,
        eligibility_status: 'likely',
        responsible_agency: 'สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.)',
        contact_channel: 'สายด่วน 1330',
        coverage_summary: 'ข้อมูลที่ผู้ใช้ระบุสอดคล้องกับสิทธิบัตรทอง แต่ระบบสาธิตนี้ยังไม่ได้เชื่อมทะเบียนภาครัฐ จึงต้องยืนยันสิทธิและหน่วยบริการประจำอีกครั้ง',
        free_items: ['บริการตามชุดสิทธิประโยชน์และข้อบ่งชี้ทางการแพทย์', 'ตรวจสอบหน่วยบริการประจำและช่องทางใช้สิทธิได้จากระบบ สปสช.'],
        co_pay_items: ['บริการนอกเงื่อนไขหรือสถานพยาบาลนอกระบบอาจมีค่าใช้จ่าย'],
        matching_reasons: ['ผู้ใช้ระบุว่าสิทธิหลักปัจจุบันคือบัตรทอง'],
        required_documents: ['บัตรประชาชน', 'เอกสารส่งตัวหรือเอกสารทางการแพทย์ หากหน่วยบริการร้องขอ'],
        application_steps: ['ตรวจสอบสิทธิและหน่วยบริการประจำผ่านระบบ สปสช. หรือสายด่วน 1330', 'ติดต่อหน่วยบริการประจำเพื่อประเมินบริการที่เหมาะสม'],
        official_references: [REFERENCES.nhsoGuide, REFERENCES.nhsoCheck],
        how_to_use: 'ยืนยันสิทธิและหน่วยบริการประจำก่อนใช้บริการ',
        hospital_network: 'หน่วยบริการในระบบหลักประกันสุขภาพแห่งชาติ',
      });
    case 'sso33':
    case 'sso39':
      return baseRight({
        scheme_code: input.current_health_scheme.toUpperCase(),
        scheme_name: schemeLabels[input.current_health_scheme],
        is_eligible: true,
        eligibility_status: 'likely',
        responsible_agency: 'สำนักงานประกันสังคม (สปส.)',
        contact_channel: 'สายด่วน 1506',
        coverage_summary: 'ข้อมูลที่ผู้ใช้ระบุสอดคล้องกับสถานะผู้ประกันตน แต่ต้องตรวจสถานะการส่งเงินสมทบและสถานพยาบาลตามสิทธิในระบบของประกันสังคม',
        matching_reasons: [`ผู้ใช้ระบุว่าเป็นผู้ประกันตน${input.current_health_scheme === 'sso33' ? 'มาตรา 33' : 'มาตรา 39'}`],
        missing_information: ['สถานะการส่งเงินสมทบล่าสุด', 'สถานพยาบาลตามสิทธิ'],
        required_documents: ['บัตรประชาชน', 'ข้อมูลผู้ประกันตนจาก e-Self Service'],
        application_steps: ['เข้าสู่ระบบ e-Self Service เพื่อตรวจสถานะและสถานพยาบาล', 'หากข้อมูลไม่ตรง ติดต่อสายด่วน 1506'],
        official_references: [REFERENCES.sso],
        how_to_use: 'ตรวจสถานะและสถานพยาบาลตามสิทธิก่อนเข้ารับบริการ',
        hospital_network: 'สถานพยาบาลที่ลงทะเบียนไว้กับประกันสังคม',
      });
    case 'csmbs':
      return baseRight({
        scheme_code: 'CSMBS',
        scheme_name: schemeLabels.csmbs,
        is_eligible: true,
        eligibility_status: 'likely',
        responsible_agency: 'กรมบัญชีกลาง',
        contact_channel: 'Call Center 0-2270-6400',
        coverage_summary: 'ข้อมูลที่ผู้ใช้ระบุสอดคล้องกับสวัสดิการรักษาพยาบาลข้าราชการ แต่ต้องยืนยันสถานะผู้มีสิทธิกับระบบกรมบัญชีกลางก่อนใช้เบิกจ่ายจริง',
        matching_reasons: ['ผู้ใช้มีสถานะเป็นผู้มีสิทธิสวัสดิการรักษาพยาบาลข้าราชการ'],
        missing_information: ['สถานะผู้มีสิทธิในฐานกรมบัญชีกลาง'],
        required_documents: ['บัตรประชาชน'],
        application_steps: ['ตรวจสอบสิทธิกับระบบกรมบัญชีกลางหรือสถานพยาบาล', 'สอบถามรายการที่เบิกได้ก่อนรับบริการที่มีค่าใช้จ่ายสูง'],
        official_references: [REFERENCES.csmbs],
        how_to_use: 'ยืนยันสิทธิเบิกจ่ายตรงกับสถานพยาบาลก่อนรับบริการ',
        hospital_network: 'สถานพยาบาลที่รองรับระบบเบิกจ่ายตรง',
      });
    case 'sso40':
      return baseRight({
        scheme_code: 'SSO40',
        scheme_name: 'ต้องตรวจสอบสิทธิรักษาหลักแยกจากสถานะ ม.40',
        responsible_agency: 'สำนักงานประกันสังคม / สปสช.',
        contact_channel: '1506 หรือ 1330',
        coverage_summary: 'สถานะผู้ประกันตนมาตรา 40 เพียงอย่างเดียวยังไม่พอสำหรับยืนยันสิทธิรักษาหลัก ระบบจึงแนะนำให้ตรวจทั้งประกันสังคมและ สปสช.',
        matching_reasons: ['ผู้ใช้ระบุว่าเป็นผู้ประกันตนมาตรา 40'],
        missing_information: ['สิทธิรักษาพยาบาลหลักที่ปรากฏในทะเบียนภาครัฐ'],
        required_documents: ['บัตรประชาชน'],
        application_steps: ['ตรวจสถานะผู้ประกันตนใน e-Self Service', 'ตรวจสิทธิรักษาหลักในระบบ สปสช.'],
        official_references: [REFERENCES.sso, REFERENCES.nhsoCheck],
        how_to_use: 'ตรวจสอบสิทธิจริงก่อนเลือกสถานพยาบาล',
      });
    default:
      return baseRight({
        official_references: [REFERENCES.nhsoCheck, REFERENCES.sso, REFERENCES.csmbs],
        missing_information: ['สิทธิรักษาพยาบาลหลักจากทะเบียนภาครัฐ'],
        required_documents: ['บัตรประชาชน'],
        application_steps: ['ตรวจสอบผ่านระบบ สปสช.', 'หากเคยเป็นผู้ประกันตน ให้ตรวจใน e-Self Service เพิ่มเติม'],
        contact_channel: '1330 / 1506',
      });
  }
}

function getAdditionalRights(input: AssessmentInput): HealthcareRightDetail[] {
  const rights: HealthcareRightDetail[] = [];
  const dailyLiving = input.daily_living ?? 'independent';
  const needsCare = dailyLiving === 'dependent' || dailyLiving === 'bedridden';
  const mayNeedCare = dailyLiving === 'partial';

  if (input.age >= 60 && (needsCare || mayNeedCare)) {
    rights.push(baseRight({
      scheme_code: 'LTC',
      scheme_name: 'บริการดูแลระยะยาวสำหรับผู้ที่มีภาวะพึ่งพิง',
      is_eligible: needsCare,
      eligibility_status: needsCare ? 'likely' : 'needs_review',
      responsible_agency: 'สปสช. ร่วมกับหน่วยบริการและองค์กรปกครองส่วนท้องถิ่น',
      contact_channel: 'รพ.สต./ศูนย์บริการสาธารณสุข หรือ 1330',
      coverage_summary: 'บริการดูแลในชุมชนต้องผ่านการประเมินภาวะพึ่งพิงและจัดทำแผนดูแลรายบุคคลโดยทีมในพื้นที่ ไม่ได้อนุมัติจากอายุเพียงอย่างเดียว',
      matching_reasons: [`อายุ ${input.age} ปี`, `ผู้ใช้ระบุว่า “${dailyLivingLabels[dailyLiving]}”`],
      missing_information: ['คะแนนประเมินความสามารถในการทำกิจวัตรประจำวัน', 'ผลประเมินและแผนดูแลจากหน่วยบริการในพื้นที่'],
      required_documents: ['บัตรประชาชน', 'ข้อมูลสิทธิรักษาพยาบาล', 'ผลประเมินความสามารถในการทำกิจวัตรประจำวันหรือเอกสารทางการแพทย์ที่เกี่ยวข้อง'],
      application_steps: ['ติดต่อ รพ.สต. ศูนย์บริการสาธารณสุข หรือหน่วยบริการใกล้บ้าน', 'ขอรับการประเมินความสามารถในการทำกิจวัตรประจำวันและความจำเป็นในการดูแล', 'ให้ทีมพื้นที่จัดทำและพิจารณาแผนดูแลรายบุคคล'],
      official_references: [REFERENCES.ltc],
      how_to_use: 'เริ่มจากหน่วยบริการปฐมภูมิหรือองค์กรปกครองส่วนท้องถิ่นในพื้นที่',
      hospital_network: `หน่วยบริการและท้องถิ่นในจังหวัด${input.registered_province}`,
    }));
  }

  if (input.has_incontinence || input.needs_equipment?.includes('adult_diaper')) {
    const diaperLikely = input.current_health_scheme === 'ucs' && (input.has_incontinence || needsCare);
    rights.push(baseRight({
      scheme_code: 'UCS-DIAPER',
      scheme_name: 'ผ้าอ้อมผู้ใหญ่และแผ่นรองซับสำหรับผู้มีภาวะพึ่งพิง',
      is_eligible: diaperLikely,
      eligibility_status: diaperLikely ? 'likely' : 'needs_review',
      responsible_agency: 'สำนักงานหลักประกันสุขภาพแห่งชาติ (สปสช.) และกองทุนท้องถิ่น',
      contact_channel: 'รพ.สต./ศูนย์บริการสาธารณสุข หรือ 1330',
      coverage_summary: 'สิทธิประโยชน์นี้มีเงื่อนไขด้านสิทธิรักษา ภาวะพึ่งพิงหรือปัญหาการกลั้นขับถ่าย และกระบวนการประเมินในพื้นที่ จึงต้องให้หน่วยบริการยืนยันก่อนรับอุปกรณ์',
      eligible_equipment: ['ผ้าอ้อมผู้ใหญ่', 'แผ่นรองซับการขับถ่าย'],
      matching_reasons: [input.has_incontinence ? 'ผู้ใช้ระบุว่ามีปัญหาการกลั้นขับถ่าย' : 'ผู้ใช้เลือกว่าต้องการผ้าอ้อมผู้ใหญ่', needsCare ? 'มีข้อมูลภาวะพึ่งพิง' : 'ยังต้องประเมินภาวะพึ่งพิง'],
      missing_information: ['ผลประเมินจากบุคลากรสาธารณสุข', ...(input.current_health_scheme === 'ucs' ? [] : ['การยืนยันว่าเข้าเงื่อนไขสิทธิที่หน่วยงานกำหนด'])],
      required_documents: ['บัตรประชาชน', 'ข้อมูลสิทธิรักษา', 'ผลประเมินภาวะพึ่งพิงหรือปัญหาการขับถ่าย'],
      application_steps: ['ติดต่อหน่วยบริการปฐมภูมิหรือกองทุนท้องถิ่นในพื้นที่', 'รับการประเมินตามเกณฑ์', 'รอหน่วยงานยืนยันจำนวนและรอบการจัดสรร'],
      official_references: [REFERENCES.diaper, REFERENCES.nhsoGuide],
      how_to_use: 'ยื่นผ่านหน่วยบริการหรือกลไกกองทุนท้องถิ่นในพื้นที่',
      hospital_network: `หน่วยบริการปฐมภูมิ/กองทุนท้องถิ่นในจังหวัด${input.registered_province}`,
    }));
  }

  if (input.has_disability_card || input.has_mobility_limitation || input.needs_equipment?.includes('wheelchair')) {
    const disabilityLikely = Boolean(input.has_disability_card && input.has_mobility_limitation);
    rights.push(baseRight({
      scheme_code: 'DISABILITY-AID',
      scheme_name: 'อุปกรณ์หรือเครื่องช่วยความพิการตามความจำเป็น',
      is_eligible: disabilityLikely,
      eligibility_status: disabilityLikely ? 'likely' : 'needs_review',
      responsible_agency: 'หน่วยบริการตามสิทธิ และกรมส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ',
      contact_channel: 'พม. 1300 / หน่วยบริการตามสิทธิ',
      coverage_summary: 'การได้รับอุปกรณ์ขึ้นกับประเภทความพิการ ความจำเป็นทางการแพทย์ รายการที่สิทธิหลักรองรับ และการประเมินของหน่วยบริการ ไม่สามารถยืนยันจากการเลือก “รถเข็น” เพียงอย่างเดียว',
      eligible_equipment: input.needs_equipment?.includes('wheelchair') ? ['รถเข็นสำหรับผู้มีข้อจำกัดด้านการเคลื่อนไหว (ต้องประเมินรุ่นและความเหมาะสม)'] : ['อุปกรณ์เครื่องช่วยตามประเภทความพิการและผลประเมิน'],
      matching_reasons: [input.has_disability_card ? 'ผู้ใช้ระบุว่ามีบัตรประจำตัวคนพิการ' : 'ยังไม่มีข้อมูลบัตรประจำตัวคนพิการ', input.has_mobility_limitation ? 'มีข้อจำกัดด้านการเคลื่อนไหว' : 'ยังต้องระบุข้อจำกัดการใช้งาน'],
      missing_information: [...(input.has_disability_card ? [] : ['สถานะบัตรประจำตัวคนพิการ']), 'ใบประเมินหรือใบสั่งอุปกรณ์จากบุคลากรทางการแพทย์'],
      required_documents: ['บัตรประชาชน', 'บัตรประจำตัวคนพิการ (ถ้ามี)', 'ใบรับรอง/ใบสั่งอุปกรณ์จากแพทย์หรือผู้เชี่ยวชาญ'],
      application_steps: ['ติดต่อหน่วยบริการตามสิทธิเพื่อประเมินความจำเป็น', 'ตรวจรายการอุปกรณ์ที่สิทธิหลักรองรับ', 'หากต้องการความช่วยเหลือเพิ่มเติม ติดต่อศูนย์บริการคนพิการหรือสายด่วน 1300'],
      official_references: [REFERENCES.disability],
      how_to_use: 'เริ่มจากหน่วยบริการตามสิทธิ เพื่อให้ผู้เชี่ยวชาญประเมินอุปกรณ์ที่เหมาะสม',
      hospital_network: 'หน่วยบริการตามสิทธิและศูนย์บริการคนพิการในจังหวัด',
    }));
  }

  return rights;
}

export function assessMockEligibility(
  input: AssessmentInput,
  registryResponse?: MockRegistryResponse,
): AssessmentResult {
  const resolvedInput: AssessmentInput = {
    ...input,
    current_health_scheme: registryResponse
      ? schemeFromRegistry(registryResponse)
      : input.current_health_scheme,
  };
  const primaryRight = getPrimaryRight(resolvedInput);
  const additionalRights = getAdditionalRights(resolvedInput);
  const allReferences = [
    ...(primaryRight.official_references ?? []),
    ...additionalRights.flatMap((right) => right.official_references ?? []),
  ].filter((reference, index, array) => array.findIndex((item) => item.url === reference.url) === index);

  return {
    assessment_id: `CP-DEMO-${Date.now().toString().slice(-8)}`,
    assessed_at: new Date().toISOString(),
    data_mode: 'demo',
    disclaimer: 'ผลนี้มาจากระบบเชื่อมต่อข้อมูลสาธิตของ CarePulse ซึ่งยังไม่ได้เชื่อมทะเบียนภาครัฐจริง จึงไม่ใช่การยืนยันสิทธิหรือคำวินิจฉัยทางการแพทย์',
    patient_summary: {
      citizen_id_masked: registryResponse?.person.citizen_id_masked ?? 'ไม่เก็บเลขบัตรในโหมดสาธิต',
      age: resolvedInput.age,
      occupation_status: resolvedInput.occupation_status,
      registered_province: resolvedInput.registered_province,
      urgency_level: resolvedInput.urgency_level,
      chronic_conditions: resolvedInput.chronic_conditions,
      current_health_scheme: registryResponse?.entitlement.scheme_name
        ?? schemeLabels[resolvedInput.current_health_scheme ?? 'unknown'],
      daily_living: dailyLivingLabels[resolvedInput.daily_living ?? 'independent'],
      has_disability_card: resolvedInput.has_disability_card,
      has_mobility_limitation: resolvedInput.has_mobility_limitation,
      has_incontinence: resolvedInput.has_incontinence,
      needs_equipment: resolvedInput.needs_equipment,
    },
    primary_right: primaryRight,
    additional_rights: additionalRights,
    registry_response: registryResponse,
    all_official_references: allReferences,
    recommendations: [
      'ใช้ลิงก์หน่วยงานทางการในแต่ละการ์ดเพื่อยืนยันสิทธิจริงก่อนรับบริการ',
      'เตรียมบัตรประชาชนและเอกสารทางการแพทย์ที่เกี่ยวข้องเมื่อไปติดต่อหน่วยบริการ',
      'หากข้อมูลสิทธิในระบบรัฐไม่ตรง ให้ติดต่อสายด่วนของหน่วยงานเจ้าของสิทธิ',
    ],
    pdpa_protected: true,
  };
}
