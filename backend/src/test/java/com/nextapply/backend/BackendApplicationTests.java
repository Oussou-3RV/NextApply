package com.nextapply.backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

// Démarre toute l'application : connexion à la base, Flyway, validation des entités
// (ddl-auto=validate) et des méthodes des repositories. Il faut donc les variables
// d'environnement (DB_URL, DB_USER, DB_PASSWORD, SUPABASE_URL). Sans elles, le test
// est ignoré au lieu d'échouer.
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_URL", matches = ".+")
@EnabledIfEnvironmentVariable(named = "SUPABASE_URL", matches = ".+")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
