package com.nextapply.backend.service;

import com.nextapply.backend.dto.CvTextResponse;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Les PDF de test sont fabriqués en mémoire avec PDFBox : pas de fichier à versionner
class CvTextExtractorTest {

    private final CvTextExtractor extractor = new CvTextExtractor();

    @Test
    void extract_readsTheTextAndCountsThePages() throws IOException {
        CvTextResponse result = extractor.extract(pdfWithLines("Camille Tremblay", "Développeuse Java"));

        assertThat(result.pages()).isEqualTo(1);
        assertThat(result.text()).contains("Camille Tremblay").contains("Développeuse Java");
    }

    @Test
    void extract_emptyFile_isRejectedWith400() {
        assertStatus(new byte[0], HttpStatus.BAD_REQUEST);
    }

    @Test
    void extract_fileThatIsNotAPdf_isRejectedWith415() {
        assertStatus("Bonjour, je suis un fichier texte".getBytes(StandardCharsets.UTF_8),
                HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    @Test
    void extract_brokenPdf_isRejectedWith422() {
        // Commence comme un PDF, mais le reste n'en est pas un
        assertStatus("%PDF-1.7\nla suite est abîmée".getBytes(StandardCharsets.US_ASCII),
                HttpStatus.UNPROCESSABLE_CONTENT);
    }

    @Test
    void extract_pdfWithoutText_isRejectedWith422() throws IOException {
        // Un scan donne des pages sans texte : on le simule avec des pages vides
        assertThatThrownBy(() -> extractor.extract(blankPdf(1)))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
                    assertThat(e.getReason()).contains("Aucun texte");
                });
    }

    @Test
    void extract_tooManyPages_isRejectedWith422() throws IOException {
        assertThatThrownBy(() -> extractor.extract(blankPdf(CvTextExtractor.MAX_PAGES + 1)))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
                    assertThat(e.getReason()).contains("11 pages");
                });
    }

    @Test
    void extract_passwordProtectedPdf_isRejectedWith422() throws IOException {
        assertThatThrownBy(() -> extractor.extract(passwordProtectedPdf()))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
                    assertThat(e.getReason()).contains("mot de passe");
                });
    }

    @Test
    void normalize_unifiesLineEndingsAndCollapsesBlankLines() {
        assertThat(CvTextExtractor.normalize("  Nom  \r\nPrénom\t\r\n\r\n\r\n\r\nCompétences \n"))
                .isEqualTo("Nom\nPrénom\n\nCompétences");
    }

    private void assertStatus(byte[] content, HttpStatus expected) {
        assertThatThrownBy(() -> extractor.extract(content))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(expected));
    }

    // --- Fabrication des PDF de test ---

    static byte[] pdfWithLines(String... lines) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.beginText();
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                content.newLineAtOffset(50, 700);
                for (String line : lines) {
                    content.showText(line);
                    content.newLineAtOffset(0, -20);
                }
                content.endText();
            }
            return toBytes(document);
        }
    }

    private static byte[] blankPdf(int pages) throws IOException {
        try (PDDocument document = new PDDocument()) {
            for (int i = 0; i < pages; i++) {
                document.addPage(new PDPage());
            }
            return toBytes(document);
        }
    }

    private static byte[] passwordProtectedPdf() throws IOException {
        try (PDDocument document = new PDDocument()) {
            document.addPage(new PDPage());
            StandardProtectionPolicy policy =
                    new StandardProtectionPolicy("proprietaire", "ouverture", new AccessPermission());
            document.protect(policy);
            return toBytes(document);
        }
    }

    private static byte[] toBytes(PDDocument document) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        document.save(out);
        return out.toByteArray();
    }
}
