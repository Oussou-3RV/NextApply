package com.nextapply.backend.controller;

import com.nextapply.backend.dto.CvTextResponse;
import com.nextapply.backend.service.CvTextExtractor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

// Pas besoin du userId ici : rien n'est lu ni enregistré en base.
// La route reste protégée par SecurityConfig (anyRequest().authenticated()).
@RestController
@RequestMapping("/api/cv")
public class CvController {

    private final CvTextExtractor cvTextExtractor;

    public CvController(CvTextExtractor cvTextExtractor) {
        this.cvTextExtractor = cvTextExtractor;
    }

    // Le navigateur envoie le fichier en multipart/form-data, dans le champ « file »
    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CvTextResponse extract(@RequestParam("file") MultipartFile file) throws IOException {
        return cvTextExtractor.extract(file.getBytes());
    }
}
