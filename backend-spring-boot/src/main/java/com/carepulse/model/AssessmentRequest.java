package com.carepulse.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentRequest {
    private String citizenId;
    private int age;
    private String occupationStatus;
    private String registeredProvince;
    private boolean hasDisabilityCard;
    private List<String> chronicConditions;
    private String urgencyLevel;
}
