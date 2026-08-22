package com.carepulse.controller;

import com.carepulse.model.AssessmentRequest;
import com.carepulse.model.AssessmentResponse;
import com.carepulse.service.EligibilityCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/eligibility")
@RequiredArgsConstructor
public class EligibilityController {

    private final EligibilityCalculationService eligibilityCalculationService;

    @PostMapping("/assess")
    public ResponseEntity<AssessmentResponse> assessRights(@RequestBody AssessmentRequest request) {
        AssessmentResponse response = eligibilityCalculationService.evaluateRights(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/schemes")
    public ResponseEntity<List<Map<String, String>>> getSupportedSchemes() {
        List<Map<String, String>> schemes = List.of(
            Map.of("code", "UC", "name", "สิทธิหลักประกันสุขภาพแห่งชาติ (บัตรทอง 30 บาท)"),
            Map.of("code", "SSO", "name", "สิทธิประกันสังคม (มาตรา 33, 39, 40)"),
            Map.of("code", "CSMBS", "name", "สิทธิสวัสดิการรักษาพยาบาลข้าราชการ"),
            Map.of("code", "ELDERLY_CARE", "name", "สิทธิประโยชน์ผู้สูงอายุ 60 ปีขึ้นไป"),
            Map.of("code", "DISABILITY_CARE", "name", "สิทธิการฟื้นฟูสมรรถภาพคนพิการ"),
            Map.of("code", "UCEP", "name", "สิทธิการรักษาพยาบาลฉุกเฉินวิกฤต (UCEP)")
        );
        return ResponseEntity.ok(schemes);
    }
}
