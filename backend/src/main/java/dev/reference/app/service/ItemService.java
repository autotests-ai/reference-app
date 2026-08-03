package dev.reference.app.service;

import java.util.List;
import org.springframework.stereotype.Service;
import dev.reference.app.dto.HealthResponse;
import dev.reference.app.dto.ItemDto;
import dev.reference.app.dto.ItemsResponse;
import dev.reference.app.repository.ItemRepository;

@Service
public class ItemService {

    private final ItemRepository repository;

    public ItemService(ItemRepository repository) {
        this.repository = repository;
    }

    public HealthResponse health() {
        return new HealthResponse("ok", "reference-app");
    }

    public ItemsResponse listItems() {
        List<ItemDto> items = repository.findAll().stream()
                .map(entity -> new ItemDto(entity.getId(), entity.getName(), entity.getDescription()))
                .toList();
        return new ItemsResponse(items, "postgresql");
    }
}
