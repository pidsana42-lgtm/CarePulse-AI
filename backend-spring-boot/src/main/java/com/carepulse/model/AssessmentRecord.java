package com.carepulse.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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

    public AssessmentRecord() {}

    public AssessmentRecord(String id, String assessmentId, LocalDateTime createdAt,
                            Map<String, Object> maskedPatientData, HealthcareRight primaryRight,
                            List<HealthcareRight> additionalRights, List<String> recommendations, boolean pdpaMasked) {
        this.id = id;
        this.assessmentId = assessmentId;
        this.createdAt = createdAt;
        this.maskedPatientData = maskedPatientData;
        this.primaryRight = primaryRight;
        this.additionalRights = additionalRights;
        this.recommendations = recommendations;
        this.pdpaMasked = pdpaMasked;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String assessmentId;
        private LocalDateTime createdAt;
        private Map<String, Object> maskedPatientData;
        private HealthcareRight primaryRight;
        private List<HealthcareRight> additionalRights;
        private List<String> recommendations;
        private boolean pdpaMasked;

        public Builder id(String id) { this.id = id; return this; }
        public Builder assessmentId(String assessmentId) { this.assessmentId = assessmentId; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder maskedPatientData(Map<String, Object> maskedPatientData) { this.maskedPatientData = maskedPatientData; return this; }
        public Builder primaryRight(HealthcareRight primaryRight) { this.primaryRight = primaryRight; return this; }
        public Builder additionalRights(List<HealthcareRight> additionalRights) { this.additionalRights = additionalRights; return this; }
        public Builder recommendations(List<String> recommendations) { this.recommendations = recommendations; return this; }
        public Builder pdpaMasked(boolean pdpaMasked) { this.pdpaMasked = pdpaMasked; return this; }

        public AssessmentRecord build() {
            return new AssessmentRecord(id, assessmentId, createdAt, maskedPatientData, primaryRight, additionalRights, recommendations, pdpaMasked);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Map<String, Object> getMaskedPatientData() { return maskedPatientData; }
    public void setMaskedPatientData(Map<String, Object> maskedPatientData) { this.maskedPatientData = maskedPatientData; }

    public HealthcareRight getPrimaryRight() { return primaryRight; }
    public void setPrimaryRight(HealthcareRight primaryRight) { this.primaryRight = primaryRight; }

    public List<HealthcareRight> getAdditionalRights() { return additionalRights; }
    public void setAdditionalRights(List<HealthcareRight> additionalRights) { this.additionalRights = additionalRights; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public boolean isPdpaMasked() { return pdpaMasked; }
    public void setPdpaMasked(boolean pdpaMasked) { this.pdpaMasked = pdpaMasked; }
}
