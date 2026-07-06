package dev.reference.app;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String POST_AUTH_REDIRECT = "/";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new AuthException(409, "Username already taken");
        }

        UserEntity user = new UserEntity(
                request.username(),
                passwordEncoder.encode(request.password())
        );
        userRepository.save(user);
        return buildAuthResponse(user.getUsername());
    }

    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new AuthException(401, "Wrong login or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException(401, "Wrong login or password");
        }

        return buildAuthResponse(user.getUsername());
    }

    public UserProfileResponse profile(String username) {
        userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException(401, "Unauthorized"));
        return new UserProfileResponse(username);
    }

    private AuthResponse buildAuthResponse(String username) {
        return new AuthResponse(
                jwtService.createToken(username),
                username,
                POST_AUTH_REDIRECT
        );
    }
}
