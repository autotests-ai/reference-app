package helpers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class TokensCss {

    private static final Pattern ROOT_BLOCK =
            Pattern.compile(":root\\s*\\{([^}]+)\\}", Pattern.DOTALL);
    private static final Pattern TOKEN =
            Pattern.compile("(--[\\w-]+)\\s*:\\s*([^;]+);");

    private TokensCss() {
    }

    public static Path defaultTokensPath() {
        return resolveTokensCssPath(
                Path.of("..", "frontend", "css", "tokens.css").normalize().toAbsolutePath(),
                Path.of("..", "backend", "src", "main", "resources", "static", "css", "tokens.css")
                        .normalize()
                        .toAbsolutePath()
        );
    }

    static Path resolveTokensCssPath(Path frontendCandidate, Path backendCandidate) {
        if (Files.exists(frontendCandidate)) {
            return frontendCandidate;
        }
        return backendCandidate;
    }

    public static Map<String, String> parseRootTokens(Path cssFile) throws Exception {
        var css = Files.readString(cssFile);
        var match = ROOT_BLOCK.matcher(css);
        if (!match.find()) {
            throw new IllegalArgumentException(":root block not found in " + cssFile);
        }
        var tokens = new LinkedHashMap<String, String>();
        Matcher tokenMatcher = TOKEN.matcher(match.group(1));
        while (tokenMatcher.find()) {
            tokens.put(tokenMatcher.group(1), tokenMatcher.group(2).trim());
        }
        return tokens;
    }
}
