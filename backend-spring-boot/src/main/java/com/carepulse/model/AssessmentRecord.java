package com.carepulse.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "assessments")
public class AssessmentRecord {
    @Id
    private String id;
    private String assessmentId;
    private LocalDateTime createdAt;
    private Map<String, Object> maskedPatientData;
    private HealthcareRight primaryRight;
    private List<HealthcareRight> additionalRights;
    private List<String> recommendations;
    private boolean pdpaMasked;
}
