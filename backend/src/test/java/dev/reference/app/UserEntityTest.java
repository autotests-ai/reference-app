package dev.reference.app;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Constructor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@DisplayName("UserEntity")
class UserEntityTest {

    @Test
    @DisplayName("constructor and getters expose user fields")
    void constructorAndGettersExposeUserFields() {
        var user = new UserEntity("user1", "hash");

        assertEquals("user1", user.getUsername());
        assertEquals("hash", user.getPasswordHash());
        assertNotNull(user.getCreatedAt());

        ReflectionTestUtils.setField(user, "id", 7L);
        assertEquals(7L, user.getId());
    }

    @Test
    @DisplayName("JPA no-args constructor is available")
    void jpaNoArgsConstructorIsAvailable() throws Exception {
        Constructor<UserEntity> constructor = UserEntity.class.getDeclaredConstructor();
        constructor.setAccessible(true);

        var user = constructor.newInstance();

        assertNotNull(user.getCreatedAt());
    }
}
