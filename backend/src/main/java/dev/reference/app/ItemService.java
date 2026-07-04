package dev.reference.app;

import org.springframework.stereotype.Service;

import java.util.List;

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
