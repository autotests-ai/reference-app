package dev.reference.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserSeeder")
class UserSeederTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserSeeder userSeeder;

    @BeforeEach
    void setUp() {
        userSeeder = new UserSeeder(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("creates seed user when missing")
    void createsSeedUserWhenMissing() {
        when(userRepository.existsByUsername("user1")).thenReturn(false);
        when(passwordEncoder.encode("password1")).thenReturn("encoded-hash");

        userSeeder.run(mock(ApplicationArguments.class));

        var userCaptor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("user1", userCaptor.getValue().getUsername());
        assertEquals("encoded-hash", userCaptor.getValue().getPasswordHash());
    }

    @Test
    @DisplayName("skips seeding when user already exists")
    void skipsSeedingWhenUserExists() {
        when(userRepository.existsByUsername("user1")).thenReturn(true);

        userSeeder.run(mock(ApplicationArguments.class));

        verify(userRepository, never()).save(any());
    }
}
