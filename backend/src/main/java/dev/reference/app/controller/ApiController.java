package dev.reference.app.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import dev.reference.app.dto.HealthResponse;
import dev.reference.app.dto.ItemsResponse;
import dev.reference.app.service.ItemService;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final ItemService itemService;

    public ApiController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return itemService.health();
    }

    @GetMapping("/items")
    public ItemsResponse items() {
        return itemService.listItems();
    }
}
