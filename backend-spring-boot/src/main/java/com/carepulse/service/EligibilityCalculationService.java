package com.carepulse.service;

import com.carepulse.model.*;
import com.carepulse.repository.AssessmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class EligibilityCalculationService {

    private static final Logger log = LoggerFactory.getLogger(EligibilityCalculationService.class);
    private final AssessmentRepository assessmentRepository;
    private final PDPAMaskingService pdpaMaskingService;

    public EligibilityCalculationService(AssessmentRepository assessmentRepository, PDPAMaskingService pdpaMaskingService) {
        this.assessmentRepository = assessmentRepository;
        this.pdpaMaskingService = pdpaMaskingService;
    }

    public AssessmentResponse evaluateRights(AssessmentRequest request) {
        String assessmentId = "EVAL-SB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        HealthcareRight primaryRight;
        List<HealthcareRight> additionalRights = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        // 1. Primary Healthcare Scheme Logic
        String occupation = request.getOccupationStatus() != null ? request.getOccupationStatus().toLowerCase() : "freelance";

        if ("gov_employee".equals(occupation)) {
            primaryRight = HealthcareRight.builder()
                    .schemeCode("CSMBS")
                    .schemeName("สิทธิสวัสดิการรักษาพยาบาลข้าราชการ")
                    .isEligible(true)
                    .coverageSummary("ครอบคลุมการรักษาพยาบาล ค่ายา ค่าห้อง ค่าผ่าตัด ในสถานพยาบาลของรัฐเต็มจำนวน")
                    .freeItems(List.of("ตรวจรักษาโรคทั่วไปและโรคเฉพาะทาง", "ยารักษาโรคในบัญชีและนอกบัญชียาหลัก (ตามเกณฑ์)", "ค่าห้องผู้ป่วยสามัญ"))
                    .coPayItems(List.of("ค่าห้องพิเศษส่วนเกิน", "ยานอกบัญชียาหลักที่ไม่มีข้อบ่งชี้ทางการแพทย์"))
                    .howToUse("ใช้บัตรประจำตัวประชาชนตรวจสอบสิทธิเบิกจ่ายตรง ณ โรงพยาบาลของรัฐ")
                    .hospitalNetwork("โรงพยาบาลรัฐทุกแห่งทั่วประเทศ")
                    .build();
            recommendations.add("ลงทะเบียนจ่ายตรง ณ สถานพยาบาลที่ท่านเข้ารับการรักษาเป็นประจำ");
        } else if ("private_employee".equals(occupation) || "sso".equals(occupation)) {
            primaryRight = HealthcareRight.builder()
                    .schemeCode("SSO")
                    .schemeName("สิทธิประกันสังคม (กองทุนประกันสังคม)")
                    .isEligible(true)
                    .coverageSummary("ครอบคลุมการรักษาพยาบาล ณ โรงพยาบาลคู่สัญญาตามสิทธิ และสิทธิประโยชน์กรณีอื่นๆ")
                    .freeItems(List.of("ตรวจรักษาและค่ายาทุกโรค ณ รพ. ตามสิทธิ", "ทันตกรรม 900 บาท/ปี โดยไม่ต้องสำรองจ่าย", "สิทธิคลอดบุตรและเงินสงเคราะห์"))
                    .coPayItems(List.of("การรักษานอกโรงพยาบาลตามสิทธิ (ยกเว้นฉุกเฉิน)", "ทันตกรรมส่วนเกิน 900 บาท"))
                    .howToUse("ยื่นบัตรประชาชน ณ แผนกเวชระเบียน โรงพยาบาลตามสิทธิประกันสังคม")
                    .hospitalNetwork("โรงพยาบาลตามบัตรรับรองสิทธิประกันสังคม")
                    .build();
            recommendations.add("ใช้สิทธิทันตกรรมฟรี 900 บาท/ปี ภายในวันที่ 31 ธันวาคมของทุกปี");
        } else {
            // General Citizen / UC
            primaryRight = HealthcareRight.builder()
                    .schemeCode("UC")
                    .schemeName("สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง 30 บาทรักษาทุกที่)")
                    .isEligible(true)
                    .coverageSummary("ครอบคลุมการรักษาพยาบาล ค่ายา การผ่าตัด และการดูแลส่งเสริมสุขภาพฟรี")
                    .freeItems(List.of("ตรวจรักษาโรคทั่วไป และโรคเรื้อรัง", "ยาในบัญชียาหลักแห่งชาติ", "บริการส่งเสริมสุขภาพและป้องกันโรค", "รับยาใกล้บ้านที่ร้านยาคุณภาพ"))
                    .coPayItems(List.of("ยานอกบัญชียาหลักที่ไม่มีข้อบ่งชี้", "ค่าห้องพิเศษ"))
                    .howToUse("ใช้บัตรประชาชนใบเดียว เข้ารับบริการที่หน่วยบริการปฐมภูมิหรือโรงพยาบาลตามสิทธิ")
                    .hospitalNetwork("หน่วยบริการปฐมภูมิ คลินิกชุมชนอบอุ่น และ รพ. ประจำเขต")
                    .build();
            recommendations.add("ท่านสามารถใช้บริการ 30 บาทรักษาทุกที่ ได้ที่หน่วยบริการปฐมภูมิหรือคลินิกชุมชนอบอุ่น");
        }

        // 2. Elderly Special Benefit Check (Age >= 60)
        if (request.getAge() >= 60) {
            additionalRights.add(HealthcareRight.builder()
                    .schemeCode("ELDERLY_CARE")
                    .schemeName("สิทธิประโยชน์สำหรับผู้สูงอายุ (60 ปีขึ้นไป)")
                    .isEligible(true)
                    .coverageSummary("บริการช่องทางด่วน คลินิกผู้สูงอายุ ผ้าอ้อมผู้ใหญ่ และวัคซีนประจำปีฟรี")
                    .freeItems(List.of("ผ้าอ้อมผู้ใหญ่และแผ่นรองซับ (ตามเกณฑ์ ADL)", "ตรวจคัดกรองภาวะสมองเสื่อมและสายตา", "วัคซีนไข้หวัดใหญ่ฟรีทุกปี"))
                    .coPayItems(Collections.emptyList())
                    .howToUse("ติดต่อแผนกผู้สูงอายุ หรือ รพ.สต. ใกล้บ้าน")
                    .hospitalNetwork("สถานพยาบาลของรัฐทุกระดับ")
                    .build());
            recommendations.add("ผู้สูงอายุ 60 ปีขึ้นไป สามารถรับการฉีดวัคซีนไข้หวัดใหญ่ฟรีประจำปี");
        }

        // 3. Disability Benefit Check
        if (request.isHasDisabilityCard()) {
            additionalRights.add(HealthcareRight.builder()
                    .schemeCode("DISABILITY_CARE")
                    .schemeName("สิทธิคนพิการ (ท.74 / ฟื้นฟูสมรรถภาพ)")
                    .isEligible(true)
                    .coverageSummary("รับการฟื้นฟูสมรรถภาพและกายอุปกรณ์ฟรีตลอดชีพ")
                    .freeItems(List.of("กายอุปกรณ์ เช่น รถเข็น ไม้เท้า ขาเทียม", "กายภาพบำบัดและกิจกรรมบำบัด"))
                    .coPayItems(Collections.emptyList())
                    .howToUse("แสดงสมุดประจำตัวคนพิการคู่กับบัตรประชาชน")
                    .hospitalNetwork("สถานพยาบาลของรัฐทุกแห่ง")
                    .build());
        }

        // 4. Emergency Alert
        if ("emergency".equalsIgnoreCase(request.getUrgencyLevel())) {
            recommendations.add(0, "🚨 เจ็บป่วยฉุกเฉินวิกฤต ใช้สิทธิ UCEP เข้ารักษา รพ. ใดก็ได้ ฟรี 72 ชั่วโมงแรก โทร 1669");
        }

        // Prepare Masked Patient Summary for PDPA compliance
        Map<String, Object> patientSummary = new HashMap<>();
        patientSummary.put("citizen_id_masked", pdpaMaskingService.maskCitizenId(request.getCitizenId()));
        patientSummary.put("age", request.getAge());
        patientSummary.put("occupation_status", request.getOccupationStatus());
        patientSummary.put("registered_province", request.getRegisteredProvince() != null ? request.getRegisteredProvince() : "กรุงเทพมหานคร");
        patientSummary.put("urgency_level", request.getUrgencyLevel() != null ? request.getUrgencyLevel() : "normal");

        AssessmentResponse response = AssessmentResponse.builder()
                .assessmentId(assessmentId)
                .assessedAt(LocalDateTime.now())
                .patientSummary(patientSummary)
                .primaryRight(primaryRight)
                .additionalRights(additionalRights)
                .recommendations(recommendations)
                .pdpaProtected(true)
                .build();

        // Asynchronously persist masked record to MongoDB
        try {
            AssessmentRecord record = AssessmentRecord.builder()
                    .assessmentId(assessmentId)
                    .createdAt(LocalDateTime.now())
                    .maskedPatientData(patientSummary)
                    .primaryRight(primaryRight)
                    .additionalRights(additionalRights)
                    .recommendations(recommendations)
                    .pdpaMasked(true)
                    .build();
            assessmentRepository.save(record);
            log.info("Assessment record {} saved securely in MongoDB.", assessmentId);
        } catch (Exception e) {
            log.warn("Failed to persist assessment to MongoDB (operating gracefully): {}", e.getMessage());
        }

        return response;
    }
}
