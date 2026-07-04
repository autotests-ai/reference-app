package dev.reference.app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ItemService")
class ItemServiceTest {

    @Mock
    private ItemRepository repository;

    private ItemService service;

    @BeforeEach
    void setUp() {
        service = new ItemService(repository);
    }

    @Test
    @DisplayName("health returns ok status")
    void healthReturnsOk() {
        HealthResponse response = service.health();

        assertEquals("ok", response.status());
        assertEquals("reference-app", response.service());
    }

    @Test
    @DisplayName("listItems maps repository rows to DTOs")
    void listItemsMapsRows() {
        ItemEntity alpha = new ItemEntity("Alpha", "First item");
        ReflectionTestUtils.setField(alpha, "id", 1L);
        when(repository.findAll()).thenReturn(List.of(alpha));

        ItemsResponse response = service.listItems();

        assertEquals(1, response.items().size());
        assertEquals("Alpha", response.items().getFirst().name());
        assertEquals("First item", response.items().getFirst().description());
        assertEquals("postgresql", response.source());
        verify(repository).findAll();
    }

    @Test
    @DisplayName("listItems returns empty list when repository is empty")
    void listItemsReturnsEmptyWhenNoRows() {
        when(repository.findAll()).thenReturn(List.of());

        ItemsResponse response = service.listItems();

        assertTrue(response.items().isEmpty());
        assertEquals("postgresql", response.source());
    }
}
