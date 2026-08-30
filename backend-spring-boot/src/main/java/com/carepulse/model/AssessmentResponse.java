package com.carepulse.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AssessmentResponse {
    private String assessmentId;
    private LocalDateTime assessedAt;
    private Map<String, Object> patientSummary;
    private HealthcareRight primaryRight;
    private List<HealthcareRight> additionalRights;
    private List<String> recommendations;
    private boolean pdpaProtected;

    public AssessmentResponse() {}

    public AssessmentResponse(String assessmentId, LocalDateTime assessedAt, Map<String, Object> patientSummary,
                              HealthcareRight primaryRight, List<HealthcareRight> additionalRights,
                              List<String> recommendations, boolean pdpaProtected) {
        this.assessmentId = assessmentId;
        this.assessedAt = assessedAt;
        this.patientSummary = patientSummary;
        this.primaryRight = primaryRight;
        this.additionalRights = additionalRights;
        this.recommendations = recommendations;
        this.pdpaProtected = pdpaProtected;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String assessmentId;
        private LocalDateTime assessedAt;
        private Map<String, Object> patientSummary;
        private HealthcareRight primaryRight;
        private List<HealthcareRight> additionalRights;
        private List<String> recommendations;
        private boolean pdpaProtected;

        public Builder assessmentId(String assessmentId) { this.assessmentId = assessmentId; return this; }
        public Builder assessedAt(LocalDateTime assessedAt) { this.assessedAt = assessedAt; return this; }
        public Builder patientSummary(Map<String, Object> patientSummary) { this.patientSummary = patientSummary; return this; }
        public Builder primaryRight(HealthcareRight primaryRight) { this.primaryRight = primaryRight; return this; }
        public Builder additionalRights(List<HealthcareRight> additionalRights) { this.additionalRights = additionalRights; return this; }
        public Builder recommendations(List<String> recommendations) { this.recommendations = recommendations; return this; }
        public Builder pdpaProtected(boolean pdpaProtected) { this.pdpaProtected = pdpaProtected; return this; }

        public AssessmentResponse build() {
            return new AssessmentResponse(assessmentId, assessedAt, patientSummary, primaryRight, additionalRights, recommendations, pdpaProtected);
        }
    }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public LocalDateTime getAssessedAt() { return assessedAt; }
    public void setAssessedAt(LocalDateTime assessedAt) { this.assessedAt = assessedAt; }

    public Map<String, Object> getPatientSummary() { return patientSummary; }
    public void setPatientSummary(Map<String, Object> patientSummary) { this.patientSummary = patientSummary; }

    public HealthcareRight getPrimaryRight() { return primaryRight; }
    public void setPrimaryRight(HealthcareRight primaryRight) { this.primaryRight = primaryRight; }

    public List<HealthcareRight> getAdditionalRights() { return additionalRights; }
    public void setAdditionalRights(List<HealthcareRight> additionalRights) { this.additionalRights = additionalRights; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public boolean isPdpaProtected() { return pdpaProtected; }
    public void setPdpaProtected(boolean pdpaProtected) { this.pdpaProtected = pdpaProtected; }
}
