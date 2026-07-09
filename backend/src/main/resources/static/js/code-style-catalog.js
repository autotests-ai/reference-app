/**
 * Human-facing catalog for code-style-explorer (≠ test-params-map vector axes).
 * Каждая тема — паттерн ADR 002 + vector overlay для autotests-builder (?catalog=<id>).
 */
window.resolveRagChunkPath = function (id) {
  if (id === "e2e-config-keys") return "docs/rag/config/config-keys.md";
  if (id === "e2e-layers") return "docs/rag/testing/layers.md";
  if (id.indexOf("hdr-") === 0) return "docs/rag/testing-header/" + id + ".md";
  if (id.indexOf("alr-") === 0) return "docs/rag/analytics/" + id + ".md";
  if (
    id === "cfg-env-profile" ||
    id === "cfg-base-url" ||
    id === "gen-python-policy" ||
    id === "ci-workflow-ethalon" ||
    id === "ci-gradle-args"
  ) {
    return "docs/rag/config/" + id + ".md";
  }
  return "docs/rag/testing/" + id + ".md";
};

window.codeStyleCatalog = {
  version: "1.5.3",
  sections: [
    { id: "canon", title: "Канон" },
    { id: "test_style", title: "Стили теста" },
    { id: "steps", title: "Allure steps" },
    { id: "manual", title: "Manual / TestOps" },
    { id: "po", title: "Форма PO" },
    { id: "setup", title: "Setup / logout" },
    { id: "ladder", title: "Учебный ladder" },
    { id: "meta", title: "Таксономия", collapsed: true },
  ],
  topics: [
    {
      id: "canon-smoke",
      section: "canon",
      title: "Канон LoginTests — Page Object",
      summary: "shouldLoginWithValidCredentials · fluent chain · assert в PO",
      source: "stacks/java-spring/tests/src/test/java/tests/LoginTests.java",
      rag: ["test-pyramid", "po-fluent", "po-step"],
      builderPreset: "smoke-local",
      vector: {
        testStyle: "page_object",
        poFluent: "true",
        poCrossPage: "chained_return",
        stepsLocation: "po_annotated",
        poGranularity: "scenario",
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
      id: "negative-raw",
      section: "test_style",
      title: "Raw Selenide — без PO и шагов",
      summary: "shouldLoginWithValidCredentials · test.style=raw_selenide · steps none",
      source: "ADR 002 · _ethalon/ladder/LoginTests.java",
      rag: ["test-negative", "test-style-ladder"],
      vector: {
        testStyle: "raw_selenide",
        stepsLocation: "none",
        allureListenerMode: "global_off",
        assertInPo: "false",
      },
      code: `@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    open("/login");
    $("[data-testid='login-input']").setValue("user1");
    $("[data-testid='password-input']").setValue("password1");
    $("[data-testid='submit-button']").click();
    $("[data-testid='welcome-message']").shouldHave(text("Welcome, user1!"));
}`,
    },
    {
      id: "inline-nested",
      section: "test_style",
      title: "Inline step — scenario",
      summary: "shouldLoginWithValidCredentials · Fill and submit form · block_nested + Selenide",
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
      code: `// import static io.qameta.allure.Allure.step;
@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    step("Open login page", () -> open("/login"));
    step("Fill and submit form", () -> {
        step("Type username", () ->
                $("[data-testid='login-input']").setValue("user1"));
        step("Type password", () ->
                $("[data-testid='password-input']").setValue("password1"));
        step("Click submit", () ->
                $("[data-testid='submit-button']").click());
    });
    step("Verify welcome message", () ->
            $("[data-testid='welcome-message']").shouldHave(text("Welcome, user1!")));
}`,
    },
    {
      id: "inline-arrow-oneline",
      section: "test_style",
      title: "Inline step — steps / inline",
      summary: "shouldLoginWithValidCredentials · 5 flat step() · arrow_oneline + Selenide",
      source: "ADR 002 · inline ladder",
      rag: ["test-negative"],
      vector: {
        testStyle: "inline_steps",
        stepsLocation: "test_allure_step",
        stepsNesting: "scenario_only",
        stepsInlineSyntax: "arrow_oneline",
        allureListenerMode: "global_off",
      },
      code: `// import static io.qameta.allure.Allure.step;
@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    step("Open login page", () -> open("/login"));
    step("Type username", () -> $("[data-testid='login-input']").setValue("user1"));
    step("Type password", () -> $("[data-testid='password-input']").setValue("password1"));
    step("Click submit", () -> $("[data-testid='submit-button']").click());
    step("Verify welcome message", () ->
            $("[data-testid='welcome-message']").shouldHave(text("Welcome, user1!")));
}`,
    },
    {
      id: "selenide-listener",
      section: "steps",
      title: "AllureSelenide listener — global @BeforeAll",
      summary: "shouldLoginWithValidCredentials · SelenideLogger.addListener в @BeforeAll",
      source: "AllureSelenideListeners.java · TestBase.java",
      rag: ["allure-selenide-listener", "test-style-ladder"],
      vector: {
        testStyle: "raw_selenide",
        stepsLocation: "selenide_listener",
        allureListenerMode: "global_on",
      },
      code: `import com.codeborne.selenide.logevents.SelenideLogger;
import io.qameta.allure.selenide.AllureSelenide;
import org.junit.jupiter.api.BeforeAll;

// TestBase @BeforeAll (enableAllureSelenideListener=true в config)
@BeforeAll
static void enableAllureSelenideListener() {
    SelenideLogger.addListener("AllureSelenide",
            new AllureSelenide()
                    .screenshots(false)
                    .savePageSource(false));
}

@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    open("/login");
    $("[data-testid='login-input']").setValue("user1");
    $("[data-testid='password-input']").setValue("password1");
    $("[data-testid='submit-button']").click();
    $("[data-testid='welcome-message']").shouldHave(text("Welcome, user1!"));
}`,
      reportExample: {
        lead: "AllureSelenide пишет в отчёт технические логи Selenide — не «Open login page», как в step(). Человекочитаемые имена — только через step() или @Step в PO.",
        tree: [
          { level: 0, label: "shouldLoginWithValidCredentials", kind: "test" },
          { level: 1, label: "open(/login)", kind: "step" },
          { level: 1, label: '[$("[data-testid=\'login-input\')] set value(user1)', kind: "step" },
          { level: 1, label: '[$("[data-testid=\'password-input\')] set value(password1)', kind: "step" },
          { level: 1, label: '[$("[data-testid=\'submit-button\')] click()', kind: "step" },
          { level: 1, label: '[$("[data-testid=\'welcome-message\')] should have(text "Welcome, user1!")', kind: "step" },
        ],
      },
    },
    {
      id: "testops-manual",
      section: "manual",
      title: "Manual — steps / inline",
      summary: "shouldLoginWithValidCredentials · 5 flat step() · без Selenide",
      source: "ADR 002 · test-manual · TestOps @AllureId",
      rag: ["test-manual", "test-style-ladder"],
      vector: {
        testStyle: "inline_steps",
        stepsLocation: "test_allure_step",
        stepsNesting: "scenario_only",
      },
      code: `// import static io.qameta.allure.Allure.step; — TestOps, без Selenide
@Test
@Manual
@AllureId("12345")
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    step("Open login page");
    step("Type username");
    step("Type password");
    step("Click submit");
    step("Verify welcome message");
}`,
    },
    {
      id: "manual-inline",
      section: "manual",
      title: "Manual — scenario",
      summary: "shouldLoginWithValidCredentials · Fill and submit form · без Selenide",
      source: "ADR 002 · test-manual · TestOps @AllureId",
      rag: ["test-manual", "test-style-ladder"],
      vector: {
        testStyle: "inline_steps",
        stepsLocation: "test_allure_step",
        stepsNesting: "nested",
        stepsInlineSyntax: "block_nested",
      },
      code: `// import static io.qameta.allure.Allure.step; — TestOps, без Selenide
@Test
@Manual
@AllureId("12345")
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    step("Open login page");
    step("Fill and submit form", () -> {
        step("Type username");
        step("Type password");
        step("Click submit");
    });
    step("Verify welcome message");
}`,
    },
    {
      id: "po-atomic",
      section: "po",
      title: "PO — atomic · non-fluent",
      summary: "shouldLoginWithValidCredentials · po.granularity=atomic · po.fluent=false",
      source: "stacks/java-spring/tests/.../LoginPage.java · ADR 002",
      rag: ["po-fluent"],
      vector: {
        testStyle: "page_object",
        poGranularity: "atomic",
        poFluent: "false",
        poCrossPage: "explicit_instance",
        stepsLocation: "po_annotated",
        pageTransitionReturn: "new_page_instance",
        testBasePoInjection: "per_test_field",
      },
      code: `@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    LoginPage loginPage = new LoginPage();
    loginPage.openPage();
    loginPage.typeUsername("user1");
    loginPage.typePassword("password1");
    HomePage homePage = loginPage.submit();
    homePage.shouldHaveWelcomeMessage("Welcome, user1!");
}`,
    },
    {
      id: "po-scenario",
      section: "po",
      title: "PO granularity — scenario",
      summary: "po.granularity=scenario · один compose-метод на happy path",
      source: "stacks/java-spring/tests/.../LoginPage.java",
      rag: ["po-fluent", "po-step"],
      vector: {
        poGranularity: "scenario",
        poStepNaming: "scenario_name",
        poFluent: "true",
      },
      code: `@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    loginPage.openPage()
            .fillAndSubmitForm("user1", "password1")
            .shouldHaveWelcomeMessage("Welcome, user1!");
}

// PO — только compose:
@Step("Fill and submit form")
public HomePage fillAndSubmitForm(String username, String password) { ... }`,
    },
    {
      id: "po-step-verb-only",
      section: "po",
      title: "@Step — verb_only",
      summary: "po.step_naming=verb_only · без {параметров} в имени шага",
      source: "stacks/java-spring/tests/.../LoginPage.java",
      rag: ["po-step"],
      vector: {
        poStepNaming: "verb_only",
        stepsLocation: "po_annotated",
      },
      code: `// shouldLoginWithValidCredentials — typePassword в цепочке:
@Step("Type password")
public LoginPage typePassword(String password) {
    passwordInput.setValue(password);
    return this;
}`,
    },
    {
      id: "po-factory",
      section: "po",
      title: "PO factory — Pages.login()",
      summary: "testbase.po_fields=factory · static entry point",
      source: "ADR 002 · e2e-layers",
      rag: ["e2e-layers"],
      vector: {
        testBasePoInjection: "factory",
        testStyle: "page_object",
        poFluent: "true",
      },
      code: `public final class Pages {
    public static LoginPage login() {
        return new LoginPage();
    }
}

@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    Pages.login().openPage()
            .fillAndSubmitForm("user1", "password1")
            .shouldHaveWelcomeMessage("Welcome, user1!");
}`,
    },
    {
      id: "po-per-test-field",
      section: "po",
      title: "PO field — в test class",
      summary: "testbase.po_fields=per_test_field · не в TestBase",
      source: "ADR 002 · e2e-layers",
      rag: ["e2e-layers"],
      vector: {
        testBasePoInjection: "per_test_field",
        testStyle: "page_object",
      },
      code: `class LoginTests extends TestBase {
    private final LoginPage loginPage = new LoginPage();

    @Test
    @DisplayName("User is logged in with valid credentials")
    void shouldLoginWithValidCredentials() {
        loginPage.openPage()
                .fillAndSubmitForm("user1", "password1")
                .shouldHaveWelcomeMessage("Welcome, user1!");
    }
}`,
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
      code: `// LoginPage — shouldLoginWithValidCredentials
private final SelenideElement loginInput = $("[data-testid='login-input']");
private final SelenideElement passwordInput = $("[data-testid='password-input']");
private final SelenideElement submitButton = $("[data-testid='submit-button']");`,
    },
    {
      id: "locators-antipattern",
      section: "po",
      title: "Локаторы — anti-pattern",
      summary: "css class / by text — не рекомендуется (po-locators Don't)",
      source: "docs/rag/testing/po-locators.md",
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
      id: "assert-in-test",
      section: "po",
      title: "Assert в тесте — не в PO",
      summary: "shouldLoginWithValidCredentials · assert.in_po=false · should* в теле теста",
      source: "ADR 002 · ladder / assert.in_po axis",
      rag: ["test-negative", "po-step"],
      vector: {
        testStyle: "page_object",
        poFluent: "true",
        stepsLocation: "po_annotated",
        assertInPo: "false",
        testBasePoInjection: "per_test_field",
      },
      code: `@Test
@DisplayName("User is logged in with valid credentials")
void shouldLoginWithValidCredentials() {
    LoginPage loginPage = new LoginPage();
    loginPage.openPage()
            .typeUsername("user1")
            .typePassword("password1")
            .submit();
    // assert.in_po=false — проверка здесь, не shouldHaveWelcomeMessage() в PO:
    $("[data-testid='welcome-message']").shouldHave(text("Welcome, user1!"));
}`,
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
      id: "logout-form",
      section: "setup",
      title: "Logout — login через форму",
      summary: "test.storage_shortcut=false · классический UI login",
      source: "RAG test-logout-flow",
      rag: ["test-logout-flow"],
      vector: {
        testStyle: "page_object",
        poFluent: "true",
        storageShortcut: "false",
        testSuite: "logout",
      },
      code: `loginPage.openPage()
        .fillAndSubmitForm("user1", "password1")
        .clickLogoutButton();`,
    },
    {
      id: "logout-both",
      section: "setup",
      title: "Logout — form + localStorage",
      summary: "test.storage_shortcut=both · LogoutTests оба сценария",
      source: "RAG test-logout-flow",
      rag: ["test-logout-flow", "test-storage-shortcut"],
      vector: {
        testStyle: "page_object",
        poFluent: "mixed",
        storageShortcut: "both",
        testSuite: "logout",
      },
      code: `// successfulLogoutTest — форма:
loginPage.openPage().fillAndSubmitForm("user1", "password1");
homePage.clickLogoutButton();

// successfulLogoutWithLocalStorageAuthenticationTest — shortcut:
homePage.openPageWithLocalStorageAuthentication("user1", "password1")
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
      code: `// Один сценарий — shouldLoginWithValidCredentials — в разных стилях:
//   page_object + po_annotated     → canon-smoke
//   raw_selenide + steps none      → negative-raw
//   inline steps / inline            → inline-arrow-oneline
//   inline scenario (block_nested)   → inline-nested
//   selenide_listener + global_on    → selenide-listener
//   @Manual steps / inline           → testops-manual
//   @Manual scenario                 → manual-inline`,
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
