package com.carepulse.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResponse {
    private String assessmentId;
    private LocalDateTime assessedAt;
    private Map<String, Object> patientSummary;
    private HealthcareRight primaryRight;
    private List<HealthcareRight> additionalRights;
    private List<String> recommendations;
    private boolean pdpaProtected;
}
