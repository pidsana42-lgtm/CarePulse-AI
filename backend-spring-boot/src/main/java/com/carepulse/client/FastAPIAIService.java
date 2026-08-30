package com.carepulse.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class FastAPIAIService {

    private static final Logger log = LoggerFactory.getLogger(FastAPIAIService.class);
    private final RestTemplate restTemplate;

    @Value("${services.fastapi-ai.url:http://localhost:8000}")
    private String fastApiBaseUrl;

    public FastAPIAIService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

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
            throw new RuntimeException("ไม่สามารถเชื่อมต่อกับบริการ FastAPI AI Service ได้: " + e.getMessage(), e);
        }
    }
}
