package dev.reference.app;

public record AuthResponse(
        String token,
        String username,
        String redirectUrl
) {
}
