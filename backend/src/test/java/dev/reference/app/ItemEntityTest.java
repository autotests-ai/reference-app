package dev.reference.app;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Constructor;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DisplayName("ItemEntity")
class ItemEntityTest {

    @Test
    @DisplayName("constructor and getters expose item fields")
    void constructorAndGettersExposeItemFields() {
        var item = new ItemEntity("Alpha", "First item");

        assertEquals("Alpha", item.getName());
        assertEquals("First item", item.getDescription());

        ReflectionTestUtils.setField(item, "id", 3L);
        assertEquals(3L, item.getId());
    }

    @Test
    @DisplayName("JPA no-args constructor is available")
    void jpaNoArgsConstructorIsAvailable() throws Exception {
        Constructor<ItemEntity> constructor = ItemEntity.class.getDeclaredConstructor();
        constructor.setAccessible(true);

        var item = constructor.newInstance();

        assertEquals(null, item.getName());
        assertEquals(null, item.getDescription());
    }
}
