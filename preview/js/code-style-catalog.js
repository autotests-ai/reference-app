/**
 * Human-facing catalog for code-style-explorer (≠ test-params-map vector axes).
 * Каждая тема — паттерн ADR 002 + vector overlay для e2e-builder (?catalog=<id>).
 */
window.codeStyleCatalog = {
  version: "1.0.0",
  sections: [
    { id: "canon", title: "Канон" },
    { id: "negative", title: "Negative" },
    { id: "steps", title: "Allure steps" },
    { id: "po", title: "Форма PO" },
    { id: "setup", title: "Setup / logout" },
    { id: "ladder", title: "Учебный ladder" },
    { id: "meta", title: "Таксономия", collapsed: true },
  ],
  topics: [
    {
      id: "canon-smoke",
      section: "canon",
      title: "Smoke — PO fluent",
      summary: "Канон CI: fluent chain + @Step на PO + assert в PO",
      source: "stacks/java-spring/tests/src/test/java/tests/LoginTests.java",
      rag: ["test-pyramid", "po-fluent", "po-step"],
      builderPreset: "smoke-local",
      vector: {
        testStyle: "page_object",
        poFluent: "true",
        poCrossPage: "chained_return",
        stepsLocation: "po_annotated",
        poGranularity: "hybrid",
        poStepNaming: "verb_params",
        pageTransitionReturn: "new_page_instance",
        testBasePoInjection: "fields_in_base",
        locatorStyle: "data_testid",
        assertInPo: "true",
      },
      code: `@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    loginPage.openPage()
            .fillAndSubmitForm("user1", "password1")
            .shouldHaveWelcomeMessage("Welcome, user1!");
}`,
    },
    {
      id: "negative-po",
      section: "canon",
      title: "Negative — PO + assert в PO",
      summary: "Канон smoke negative: атомы PO, shouldHave* с @Step",
      source: "stacks/java-spring/tests/.../LoginTests.java",
      rag: ["test-pyramid", "po-step"],
      vector: {
        testStyle: "page_object",
        poFluent: "true",
        stepsLocation: "po_annotated",
        poGranularity: "hybrid",
        assertInPo: "true",
        locatorStyle: "data_testid",
      },
      code: `@Test
@DisplayName("Wrong password shows readable error")
void shouldShowErrorWhenPasswordIsWrong() {
    loginPage.openPage()
            .typeUsername("user1")
            .typePassword("wrongpassword")
            .submitExpectingError()
            .shouldHaveErrorMessage("Wrong login or password");
}`,
    },
    {
      id: "negative-raw",
      section: "negative",
      title: "Raw Selenide — без PO и шагов",
      summary: "Ladder ethalon: wrongPasswordAuthorizationTest",
      source: "ADR 002 · _ethalon/ladder/LoginTests.java",
      rag: ["test-negative", "test-style-ladder"],
      vector: {
        testStyle: "raw_selenide",
        stepsLocation: "none",
        allureListenerMode: "global_off",
        assertInPo: "false",
      },
      code: `@Test
void wrongPasswordAuthorizationTest() {
    open("/login");
    $("[data-testid='login-input']").setValue("user1");
    $("[data-testid='password-input']").setValue("wrong");
    $("[data-testid='submit-button']").click();
    $("[data-testid='error-message']").shouldHave(text("Wrong login or password"));
}`,
    },
    {
      id: "inline-nested",
      section: "negative",
      title: "Inline Allure.step — nested",
      summary: "Ladder: emptyPasswordAuthorizationTest · block_nested",
      source: "ADR 002 · _ethalon/ladder/LoginTests.java",
      rag: ["test-negative", "test-style-ladder"],
      builderPreset: "negative-inline",
      vector: {
        testStyle: "inline_steps",
        stepsLocation: "test_allure_step",
        stepsNesting: "nested",
        stepsInlineSyntax: "block_nested",
        allureListenerMode: "global_off",
        assertInPo: "false",
      },
      code: `@Test
void emptyPasswordAuthorizationTest() {
    Allure.step("Validate empty password", () -> {
        Allure.step("Open login page", () -> open("/login"));
        Allure.step("Submit", () -> {
            $("[data-testid='login-input']").setValue("user1");
            $("[data-testid='submit-button']").click();
        });
    });
    $("[data-testid='error-message']").shouldHave(text("Password is required"));
}`,
    },
    {
      id: "selenide-listener",
      section: "steps",
      title: "AllureSelenide listener — per-test ON",
      summary: "Ladder: emptyLoginAuthorizationTest · без ручных Allure.step",
      source: "ADR 002 · _ethalon/ladder/LoginTests.java",
      rag: ["allure-selenide-listener", "test-style-ladder"],
      vector: {
        testStyle: "raw_selenide",
        stepsLocation: "selenide_listener",
        allureListenerMode: "per_test_on",
      },
      code: `@Test
@EnableAllureSelenideListener
void emptyLoginAuthorizationTest() {
    open("/login");
    $("[data-testid='submit-button']").click();
    $("[data-testid='error-message']").shouldBe(visible);
    // шаги Selenide → Allure автоматически
}`,
    },
    {
      id: "testops-manual",
      section: "steps",
      title: "TestOps manual — только Allure.step",
      summary: "Ladder: shortLoginAuthorizationTest · @Manual · без браузера",
      source: "ADR 002 · _ethalon/ladder/LoginTests.java",
      rag: ["test-manual", "test-style-ladder"],
      vector: {
        testStyle: "inline_steps",
        stepsLocation: "test_allure_step",
        stepsNesting: "scenario_only",
      },
      code: `@Test
@Manual
@AllureId("12345")
void shortLoginAuthorizationTest() {
    Allure.step("Проверить требования к полю login");
    Allure.step("Проверить требования к полю password");
    // exploratory / TestOps — без Selenide
}`,
    },
    {
      id: "po-explicit",
      section: "po",
      title: "PO — явные шаги (не fluent)",
      summary: "po.fluent=false · отдельные вызовы + homePage",
      source: "ADR 002 · explicit multi-step",
      rag: ["po-fluent"],
      vector: {
        testStyle: "page_object",
        poFluent: "false",
        poCrossPage: "explicit_instance",
        stepsLocation: "po_annotated",
        pageTransitionReturn: "new_page_instance",
      },
      code: `loginPage.openPage();
loginPage.typeUsername("user1");
loginPage.typePassword("password1");
HomePage homePage = loginPage.submit();
homePage.shouldHaveWelcomeMessage("Welcome, user1!");`,
    },
    {
      id: "po-granularity",
      section: "po",
      title: "PO granularity — hybrid",
      summary: "compose fillAndSubmit + атомы для negative",
      source: "stacks/java-spring/tests/.../LoginPage.java",
      rag: ["po-fluent", "po-step"],
      vector: {
        poGranularity: "hybrid",
        poStepNaming: "verb_params",
        pageTransitionReturn: "new_page_instance",
        testBasePoInjection: "fields_in_base",
      },
      code: `// compose — happy path:
@Step("Fill and submit form")
public HomePage fillAndSubmitForm(String username, String password) { ... }

// атомы — negative:
loginPage.openPage()
        .typeUsername("user1")
        .submitExpectingError()
        .shouldHaveErrorMessage("Password is required");`,
    },
    {
      id: "locators-canonical",
      section: "po",
      title: "Локаторы — data-testid",
      summary: "Канон po-locators · private final в PO",
      source: "stacks/java-spring/tests/.../LoginPage.java",
      rag: ["po-locators"],
      vector: {
        locatorStyle: "data_testid",
      },
      code: `private final SelenideElement loginInput = $("[data-testid='login-input']");
private final SelenideElement passwordInput = $("[data-testid='password-input']");
private final SelenideElement submitButton = $("[data-testid='submit-button']");`,
    },
    {
      id: "locators-antipattern",
      section: "po",
      title: "Локаторы — anti-pattern",
      summary: "css class / by text — не рекомендуется (po-locators Don't)",
      source: "docs/rag/e2e/po-locators.md",
      rag: ["po-locators"],
      vector: {
        locatorStyle: "css_class",
      },
      code: `// Don't — хрупко при смене вёрстки:
private final SelenideElement loginInput = $(".login-form__input");

// Don't — нестабильный текст:
private final SelenideElement submit = $(byText("Sign in"));`,
    },
    {
      id: "logout-localstorage",
      section: "setup",
      title: "Logout — localStorage shortcut",
      summary: "API login + fluent chain logout",
      source: "stacks/java-spring/tests/.../HomePage.java",
      rag: ["test-storage-shortcut", "test-logout-flow"],
      vector: {
        testStyle: "page_object",
        poFluent: "true",
        storageShortcut: "local_storage",
        testSuite: "logout",
      },
      code: `homePage.openPageWithLocalStorageAuthentication("user1", "password1")
        .clickLogoutButton();`,
    },
    {
      id: "style-ladder",
      section: "ladder",
      title: "Style ladder — один класс, разные методы",
      summary: "Только ethalon + RAG · не для production CI",
      source: "ADR 002 § Учебная градация",
      rag: ["test-style-ladder"],
      vector: {
        testStyle: "style_ladder",
        stepsLocation: "hybrid",
        assertInPo: "mixed",
      },
      code: `// _ethalon/ladder/LoginTests — учебный класс:
//   shouldLoginWithValidCredentials      → page_object + po_annotated
//   wrongPasswordAuthorizationTest       → raw_selenide + steps none
//   emptyPasswordAuthorizationTest       → inline nested Allure.step
//   emptyLoginAuthorizationTest          → selenide_listener
//   shortLoginAuthorizationTest          → TestOps @Manual`,
    },
    {
      id: "taxonomy",
      section: "meta",
      title: "Таксономия — @Layer / @Epic / @Severity",
      summary: "Allure + pyramid labels на классе и методе",
      source: "stacks/java-spring/tests/.../LoginTests.java",
      rag: ["test-taxonomy", "test-pyramid"],
      vector: {
        layerAnnotation: "true",
        epicFeature: "true",
        severityAnnotations: "true",
        useDisplayName: "junit",
      },
      code: `@Layer("e2e")
@Epic("Authentication")
@Feature("Login")
@DisplayName("Login")
class LoginTests extends TestBase {

    @Test
    @Tag("smoke")
    @Severity(SeverityLevel.CRITICAL)
    @DisplayName("User is logged in with valid credentials")
    void shouldLoginWithValidCredentials() { ... }
}`,
    },
  ],
};
