package com.nextapply.backend.controller;

import com.nextapply.backend.dto.CvProposalResponse;
import com.nextapply.backend.dto.CvTextResponse;
import com.nextapply.backend.service.CvAnalyzer;
import com.nextapply.backend.service.CvTextExtractor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

// Pas besoin du userId ici : rien n'est lu ni enregistré en base.
// Les routes restent protégées par SecurityConfig (anyRequest().authenticated()).
@RestController
@RequestMapping("/api/cv")
public class CvController {

    private final CvTextExtractor cvTextExtractor;
    private final CvAnalyzer cvAnalyzer;

    public CvController(CvTextExtractor cvTextExtractor, CvAnalyzer cvAnalyzer) {
        this.cvTextExtractor = cvTextExtractor;
        this.cvAnalyzer = cvAnalyzer;
    }

    // Le navigateur envoie le fichier en multipart/form-data, dans le champ « file »
    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CvTextResponse extract(@RequestParam("file") MultipartFile file) throws IOException {
        return cvTextExtractor.extract(file.getBytes());
    }

    // Extraction du texte (mêmes vérifications que /extract), puis analyse par l'IA.
    // Renvoie une proposition à relire : rien n'est enregistré.
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CvProposalResponse analyze(@RequestParam("file") MultipartFile file) throws IOException {
        String text = cvTextExtractor.extract(file.getBytes()).text();
        return cvAnalyzer.analyze(text);
    }
}
