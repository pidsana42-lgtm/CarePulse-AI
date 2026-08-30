package com.carepulse.model;

import java.util.List;

public class AssessmentRequest {
    private String citizenId;
    private int age;
    private String occupationStatus;
    private String registeredProvince;
    private boolean hasDisabilityCard;
    private List<String> chronicConditions;
    private String urgencyLevel;

    public AssessmentRequest() {}

    public AssessmentRequest(String citizenId, int age, String occupationStatus, String registeredProvince,
                             boolean hasDisabilityCard, List<String> chronicConditions, String urgencyLevel) {
        this.citizenId = citizenId;
        this.age = age;
        this.occupationStatus = occupationStatus;
        this.registeredProvince = registeredProvince;
        this.hasDisabilityCard = hasDisabilityCard;
        this.chronicConditions = chronicConditions;
        this.urgencyLevel = urgencyLevel;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String citizenId;
        private int age;
        private String occupationStatus;
        private String registeredProvince;
        private boolean hasDisabilityCard;
        private List<String> chronicConditions;
        private String urgencyLevel;

        public Builder citizenId(String citizenId) { this.citizenId = citizenId; return this; }
        public Builder age(int age) { this.age = age; return this; }
        public Builder occupationStatus(String occupationStatus) { this.occupationStatus = occupationStatus; return this; }
        public Builder registeredProvince(String registeredProvince) { this.registeredProvince = registeredProvince; return this; }
        public Builder hasDisabilityCard(boolean hasDisabilityCard) { this.hasDisabilityCard = hasDisabilityCard; return this; }
        public Builder chronicConditions(List<String> chronicConditions) { this.chronicConditions = chronicConditions; return this; }
        public Builder urgencyLevel(String urgencyLevel) { this.urgencyLevel = urgencyLevel; return this; }

        public AssessmentRequest build() {
            return new AssessmentRequest(citizenId, age, occupationStatus, registeredProvince, hasDisabilityCard, chronicConditions, urgencyLevel);
        }
    }

    public String getCitizenId() { return citizenId; }
    public void setCitizenId(String citizenId) { this.citizenId = citizenId; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getOccupationStatus() { return occupationStatus; }
    public void setOccupationStatus(String occupationStatus) { this.occupationStatus = occupationStatus; }

    public String getRegisteredProvince() { return registeredProvince; }
    public void setRegisteredProvince(String registeredProvince) { this.registeredProvince = registeredProvince; }

    public boolean isHasDisabilityCard() { return hasDisabilityCard; }
    public void setHasDisabilityCard(boolean hasDisabilityCard) { this.hasDisabilityCard = hasDisabilityCard; }

    public List<String> getChronicConditions() { return chronicConditions; }
    public void setChronicConditions(List<String> chronicConditions) { this.chronicConditions = chronicConditions; }

    public String getUrgencyLevel() { return urgencyLevel; }
    public void setUrgencyLevel(String urgencyLevel) { this.urgencyLevel = urgencyLevel; }
}
