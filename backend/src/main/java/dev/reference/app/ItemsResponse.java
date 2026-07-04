package dev.reference.app;

import java.util.List;

public record ItemsResponse(List<ItemDto> items, String source) {
}
