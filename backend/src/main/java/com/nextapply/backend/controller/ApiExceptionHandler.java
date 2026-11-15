package com.nextapply.backend.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

// Toutes les erreurs de l'API sont renvoyées au format ProblemDetail (RFC 9457) :
// { "status": 409, "title": "Conflict", "detail": "La compétence « Java » existe déjà", ... }
// ResponseEntityExceptionHandler s'occupe déjà des erreurs standard de Spring,
// dont les ResponseStatusException (404, 409) lancées par les services.
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    // Erreurs de @Valid : on ajoute la liste des champs invalides, que le
    // formulaire React pourra afficher à côté de chaque champ
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }

        ProblemDetail problem = ex.getBody();
        problem.setDetail("Certains champs sont invalides");
        problem.setProperty("errors", errors);
        return handleExceptionInternal(ex, problem, headers, status, request);
    }
}
