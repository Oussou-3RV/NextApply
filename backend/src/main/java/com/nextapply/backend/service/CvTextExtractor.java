package com.nextapply.backend.service;

import com.nextapply.backend.dto.CvTextResponse;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

// Extrait le texte d'un CV PDF avec Apache PDFBox. Le fichier est lu en mémoire
// puis oublié : on ne garde ni le PDF ni le texte.
@Service
public class CvTextExtractor {

    // Un CV dépasse rarement 2 ou 3 pages. Au-delà de 10, ce n'est sans doute pas
    // un CV, et on évite d'envoyer un texte énorme à l'IA à l'étape suivante.
    static final int MAX_PAGES = 10;

    // Tout fichier PDF commence par ces 5 octets. On regarde le contenu plutôt que
    // le nom ou le Content-Type, que le navigateur peut envoyer de travers.
    private static final byte[] PDF_SIGNATURE = "%PDF-".getBytes(StandardCharsets.US_ASCII);

    public CvTextResponse extract(byte[] content) {
        if (content.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier est vide. Choisis ton CV au format PDF.");
        }
        if (!startsWithPdfSignature(content)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Ce fichier n'est pas un PDF. Exporte ton CV en PDF, puis réessaie.");
        }

        // try-with-resources : le document est fermé (et sa mémoire libérée) même en cas d'erreur
        try (PDDocument document = Loader.loadPDF(content)) {
            int pages = document.getNumberOfPages();
            if (pages > MAX_PAGES) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                        "Ce PDF a " + pages + " pages. Un CV de " + MAX_PAGES + " pages au plus est accepté.");
            }

            String text = normalize(new PDFTextStripper().getText(document));
            if (text.isEmpty()) {
                // Cas typique : un CV scanné, qui n'est qu'une image
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                        "Aucun texte trouvé dans ce PDF. S'il s'agit d'un scan, exporte ton CV depuis Word ou Google Docs.");
            }
            return new CvTextResponse(pages, text);
        } catch (InvalidPasswordException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Ce PDF est protégé par un mot de passe. Enregistre une copie sans protection, puis réessaie.");
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Ce PDF est illisible ou abîmé. Exporte-le de nouveau, puis réessaie.");
        }
    }

    private static boolean startsWithPdfSignature(byte[] content) {
        return content.length >= PDF_SIGNATURE.length
                && Arrays.equals(content, 0, PDF_SIGNATURE.length, PDF_SIGNATURE, 0, PDF_SIGNATURE.length);
    }

    // Nettoie le texte pour l'IA : fins de ligne unifiées, espaces en fin de ligne
    // retirés, au plus une ligne vide entre deux blocs
    static String normalize(String raw) {
        return raw.replace("\r\n", "\n")
                .replace('\r', '\n')
                .replaceAll("[ \\t\\u00A0]+\\n", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .strip();
    }
}
