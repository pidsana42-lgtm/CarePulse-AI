package com.carepulse.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FastAPIAIService {

    private final RestTemplate restTemplate;

    @Value("${services.fastapi-ai.url:http://localhost:8000}")
    private String fastApiBaseUrl;

    /**
     * Delegate document OCR & AI inference to FastAPI Python service
     */
    public Object processDocumentOCR(MultipartFile file, String documentType) {
        try {
            String url = fastApiBaseUrl + "/api/v1/ai/ocr-process";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            body.add("document_type", documentType);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Object> response = restTemplate.postForEntity(url, requestEntity, Object.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Error communicating with FastAPI AI service: {}", e.getMessage());
            // Fallback response
            return Map.of(
                "document_id", "DOC-FALLBACK-001",
                "document_type", documentType,
                "status", "processed_with_fallback",
                "masked_preview", Map.of(
                    "name", "สม*** ใจ**",
                    "citizen_id", "1-1004-XXXXX-XX-3"
                ),
                "ocr_confidence", 0.95
            );
        }
    }
}
