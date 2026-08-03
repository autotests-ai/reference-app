package dev.reference.app.controller;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import dev.reference.app.config.SecurityConfig;
import dev.reference.app.dto.HealthResponse;
import dev.reference.app.dto.ItemDto;
import dev.reference.app.dto.ItemsResponse;
import dev.reference.app.service.ItemService;
import dev.reference.app.service.JwtService;

@WebMvcTest(controllers = ApiController.class)
@Import(SecurityConfig.class)
@DisplayName("ApiController")
class ApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ItemService itemService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/health returns ok")
    void healthReturnsOk() throws Exception {
        when(itemService.health()).thenReturn(new HealthResponse("ok", "reference-app"));

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.service").value("reference-app"));
    }

    @Test
    @DisplayName("GET /api/items returns seeded items")
    void itemsReturnsList() throws Exception {
        when(itemService.listItems()).thenReturn(new ItemsResponse(
                List.of(new ItemDto(1L, "Alpha", "First item")),
                "postgresql"
        ));

        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("postgresql"))
                .andExpect(jsonPath("$.items[0].name").value("Alpha"))
                .andExpect(jsonPath("$.items[0].description").value("First item"));
    }
}
