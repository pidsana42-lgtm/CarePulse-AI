package com.carepulse.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class PDPAMaskingService {

    /**
     * Mask 13-digit Thai Citizen ID (e.g. 1-1002-XXXXX-XX-6)
     */
    public String maskCitizenId(String idNumber) {
        if (idNumber == null || idNumber.trim().isEmpty()) {
            return "ไม่ระบุ";
        }
        String cleanId = idNumber.replaceAll("\\D", "");
        if (cleanId.length() != 13) {
            if (cleanId.length() > 4) {
                return cleanId.substring(0, 2) + "XXXXX" + cleanId.substring(cleanId.length() - 2);
            }
            return "XXXXXXXXXXXXX";
        }
        return String.format("%c-%s-XXXXX-XX-%c", 
            cleanId.charAt(0), 
            cleanId.substring(1, 5), 
            cleanId.charAt(12)
        );
    }

    /**
     * Mask Phone Number (e.g. 081-XXX-5678)
     */
    public String maskPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return "";
        }
        String cleanPhone = phone.replaceAll("\\D", "");
        if (cleanPhone.length() == 10) {
            return cleanPhone.substring(0, 3) + "-XXX-" + cleanPhone.substring(6);
        }
        return "XXX-XXX-XXXX";
    }

    /**
     * Mask Full Name (e.g. สมชาย ใจดี -> สม*** ใ**)
     */
    public String maskName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        String[] parts = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.length() <= 2) {
                sb.append(part.charAt(0)).append("* ");
            } else {
                sb.append(part.substring(0, 2)).append("*".repeat(part.length() - 2)).append(" ");
            }
        }
        return sb.toString().trim();
    }

    /**
     * Recursively sanitize sensitive patient keys in Map
     */
    public Map<String, Object> sanitizePatientData(Map<String, Object> data) {
        Map<String, Object> sanitized = new HashMap<>();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String key = entry.getKey().toLowerCase();
            Object value = entry.getValue();
            if (value instanceof String strVal) {
                if (key.contains("citizen") || key.contains("id_card") || key.contains("national_id")) {
                    sanitized.put(entry.getKey(), maskCitizenId(strVal));
                } else if (key.contains("phone") || key.contains("tel")) {
                    sanitized.put(entry.getKey(), maskPhoneNumber(strVal));
                } else if (key.contains("name")) {
                    sanitized.put(entry.getKey(), maskName(strVal));
                } else {
                    sanitized.put(entry.getKey(), value);
                }
            } else {
                sanitized.put(entry.getKey(), value);
            }
        }
        return sanitized;
    }
}
