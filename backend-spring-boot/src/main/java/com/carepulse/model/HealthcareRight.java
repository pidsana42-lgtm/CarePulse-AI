package com.carepulse.model;

import java.util.List;

public class HealthcareRight {
    private String schemeCode;
    private String schemeName;
    private boolean isEligible;
    private String coverageSummary;
    private List<String> freeItems;
    private List<String> coPayItems;
    private String howToUse;
    private String hospitalNetwork;

    public HealthcareRight() {}

    public HealthcareRight(String schemeCode, String schemeName, boolean isEligible, String coverageSummary,
                           List<String> freeItems, List<String> coPayItems, String howToUse, String hospitalNetwork) {
        this.schemeCode = schemeCode;
        this.schemeName = schemeName;
        this.isEligible = isEligible;
        this.coverageSummary = coverageSummary;
        this.freeItems = freeItems;
        this.coPayItems = coPayItems;
        this.howToUse = howToUse;
        this.hospitalNetwork = hospitalNetwork;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String schemeCode;
        private String schemeName;
        private boolean isEligible;
        private String coverageSummary;
        private List<String> freeItems;
        private List<String> coPayItems;
        private String howToUse;
        private String hospitalNetwork;

        public Builder schemeCode(String schemeCode) { this.schemeCode = schemeCode; return this; }
        public Builder schemeName(String schemeName) { this.schemeName = schemeName; return this; }
        public Builder isEligible(boolean isEligible) { this.isEligible = isEligible; return this; }
        public Builder coverageSummary(String coverageSummary) { this.coverageSummary = coverageSummary; return this; }
        public Builder freeItems(List<String> freeItems) { this.freeItems = freeItems; return this; }
        public Builder coPayItems(List<String> coPayItems) { this.coPayItems = coPayItems; return this; }
        public Builder howToUse(String howToUse) { this.howToUse = howToUse; return this; }
        public Builder hospitalNetwork(String hospitalNetwork) { this.hospitalNetwork = hospitalNetwork; return this; }

        public HealthcareRight build() {
            return new HealthcareRight(schemeCode, schemeName, isEligible, coverageSummary, freeItems, coPayItems, howToUse, hospitalNetwork);
        }
    }

    public String getSchemeCode() { return schemeCode; }
    public void setSchemeCode(String schemeCode) { this.schemeCode = schemeCode; }

    public String getSchemeName() { return schemeName; }
    public void setSchemeName(String schemeName) { this.schemeName = schemeName; }

    public boolean isEligible() { return isEligible; }
    public void setEligible(boolean eligible) { isEligible = eligible; }

    public String getCoverageSummary() { return coverageSummary; }
    public void setCoverageSummary(String coverageSummary) { this.coverageSummary = coverageSummary; }

    public List<String> getFreeItems() { return freeItems; }
    public void setFreeItems(List<String> freeItems) { this.freeItems = freeItems; }

    public List<String> getCoPayItems() { return coPayItems; }
    public void setCoPayItems(List<String> coPayItems) { this.coPayItems = coPayItems; }

    public String getHowToUse() { return howToUse; }
    public void setHowToUse(String howToUse) { this.howToUse = howToUse; }

    public String getHospitalNetwork() { return hospitalNetwork; }
    public void setHospitalNetwork(String hospitalNetwork) { this.hospitalNetwork = hospitalNetwork; }
}
