/**
 * Curated code snippets for code-style-explorer (ADR 002 + stacks/java-spring/tests).
 * RAG chunks — metadata; здесь — runnable excerpts для terminal preview.
 * Ключ: "<paramId>:<value>"
 */
window.codeStyleSamples = {
  "testStyle:raw_selenide": {
    title: "raw_selenide — open + $() без PO",
    source: "ADR 002 · ethalon _ethalon/ladder/LoginTests.wrongPasswordAuthorizationTest",
    rag: "test-negative",
    language: "java",
    code: `@Test
void wrongPasswordAuthorizationTest() {
    open("/login");
    $("[data-testid='login-input']").setValue("user1");
    $("[data-testid='password-input']").setValue("wrong");
    $("[data-testid='submit-button']").click();
    $("[data-testid='error-message']").shouldHave(text("Wrong login or password"));
}`,
  },
  "testStyle:inline_steps": {
    title: "inline_steps — Allure.step в тесте",
    source: "ADR 002 · ethalon emptyPasswordAuthorizationTest",
    rag: "test-negative",
    language: "java",
    code: `@Test
void emptyPasswordAuthorizationTest() {
    Allure.step("Open login page", () -> open("/login"));
    Allure.step("Submit empty password", () -> {
        $("[data-testid='login-input']").setValue("user1");
        $("[data-testid='submit-button']").click();
    });
    $("[data-testid='error-message']").shouldHave(text("Password is required"));
}`,
  },
  "testStyle:page_object": {
    title: "page_object — канон smoke",
    source: "stacks/java-spring/tests/src/test/java/tests/LoginTests.java",
    rag: "po-fluent",
    language: "java",
    code: `@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    loginPage.openPage()
            .fillAndSubmitForm("user1", "password1")
            .shouldHaveWelcomeMessage("Welcome, user1!");
}`,
  },
  "testStyle:style_ladder": {
    title: "style_ladder — смешение стилей в одном классе (учебный)",
    source: "ADR 002 § Учебная градация · RAG test-style-ladder",
    rag: "test-style-ladder",
    language: "java",
    code: `// Один класс — разные методы под разные оси (только ethalon / RAG):
//   shouldLoginWithValidCredentials     → page_object
//   wrongPasswordAuthorizationTest      → raw_selenide
//   emptyPasswordAuthorizationTest      → inline_steps + nested Allure.step
//   emptyLoginAuthorizationTest         → selenide_listener (per-test ON)
//   shortLoginAuthorizationTest         → TestOps @Manual, без браузера`,
  },
  "poFluent:true": {
    title: "po.fluent=true — цепочка вызовов",
    source: "stacks/java-spring/tests/.../LoginTests.java",
    rag: "po-fluent",
    language: "java",
    code: `loginPage.openPage()
        .fillAndSubmitForm("user1", "password1")
        .shouldHaveWelcomeMessage("Welcome, user1!");`,
  },
  "poFluent:false": {
    title: "po.fluent=false — явные шаги",
    source: "ADR 002 · explicit multi-step logout",
    rag: "po-fluent",
    language: "java",
    code: `LoginPage loginPage = new LoginPage();
loginPage.openPage();
loginPage.typeUsername("user1");
loginPage.typePassword("password1");
HomePage homePage = loginPage.submit();
homePage.shouldHaveWelcomeMessage("Welcome, user1!");`,
  },
  "poFluent:mixed": {
    title: "po.fluent=mixed — оба в LogoutTests",
    source: "RAG test-logout-flow",
    rag: "test-logout-flow",
    language: "java",
    code: `// fluent chain:
homePage.openPageWithLocalStorageAuthentication("user1", "password1")
        .clickLogoutButton();

// explicit:
loginPage.openPage().fillAndSubmitForm("user1", "password1");
homePage.clickLogoutButton();`,
  },
  "poCrossPage:explicit_instance": {
    title: "po.cross_page_assert=explicit_instance",
    source: "stacks/java-spring/tests/.../LoginTests.java",
    rag: "po-fluent",
    language: "java",
    code: `loginPage.openPage()
        .typeUsername("user1")
        .typePassword("password1");
loginPage.submitExpectingError()
        .shouldHaveErrorMessage("Wrong login or password");`,
  },
  "poCrossPage:chained_return": {
    title: "po.cross_page_assert=chained_return",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-fluent",
    language: "java",
    code: `loginPage.openPage()
        .fillAndSubmitForm("user1", "password1")  // → HomePage
        .shouldHaveWelcomeMessage("Welcome, user1!");`,
  },
  "poCrossPage:mixed": {
    title: "po.cross_page_assert=mixed",
    source: "RAG test-logout-flow",
    rag: "test-logout-flow",
    language: "java",
    code: `// login — explicit_instance; logout — chained_return`,
  },
  "stepsLocation:po_annotated": {
    title: "steps.location=po_annotated — @Step на PO",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-step",
    language: "java",
    code: `@Step("Type username: {username}")
public LoginPage typeUsername(String username) {
    loginInput.setValue(username);
    return this;
}`,
  },
  "stepsLocation:test_allure_step": {
    title: "steps.location=test_allure_step",
    source: "ADR 002 · emptyPasswordAuthorizationTest",
    rag: "test-negative",
    language: "java",
    code: `Allure.step("Fill login", () -> $("[data-testid='login-input']").setValue("user1"));
Allure.step("Submit form", () -> $("[data-testid='submit-button']").click());`,
  },
  "stepsLocation:selenide_listener": {
    title: "steps.location=selenide_listener",
    source: "ADR 002 · emptyLoginAuthorizationTest",
    rag: "allure-selenide-listener",
    language: "java",
    code: `@Test
@EnableAllureSelenideListener
void emptyLoginAuthorizationTest() {
    open("/login");
    $("[data-testid='submit-button']").click();
    // шаги Selenide → Allure автоматически, без Allure.step()
}`,
  },
  "stepsLocation:none": {
    title: "steps.location=none — только @DisplayName",
    source: "ADR 002 · wrongPasswordAuthorizationTest",
    rag: "test-negative",
    language: "java",
    code: `@Test
@DisplayName("Wrong password shows readable error")
void shouldShowErrorWhenPasswordIsWrong() {
    open("/login");
    $("[data-testid='password-input']").setValue("wrong");
    $("[data-testid='submit-button']").click();
}`,
  },
  "stepsLocation:hybrid": {
    title: "steps.location=hybrid — PO smoke + inline negative",
    source: "RAG test-style-ladder",
    rag: "test-style-ladder",
    language: "java",
    code: `// smoke → @Step на PO (shouldLoginWithValidCredentials)
// negative → Allure.step или raw inline в том же классе (ethalon only)`,
  },
  "stepsNesting:nested": {
    title: "steps.nesting=nested — родительский шаг",
    source: "ADR 002 · emptyPasswordAuthorizationTest",
    rag: "test-negative",
    language: "java",
    code: `Allure.step("Validate empty password", () -> {
    Allure.step("Open login page", () -> open("/login"));
    Allure.step("Submit", () -> $("[data-testid='submit-button']").click());
});`,
  },
  "stepsNesting:scenario_only": {
    title: "steps.nesting=scenario_only — TestOps manual",
    source: "ADR 002 · shortLoginAuthorizationTest",
    rag: "test-manual",
    language: "java",
    code: `@Test
@Manual
@AllureId("12345")
void shortLoginAuthorizationTest() {
    Allure.step("Проверить требования к полю login");
    Allure.step("Проверить требования к полю password");
    // без Selenide — exploratory / TestOps
}`,
  },
  "stepsNesting:none": {
    title: "steps.nesting=none",
    source: "ADR 002",
    rag: "test-negative",
    language: "java",
    code: `// Без ручных Allure.step — listener или @Step на PO`,
  },
  "stepsInlineSyntax:arrow_oneline": {
    title: "steps.inline_syntax=arrow_oneline",
    source: "ADR 002",
    rag: "test-negative",
    language: "java",
    code: `Allure.step("Open login", () -> open("/login"));`,
  },
  "stepsInlineSyntax:arrow_multiline": {
    title: "steps.inline_syntax=arrow_multiline",
    source: "ADR 002",
    rag: "test-negative",
    language: "java",
    code: `Allure.step("Submit form", () ->
        $("[data-testid='submit-button']").click());`,
  },
  "stepsInlineSyntax:block_nested": {
    title: "steps.inline_syntax=block_nested",
    source: "ADR 002 · emptyPasswordAuthorizationTest",
    rag: "test-negative",
    language: "java",
    code: `Allure.step("Submit empty form", () -> {
    $("[data-testid='login-input']").setValue("user1");
    $("[data-testid='submit-button']").click();
});`,
  },
  "poGranularity:atomic": {
    title: "po.granularity=atomic",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-fluent",
    language: "java",
    code: `loginPage.openPage();
loginPage.typeUsername("user1");
loginPage.typePassword("password1");
loginPage.submit();`,
  },
  "poGranularity:scenario": {
    title: "po.granularity=scenario — один compose-метод",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-fluent",
    language: "java",
    code: `@Step("Fill and submit form")
public HomePage fillAndSubmitForm(String username, String password) {
    typeUsername(username);
    typePassword(password);
    return submit();
}`,
  },
  "poGranularity:hybrid": {
    title: "po.granularity=hybrid — атомы + compose",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-fluent",
    language: "java",
    code: `// compose для happy path:
fillAndSubmitForm("user1", "password1");

// атомы для negative:
typeUsername("user1");
submitExpectingError();`,
  },
  "poStepNaming:verb_params": {
    title: "po.step_naming=verb_params",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-step",
    language: "java",
    code: `@Step("Type username: {username}")
public LoginPage typeUsername(String username) { ... }

@Step("Verify error message: {message}")
public LoginPage shouldHaveErrorMessage(String message) { ... }`,
  },
  "poStepNaming:verb_only": {
    title: "po.step_naming=verb_only",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-step",
    language: "java",
    code: `@Step("Type password")
public LoginPage typePassword(String password) { ... }`,
  },
  "poStepNaming:scenario_name": {
    title: "po.step_naming=scenario_name",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-step",
    language: "java",
    code: `@Step("Fill and submit form")
public HomePage fillAndSubmitForm(String username, String password) { ... }`,
  },
  "pageTransitionReturn:new_page_instance": {
    title: "po.page_transition=new_page_instance",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-fluent",
    language: "java",
    code: `@Step("Submit login form")
public HomePage submit() {
    submitButton.click();
    return new HomePage();
}`,
  },
  "pageTransitionReturn:return_this": {
    title: "po.page_transition=return_this",
    source: "ADR 002",
    rag: "po-fluent",
    language: "java",
    code: `@Step("Submit expecting validation error")
public LoginPage submitExpectingError() {
    submitButton.click();
    errorMessage.shouldBe(visible);
    return this;
}`,
  },
  "pageTransitionReturn:optional_navigator": {
    title: "po.page_transition=optional_navigator",
    source: "ADR 002",
    rag: "po-fluent",
    language: "java",
    code: `// Отдельный flow helper вместо return type PO:
AuthFlows.loginAs("user1", "password1");`,
  },
  "testBasePoInjection:fields_in_base": {
    title: "testbase.po_fields=fields_in_base",
    source: "stacks/java-spring/tests/.../TestBase.java",
    rag: "base-lifecycle",
    language: "java",
    code: `public class TestBase {
    protected HomePage homePage = new HomePage();
    protected LoginPage loginPage = new LoginPage();
}`,
  },
  "testBasePoInjection:per_test_field": {
    title: "testbase.po_fields=per_test_field",
    source: "ADR 002",
    rag: "e2e-layers",
    language: "java",
    code: `class LoginTests extends TestBase {
    private final LoginPage loginPage = new LoginPage();
}`,
  },
  "testBasePoInjection:factory": {
    title: "testbase.po_fields=factory",
    source: "ADR 002",
    rag: "e2e-layers",
    language: "java",
    code: `Pages.login().openPage().fillAndSubmitForm("user1", "password1");`,
  },
  "locatorStyle:data_testid": {
    title: "po.locator_style=data-testid — канон",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-locators",
    language: "java",
    code: `private final SelenideElement loginInput = $("[data-testid='login-input']");
private final SelenideElement passwordInput = $("[data-testid='password-input']");
private final SelenideElement submitButton = $("[data-testid='submit-button']");`,
  },
  "locatorStyle:by_text": {
    title: "po.locator_style=by text",
    source: "ADR 002 · po-locators Don't",
    rag: "po-locators",
    language: "java",
    code: `// Не рекомендуется в каноне:
private final SelenideElement submit = $(byText("Sign in"));`,
  },
  "locatorStyle:css_class": {
    title: "po.locator_style=css class",
    source: "ADR 002 · po-locators Don't",
    rag: "po-locators",
    language: "java",
    code: `// Не рекомендуется — хрупко при смене вёрстки:
private final SelenideElement loginInput = $(".login-form__input");`,
  },
  "assertInPo:true": {
    title: "assert.in_po=true",
    source: "stacks/java-spring/tests/.../LoginPage.java",
    rag: "po-step",
    language: "java",
    code: `@Step("Verify error message: {message}")
public LoginPage shouldHaveErrorMessage(String message) {
    errorMessage.shouldHave(text(message));
    return this;
}`,
  },
  "assertInPo:false": {
    title: "assert.in_po=false — assert в тесте",
    source: "ADR 002 · raw inline",
    rag: "test-negative",
    language: "java",
    code: `loginPage.openPage().typeUsername("user1").submitExpectingError();
// assert в тесте, не в PO:
$("[data-testid='error-message']").shouldHave(text("Password is required"));`,
  },
  "assertInPo:mixed": {
    title: "assert.in_po=mixed",
    source: "RAG test-style-ladder",
    rag: "test-style-ladder",
    language: "java",
    code: `// smoke → shouldHave* в PO
// negative raw → assert inline в тесте`,
  },
  "useDisplayName:junit": {
    title: "test.display_name=@DisplayName",
    source: "stacks/java-spring/tests/.../LoginTests.java",
    rag: "test-taxonomy",
    language: "java",
    code: `@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() { ... }`,
  },
  "useDisplayName:allure": {
    title: "test.display_name=@Description",
    source: "ADR 002",
    rag: "test-taxonomy",
    language: "java",
    code: `@Test
@Description("Пользователь входит с валидными credentials")
void shouldLoginWithValidCredentials() { ... }`,
  },
  "useDisplayName:both": {
    title: "test.display_name=both",
    source: "ADR 002",
    rag: "test-taxonomy",
    language: "java",
    code: `@Test
@DisplayName("Login smoke")
@Description("Happy path через PO fluent chain")
void shouldLoginWithValidCredentials() { ... }`,
  },
  "severityAnnotations:true": {
    title: "@Severity — включено",
    source: "ADR 002 · test-taxonomy",
    rag: "test-taxonomy",
    language: "java",
    code: `@Test
@Severity(SeverityLevel.CRITICAL)
void shouldLoginWithValidCredentials() { ... }`,
  },
  "severityAnnotations:false": {
    title: "@Severity — выключено",
    source: "ADR 002",
    rag: "test-taxonomy",
    language: "java",
    code: `// Без @Severity — приоритет из дефолтов Allure / вручную в TestOps`,
  },
  "layerAnnotation:true": {
    title: "@Layer — e2e",
    source: "stacks/java-spring/tests/.../LoginTests.java",
    rag: "test-pyramid",
    language: "java",
    code: `@Layer("e2e")
class LoginTests extends TestBase { ... }`,
  },
  "layerAnnotation:false": {
    title: "@Layer — выключено",
    source: "ADR 002",
    rag: "test-pyramid",
    language: "java",
    code: `// Без @Layer — pyramid slice только через env / Gradle task`,
  },
  "epicFeature:true": {
    title: "@Epic / @Feature",
    source: "stacks/java-spring/tests/.../LoginTests.java",
    rag: "test-taxonomy",
    language: "java",
    code: `@Epic("Authentication")
@Feature("Login")
class LoginTests extends TestBase { ... }`,
  },
  "epicFeature:false": {
    title: "@Epic / @Feature — выключено",
    source: "ADR 002",
    rag: "test-taxonomy",
    language: "java",
    code: `// Таксономия только через @Tag / folder structure`,
  },
  "storageShortcut:false": {
    title: "test.storage_shortcut=false — login через форму",
    source: "stacks/java-spring/tests/.../LoginTests.java",
    rag: "test-logout-flow",
    language: "java",
    code: `loginPage.openPage()
        .fillAndSubmitForm("user1", "password1");`,
  },
  "storageShortcut:local_storage": {
    title: "test.storage_shortcut=local_storage",
    source: "stacks/java-spring/tests/.../HomePage.java",
    rag: "test-storage-shortcut",
    language: "java",
    code: `homePage.openPageWithLocalStorageAuthentication("user1", "password1")
        .clickLogoutButton();`,
  },
  "storageShortcut:both": {
    title: "test.storage_shortcut=both — LogoutTests",
    source: "RAG test-logout-flow",
    rag: "test-logout-flow",
    language: "java",
    code: `// successfulLogoutTest — форма
// successfulLogoutWithLocalStorageAuthenticationTest — localStorage`,
  },
};
