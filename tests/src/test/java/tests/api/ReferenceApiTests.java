package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;

@Layer("api")
@Epic("Home")
@Feature("Health and items")
@DisplayName("Reference API")
class ReferenceApiTests extends ApiTestBase {

    @Test
    @Tag("api")
    @DisplayName("GET /api/health returns ok")
    void healthEndpointReturnsOk() {
        given()
                .when()
                .get("/api/health")
                .then()
                .statusCode(200)
                .body("status", equalTo("ok"))
                .body("service", equalTo("reference-app"));
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/items returns seeded PostgreSQL items")
    void itemsEndpointReturnsSeed() {
        given()
                .when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .body("source", equalTo("postgresql"))
                .body("items", notNullValue())
                .body("items.size()", greaterThanOrEqualTo(3))
                .body("items[0].name", notNullValue())
                .body("items[0].description", notNullValue());
    }
}
