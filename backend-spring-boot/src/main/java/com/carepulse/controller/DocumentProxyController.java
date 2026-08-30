package com.carepulse.controller;

import com.carepulse.client.FastAPIAIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/documents")
public class DocumentProxyController {

    private final FastAPIAIService fastAPIAIService;

    public DocumentProxyController(FastAPIAIService fastAPIAIService) {
        this.fastAPIAIService = fastAPIAIService;
    }

    @PostMapping("/scan")
    public ResponseEntity<Object> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "document_type", defaultValue = "id_card") String documentType) {
        
        Object result = fastAPIAIService.processDocumentOCR(file, documentType);
        return ResponseEntity.ok(result);
    }
}
