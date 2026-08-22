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
public class HealthcareRight {
    private String schemeCode;
    private String schemeName;
    private boolean isEligible;
    private String coverageSummary;
    private List<String> freeItems;
    private List<String> coPayItems;
    private String howToUse;
    private String hospitalNetwork;
}
