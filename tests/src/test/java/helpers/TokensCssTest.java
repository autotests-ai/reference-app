package helpers;

import annotations.Layer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Layer("unit")
@DisplayName("TokensCss")
class TokensCssTest {

    @ParameterizedTest
    @MethodSource("canonicalSizeTokens")
    @DisplayName("tokens.css keeps canonical component size tokens")
    void tokensMatchComponentSizesCanon(String token, String expected) throws Exception {
        var tokens = TokensCss.parseRootTokens(TokensCss.defaultTokensPath());
        assertTrue(tokens.containsKey(token), "Missing token: " + token);
        assertEquals(expected, tokens.get(token));
    }

    static Stream<Arguments> canonicalSizeTokens() {
        return Stream.of(
                Arguments.of("--control-height-md", "36px"),
                Arguments.of("--icon-size-md", "18px"),
                Arguments.of("--input-min-width", "200px"),
                Arguments.of("--header-height", "56px")
        );
    }

    @Test
    @DisplayName("resolveTokensCssPath prefers frontend candidate")
    void resolveTokensCssPathPrefersFrontendCandidate(@TempDir Path temp) throws Exception {
        var frontend = temp.resolve("tokens.css");
        var backend = temp.resolve("backend-tokens.css");
        Files.writeString(frontend, ":root { --x: 1px; }");
        Files.writeString(backend, ":root { --y: 2px; }");

        assertEquals(frontend, TokensCss.resolveTokensCssPath(frontend, backend));
    }

    @Test
    @DisplayName("resolveTokensCssPath falls back to backend candidate")
    void resolveTokensCssPathFallsBackToBackendCandidate(@TempDir Path temp) throws Exception {
        var frontend = temp.resolve("missing-tokens.css");
        var backend = temp.resolve("backend-tokens.css");
        Files.writeString(backend, ":root { --y: 2px; }");

        assertEquals(backend, TokensCss.resolveTokensCssPath(frontend, backend));
    }

    @Test
    @DisplayName("parseRootTokens rejects css without :root block")
    void parseRootTokensRejectsMissingRootBlock() throws Exception {
        var css = Files.createTempFile("tokens-invalid-", ".css");
        Files.writeString(css, "body { color: red; }");

        assertThrows(IllegalArgumentException.class, () -> TokensCss.parseRootTokens(css));
    }
}
