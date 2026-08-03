package dev.reference.app.dto;

import java.util.List;

public record ItemsResponse(List<ItemDto> items, String source) {
}
