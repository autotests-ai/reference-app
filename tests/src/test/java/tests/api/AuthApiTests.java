package tests.api;

import annotations.Layer;
import api.ApiTestBase;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

@Layer("api")
@Epic("Reference API")
@Feature("Authentication")
@DisplayName("Auth API")
class AuthApiTests extends ApiTestBase {

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login returns token for seeded user")
    void loginWithValidCredentials() {
        given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"user1\",\"password\":\"password1\"}")
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .body("username", equalTo("user1"))
                .body("redirectUrl", equalTo("/logged-in.html"));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/login rejects invalid password")
    void loginWithInvalidPassword() {
        given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"user1\",\"password\":\"wrongpassword\"}")
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(401)
                .body("message", equalTo("Wrong login or password"));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register creates user and returns token")
    void registerNewUser() {
        String username = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8);

        given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"" + username + "\",\"password\":\"password123\"}")
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(201)
                .body("token", notNullValue())
                .body("username", equalTo(username))
                .body("redirectUrl", equalTo("/logged-in.html"));
    }

    @Test
    @Tag("api")
    @DisplayName("POST /api/auth/register rejects duplicate username")
    void registerDuplicateUsername() {
        given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"user1\",\"password\":\"password123\"}")
                .when()
                .post("/api/auth/register")
                .then()
                .statusCode(409)
                .body("message", equalTo("Username already taken"));
    }

    @Test
    @Tag("api")
    @DisplayName("GET /api/auth/me returns profile for bearer token")
    void profileWithBearerToken() {
        String token = given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"user1\",\"password\":\"password1\"}")
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/auth/me")
                .then()
                .statusCode(200)
                .body("username", equalTo("user1"));
    }
}
