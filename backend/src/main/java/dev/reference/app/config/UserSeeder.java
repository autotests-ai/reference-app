package dev.reference.app.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import dev.reference.app.entity.UserEntity;
import dev.reference.app.repository.UserRepository;

@Component
public class UserSeeder implements ApplicationRunner {

    private static final String SEED_USERNAME = "user1";
    private static final String SEED_PASSWORD = "password1";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByUsername(SEED_USERNAME)) {
            userRepository.save(new UserEntity(
                    SEED_USERNAME,
                    passwordEncoder.encode(SEED_PASSWORD)
            ));
        }
    }
}
