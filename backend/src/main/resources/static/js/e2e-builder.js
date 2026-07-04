import { initPlaqueTemplates, clonePlaqueTemplate } from './plaque-field.js';

(async function () {
  await initPlaqueTemplates();

  var map = window.e2eParamsMap;
  if (!map) return;

  var STORAGE_KEY = "e2e-builder-v1";
  var values = {};
  var activePresetId = null;
  var activeTab = "gradle";
  var outputs = { gradle: "", json: "", prompt: "" };
  var OUTPUT_TABS = [
    { id: "prompt", label: "Agent prompt", barLabel: "Agent" },
    { id: "gradle", label: "Gradle", barLabel: "Gradle" },
    { id: "json", label: "JSON vector", barLabel: "JSON" },
  ];

  var presetsRoot = document.getElementById("e2e-presets");
  var paramsRoot = document.getElementById("e2e-params");
  var conflictsEl = document.getElementById("e2e-conflicts");
  var outputEl = document.getElementById("e2e-output");
  var hashEl = document.getElementById("e2e-hash");
  var terminalEl = document.getElementById("e2e-terminal");
  var copyBtn = document.getElementById("e2e-copy");
  var resetBtn = document.getElementById("e2e-reset");
  var statusEl = document.getElementById("e2e-status");
  var tabsRoot = document.getElementById("e2e-tabs");
  var REMOTE_HUB_TOGGLE_IDS = ["enableVnc", "enableVideo", "enableHar", "enableAllureSelenideListener"];
  var TOGGLE_ABBR = {
    enableVnc: "vnc",
    enableVideo: "video",
    enableHar: "har",
    enableAllureSelenideListener: "listener",
  };
  var TOGGLE_ABBR_BOOL4 = {
    enableVnc: "vnc",
    enableVideo: "vid",
    enableHar: "har",
    enableAllureSelenideListener: "lst",
  };

  function paramById(id) {
    return map.params.find(function (p) {
      return p.id === id;
    });
  }

  function defaultValue(param) {
    if (param.type === "checkbox") return param.default ? param.default.slice() : [];
    return param.default !== undefined ? String(param.default) : "";
  }

  function initValues() {
    map.params.forEach(function (param) {
      values[param.id] = defaultValue(param);
    });
  }

  function matchesShowWhen(param) {
    if (!param.showWhen) return true;
    return Object.keys(param.showWhen).every(function (key) {
      var allowed = param.showWhen[key];
      var current = values[key];
      if (Array.isArray(current)) return false;
      return allowed.indexOf(current) !== -1;
    });
  }

  function suiteClassFilter() {
    var suite = values.testSuite;
    return map.suiteClassMap[suite] || "LoginTests";
  }

  /** Env suffix: visual suite → run profile `*_visual`, not a separate @Layer. */
  function configEnvSuffix() {
    if (values.testSuite === "visual") return "visual";
    return values.pyramidLayer;
  }

  function configEnvName() {
    if (!values.configStand) return "local_e2e";
    return values.configStand + "_" + configEnvSuffix();
  }

  function gradleTestFilter() {
    if (values.testSuite === "visual") return null;
    var cls = suiteClassFilter();
    if (cls === "*") return "tests.*";
    if (cls.charAt(0) === "*") return cls;
    var method = values.testMethod;
    if (method) return "tests." + cls + "." + method;
    return "tests." + cls;
  }

  function buildGradleBin() {
    return values.gradleInvoker === "gradle" ? "gradle" : "./gradlew";
  }

  function syncAllureListenerFromMode() {
    if (values.allureListenerMode === "global_on") {
      values.enableAllureSelenideListener = "true";
    } else if (values.allureListenerMode === "global_off") {
      values.enableAllureSelenideListener = "false";
    }
    syncControlButtons("enableAllureSelenideListener", values.enableAllureSelenideListener);
  }

  function shouldUseSelect(param) {
    if (param.type === "select") return true;
    if (param.id === "configStand" || param.id === "pyramidLayer" || param.id === "testSuite") return true;
    if (param.options && param.options.length >= 6) return true;
    return false;
  }

  function radioUiMode(param) {
    if (!param.options || !param.options.length) return "default";
    if (param.options.length === 1) return "single";
    if (shouldUseSelect(param)) return "select";
    if (param.options.length === 2) return "toggle";
    if (param.options.length <= 5) return "chips";
    return "select";
  }

  function syncControlButtons(paramId, value) {
    document.querySelectorAll('[data-param-id="' + paramId + '"]').forEach(function (node) {
      if (node.classList.contains("plaque-field--toggle")) {
        var on = value === "true";
        node.classList.toggle("plaque-field--toggle-on", on);
        node.setAttribute("aria-pressed", on ? "true" : "false");
        return;
      }
      if (node.classList.contains("plaque-field-flagstrip__item")) {
        var flagOn = value === "true";
        node.classList.toggle("plaque-field-flagstrip__item--on", flagOn);
        node.setAttribute("aria-pressed", flagOn ? "true" : "false");
        return;
      }
      node.querySelectorAll(".plaque-field-seg__btn, .plaque-field-option").forEach(function (btn) {
        var active = btn.dataset.value === value;
        btn.classList.toggle("plaque-field-seg__btn--on", active && btn.classList.contains("plaque-field-seg__btn"));
        btn.classList.toggle("plaque-field-option--on", active && btn.classList.contains("plaque-field-option"));
        if (btn.hasAttribute("aria-pressed")) btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  }

  function createParamWrap(param) {
    var wrap = document.createElement("div");
    wrap.className = "e2e-builder__param";
    wrap.dataset.paramId = param.id;
    if (!matchesShowWhen(param)) wrap.classList.add("e2e-builder__param--hidden");
    return wrap;
  }

  function isBooleanToggleParam(param) {
    if (param.type !== "radio" || radioUiMode(param) !== "toggle") return false;
    if (!param.options || param.options.length !== 2) return false;
    var hasTrue = false;
    var hasFalse = false;
    param.options.forEach(function (opt) {
      if (opt.value === "true") hasTrue = true;
      if (opt.value === "false") hasFalse = true;
    });
    return hasTrue && hasFalse;
  }

  function isRemoteHubToggleParam(param) {
    return REMOTE_HUB_TOGGLE_IDS.indexOf(param.id) !== -1;
  }

  function plaqueLabelEl(param, opts, root) {
    opts = opts || {};
    var label = root
      ? root.querySelector('.plaque-field__label')
      : document.createElement('span');
    if (!root) {
      label.className = 'plaque-field__label';
    }
    label.textContent = opts.abbr || param.label;
    label.title = param.warn || param.label;
    return label;
  }

  function toggleSegButtonLabel(opt) {
    return opt.label;
  }

  function renderBooleanTogglePlaque(param, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var value = values[param.id];
    var isOn = value === "true";

    var btn = clonePlaqueTemplate("plaque-field-toggle-head");
    btn.classList.remove("plaque-field--toggle-on");
    if (isOn) btn.classList.add("plaque-field--toggle-on");
    btn.dataset.paramId = param.id;
    btn.dataset.testid = "e2e-toggle-" + param.id;
    btn.setAttribute("aria-pressed", isOn ? "true" : "false");

    var titleParts = [param.label];
    if (param.warn) titleParts.push(param.warn);
    titleParts.push("= " + value);
    btn.title = titleParts.join(" · ");

    plaqueLabelEl(param, { abbr: compact && TOGGLE_ABBR[param.id] ? TOGGLE_ABBR[param.id] : undefined }, btn);

    btn.addEventListener("click", function () {
      var next = values[param.id] === "true" ? "false" : "true";
      syncControlButtons(param.id, next);
      onValueChange(param.id, next);
    });

    return btn;
  }

  function renderBooleanFlagstripItem(param, opts) {
    opts = opts || {};
    var abbrMap = opts.bool4 ? TOGGLE_ABBR_BOOL4 : TOGGLE_ABBR;
    var value = values[param.id];
    var isOn = value === "true";

    var btn = clonePlaqueTemplate("plaque-field-flagstrip-vnc");
    btn.classList.remove("plaque-field-flagstrip__item--on");
    if (isOn) btn.classList.add("plaque-field-flagstrip__item--on");
    btn.dataset.paramId = param.id;
    btn.dataset.testid = "e2e-flagstrip-" + param.id;
    btn.setAttribute("aria-pressed", isOn ? "true" : "false");

    var titleParts = [param.label];
    if (param.warn) titleParts.push(param.warn);
    titleParts.push("= " + value);
    btn.title = titleParts.join(" · ");

    btn.querySelector(".plaque-field-flagstrip__abbr").textContent = abbrMap[param.id] || param.label;

    btn.addEventListener("click", function () {
      var next = values[param.id] === "true" ? "false" : "true";
      syncControlButtons(param.id, next);
      onValueChange(param.id, next);
    });

    return btn;
  }

  function renderSegTogglePlaque(param) {
    var plaque = clonePlaqueTemplate("plaque-field-seg");
    plaque.dataset.paramId = param.id;
    plaque.dataset.testid = "e2e-seg-" + param.id;

    plaqueLabelEl(param, {}, plaque);

    var seg = plaque.querySelector(".plaque-field-seg");
    seg.setAttribute("aria-label", param.label);
    var btnTemplate = seg.querySelector(".plaque-field-seg__btn");
    seg.replaceChildren();

    param.options.forEach(function (opt) {
      var btn = btnTemplate.cloneNode(true);
      btn.type = "button";
      btn.className = "plaque-field-seg__btn";
      btn.dataset.value = opt.value;
      btn.textContent = toggleSegButtonLabel(opt);
      if (opt.hint) btn.title = opt.hint;
      if (values[param.id] === opt.value) {
        btn.classList.add("plaque-field-seg__btn--on");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.classList.remove("plaque-field-seg__btn--on");
        btn.setAttribute("aria-pressed", "false");
      }
      btn.addEventListener("click", function () {
        if (values[param.id] === opt.value) return;
        syncControlButtons(param.id, opt.value);
        onValueChange(param.id, opt.value);
      });
      seg.appendChild(btn);
    });

    return plaque;
  }

  function renderToggleButtons(param, wrap) {
    if (isBooleanToggleParam(param)) {
      wrap.appendChild(renderBooleanTogglePlaque(param));
    } else {
      wrap.appendChild(renderSegTogglePlaque(param));
    }
    return wrap;
  }

  function renderToggleGrid(params) {
    var visible = params.filter(function (param) {
      return matchesShowWhen(param);
    });
    if (!visible.length) return document.createDocumentFragment();
    if (visible.length === 1) return renderParam(visible[0]);

    var wrap = document.createElement("div");
    wrap.className = "e2e-builder__param e2e-builder__param--toggle-grid";

    var toggles = clonePlaqueTemplate("plaque-field-toggles");
    toggles.setAttribute("aria-label", "Boolean parameters");

    visible.forEach(function (param) {
      toggles.appendChild(renderBooleanTogglePlaque(param));
    });

    wrap.appendChild(toggles);
    return wrap;
  }

  function renderRemoteHubToggleGrid() {
    var visible = REMOTE_HUB_TOGGLE_IDS.map(paramById).filter(function (param) {
      return param && isBooleanToggleParam(param) && matchesShowWhen(param);
    });
    if (!visible.length) return null;

    var wrap = document.createElement("div");
    wrap.className = "e2e-builder__param e2e-builder__param--remote-hub-toggles";
    wrap.dataset.testid = "e2e-remote-hub-toggles";

    var strip = clonePlaqueTemplate("plaque-field-flagstrip");
    strip.setAttribute("aria-label", "Remote hub");
    strip.replaceChildren();

    visible.forEach(function (param) {
      strip.appendChild(renderBooleanFlagstripItem(param, { bool4: true }));
    });

    wrap.appendChild(strip);
    return wrap;
  }

  function renderOptionButtons(param, wrap, multi) {
    if (multi) {
      var list = clonePlaqueTemplate("plaque-field-checklist");
      list.replaceChildren();
      var itemTemplate = clonePlaqueTemplate("plaque-field-checklist-item");

      param.options.forEach(function (opt) {
        var item = itemTemplate.cloneNode(true);
        var row = item.querySelector(".plaque-field-check");
        var input = item.querySelector(".plaque-field-check__input");
        input.dataset.value = opt.value;
        input.checked = (values[param.id] || []).indexOf(opt.value) !== -1;
        if (opt.hint) input.title = opt.hint;
        item.querySelector("span").textContent = opt.label;

        input.addEventListener("change", function () {
          var set = new Set(values[param.id] || []);
          if (input.checked) set.add(opt.value);
          else set.delete(opt.value);
          onValueChange(param.id, Array.from(set));
        });

        list.appendChild(item);
      });

      wrap.appendChild(list);
      return wrap;
    }

    var list = document.createElement("div");
    list.className = "plaque-field-list plaque-field-list--dense";
    list.setAttribute("role", "radiogroup");
    list.setAttribute("aria-label", param.label);
    var optionTemplate = clonePlaqueTemplate("plaque-field-option");

    param.options.forEach(function (opt) {
      var btn = optionTemplate.cloneNode(true);
      btn.dataset.value = opt.value;
      btn.textContent = opt.label;
      if (opt.hint) btn.title = opt.hint;
      if (values[param.id] === opt.value) {
        btn.classList.add("plaque-field-option--on");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.classList.remove("plaque-field-option--on");
        btn.setAttribute("aria-pressed", "false");
      }
      btn.addEventListener("click", function () {
        if (values[param.id] === opt.value) return;
        syncControlButtons(param.id, opt.value);
        onValueChange(param.id, opt.value);
      });
      list.appendChild(btn);
    });

    wrap.appendChild(list);
    return wrap;
  }

  function anyAttachEnabled() {
    return (
      values.attachBrowserConsoleLogs === "true" ||
      values.attachPageSource === "true" ||
      values.attachLastScreenshot === "true" ||
      values.attachVideo === "true" ||
      values.attachHarLogs === "true"
    );
  }

  function detectConflicts() {
    var issues = [];

    if (values.allureReportMode === "none") {
      if (anyAttachEnabled()) {
        issues.push("allureReportMode=none — отключи attach* (results не пишутся)");
      }
      if (values.enableAllureSelenideListener === "true") {
        issues.push("allureReportMode=none — отключи enableAllureSelenideListener");
      }
      if (values.testopsEnabled === "true") {
        issues.push("allureReportMode=none + testopsEnabled=true — TestOps требует results");
      }
    }
    if (values.testopsEnabled === "true" && values.allureReportMode === "allure2") {
      issues.push("TestOps + allure2 — рекомендуется allureReportMode=allure3 (канон CI)");
    }

    if (values.attachVideo === "true" && values.enableVideo !== "true") {
      issues.push("attachVideo=true обычно требует enableVideo=true на remote hub");
    }
    if (values.attachHarLogs === "true") {
      issues.push("attachHarLogs=true — stub в Attachments, прогон упадёт в @AfterEach");
    }
    if (values.stepsLocation === "selenide_listener" && values.enableAllureSelenideListener !== "true") {
      issues.push("steps.location=selenide_listener — включи AllureSelenide listener");
    }
    if (values.stepsLocation === "po_annotated" && values.testStyle === "raw_selenide") {
      issues.push("raw_selenide + po_annotated — шаги в PO не вызовутся без PO");
    }
    if (values.testSuite === "lang-toggle" && values.configStand === "one-page-form_prod") {
      issues.push("LangToggleTests нужен local HTTP (frontend/ на :3000), не prod profile");
    }
    if (values.testSuite === "login-embed" && values.configStand === "one-page-form_prod") {
      issues.push("LoginEmbedTests нужен local HTTP (frontend/ на :3000), не prod profile");
    }
    if (values.testSuite === "visual" && values.pyramidLayer !== "e2e") {
      issues.push("@Tag(visual): Test layer должен быть e2e (@Layer(\"e2e\")), не " + values.pyramidLayer);
    }
    if (values.testSuite === "visual" && values.configStand === "one-page-form_prod") {
      issues.push("@Tag(visual) нужен local HTTP (frontend/ на :3000), не prod profile");
    }
    if (values.testMethod) {
      var methodOpt = paramById("testMethod").options.find(function (o) {
        return o.value === values.testMethod;
      });
      if (methodOpt && methodOpt.suite && methodOpt.suite !== values.testSuite) {
        issues.push("testMethod относится к " + methodOpt.suite + ", а выбран suite " + values.testSuite);
      }
    }
    if (values.parallelism !== "1" && values.testSuite === "visual" && values.junitParallelMode === "same_thread") {
      issues.push("@Tag(visual) @SAME_THREAD: parallelism > 1 даёт выигрыш только в suite, не внутри класса");
    }

    return issues;
  }

  function renderConflicts() {
    var issues = detectConflicts();
    if (!issues.length) {
      conflictsEl.innerHTML = "";
      return;
    }
    conflictsEl.innerHTML =
      '<p class="callout__title">Конфликты / предупреждения</p><ul class="callout__list">' +
      issues.map(function (i) {
        return "<li>" + i + "</li>";
      }).join("") +
      "</ul>";
  }

  function simpleHash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  }

  function maskValue(param, val) {
    if (param.sensitive && val) return "***";
    return val;
  }

  function flatVector() {
    var vector = {
      _version: map.version,
      _label: values.benchmarkLabel || null,
      _hash: null,
    };
    map.params.forEach(function (param) {
      if (!matchesShowWhen(param)) return;
      vector[param.id] = maskValue(param, values[param.id]);
    });
    vector._hash = simpleHash(JSON.stringify(vector));
    return vector;
  }

  function buildGradleFlags() {
    var flags = [];
    if (values.configStand && configEnvSuffix()) {
      flags.push({ key: "env", value: configEnvName() });
    }
    map.params.forEach(function (param) {
      if (!param.gradle || !param.gradleKey) return;
      if (!matchesShowWhen(param)) return;
      if (param.id === "configStand" || param.id === "pyramidLayer") return;
      var val = values[param.id];
      if (val === "" || val === null || val === undefined) return;
      if (Array.isArray(val) && !val.length) return;
      flags.push({ key: param.gradleKey, value: val });
    });
    flags.sort(function (a, b) {
      return a.key.localeCompare(b.key);
    });
    return flags;
  }

  function gradleFlagLines(flags) {
    return flags.map(function (flag) {
      return "  -D" + flag.key + "=" + flag.value;
    });
  }

  function joinContinuedLines(header, bodyLines) {
    var lines = [header];
    bodyLines.forEach(function (line, idx) {
      lines.push(line + (idx < bodyLines.length - 1 ? " \\" : ""));
    });
    return lines;
  }

  function allurePostStep(mode) {
    if (mode === "allure3") {
      var gradleBin = buildGradleBin();
      return (
        "\n" + gradleBin + " allureQualityGate -q\n" +
        gradleBin + " allureReport -q\n" +
        "# open build/reports/allure-report/allureReport/awesome/index.html"
      );
    }
    if (mode === "allure2") {
      return "\n# Локальный HTML (Allure 2 CLI): allure serve tests-java/build/allure-results";
    }
    return "";
  }

  function buildTestOpsShell(gradleBody, testFilter) {
    var endpoint = values.testopsEndpoint || "https://allure.autotests.cloud";
    var projectId = values.testopsProjectId || "5263";
    var tokenDisplay = values.testopsToken ? "***" : "***";
    var lines = [
      "export ALLURE_ENDPOINT='" + endpoint + "'",
      "export ALLURE_TOKEN='" + tokenDisplay + "'          # подставь локально",
      "export ALLURE_PROJECT_ID='" + projectId + "'",
      "export ALLURE_RESULTS='build/allure-results'",
    ];

    if (values.testopsTestCaseId) {
      lines.push("export TEST_CASE_ID='" + values.testopsTestCaseId + "'");
      lines.push(
        '# export ALLURE_LAUNCH_NAME="TestOps #' +
          values.testopsTestCaseId +
          ' — local"'
      );
    }

    lines.push("");
    lines.push("allurectl watch --results build/allure-results -- \\");
    lines = lines.concat(joinContinuedLines("  " + buildGradleBin() + " test \\", gradleBody));

    var mode = values.allureReportMode || "allure3";
    if (mode === "allure3") {
      lines.push("");
      lines.push("# После upload — quality gate + локальный HTML (опционально):");
      lines.push(buildGradleBin() + " allureQualityGate -q");
      lines.push(buildGradleBin() + " allureReport -q");
    }

    return lines.join("\n");
  }

  function buildGradleCommand() {
    var flags = buildGradleFlags();
    var testFilter = gradleTestFilter();
    var mode = values.allureReportMode || "allure3";
    var testopsOn = values.testopsEnabled === "true";
    var iter = parseInt(values.benchmarkIterations, 10);

    var gradleBody = gradleFlagLines(flags);
    if (values.testSuite === "visual") {
      gradleBody.push("  -DincludeTags=visual");
    } else {
      gradleBody.push("  --tests '" + testFilter + "'");
    }

    if (testopsOn) {
      return buildTestOpsShell(gradleBody, testFilter);
    }

    var gradleBin = buildGradleBin();
    var header = mode === "none" ? gradleBin + " test -q \\" : gradleBin + " test \\";
    var lines = joinContinuedLines(header, gradleBody);

    if (iter > 1) {
      var continued = gradleBody.map(function (line, idx) {
        return line + (idx < gradleBody.length - 1 ? " \\" : "");
      });
      var gradleRun = gradleBin + " test \\\n    " + continued.join("\n    ");

      lines.push("");
      lines.push(
        "# Bench: " +
          iter +
          "×" +
          (values.benchmarkWarmup === "true" ? " (+1 warmup)" : "") +
          (values.benchmarkLabel ? " label=" + values.benchmarkLabel : "")
      );
      if (values.benchmarkWarmup === "true") {
        lines.push(gradleRun + " -q || true  # warmup");
      }
      lines.push("for i in $(seq 1 " + iter + "); do");
      lines.push('  echo "run $i vector#' + simpleHash(JSON.stringify(values)) + '";');
      lines.push("  " + gradleRun + (mode === "none" ? " -q" : ""));
      lines.push("done");
      if (mode === "allure3") {
        lines.push(gradleBin + " allureQualityGate -q  # после последнего прогона");
        lines.push(gradleBin + " allureReport -q");
      }
      return lines.join("\n");
    }

    lines.push(allurePostStep(mode));
    return lines.join("\n");
  }

  function headerRagChunks() {
    if (values.testSuite !== "lang-toggle" && values.testSuite !== "login-embed") return [];
    var chunks = ["hdr-scope-4b"];
    if (values.testSuite === "lang-toggle") chunks.push("hdr-selectors");
    if (values.testSuite === "login-embed") chunks.push("hdr-behavior");
    return Array.from(new Set(chunks)).sort();
  }

  function ragChunksForSelection() {
    var chunks = new Set(["e2e-layers", "e2e-config-keys", "base-lifecycle"]);
    if (values.remoteUrl) chunks.add("remote-selenoid");
    if (
      values.attachBrowserConsoleLogs === "true" ||
      values.attachPageSource === "true" ||
      values.attachLastScreenshot === "true"
    ) {
      chunks.add("allure-attach");
    }

    if (values.allureReportMode === "allure3") chunks.add("alr-quality-gate");

    Object.keys(map.ragChunkHints || {}).forEach(function (key) {
      var hints = map.ragChunkHints[key];
      var val = values[key];
      if (hints && hints[val]) chunks.add(hints[val]);
    });

    if (values.poFluent === "true" || values.poFluent === "mixed") chunks.add("po-fluent");
    if (values.stepsLocation === "po_annotated" || values.stepsLocation === "hybrid") chunks.add("po-step");
    if (values.locatorStyle === "data_testid") chunks.add("po-locators");
    if (values.testStyle === "style_ladder") chunks.add("test-style-ladder");
    if (values.epicFeature === "true") chunks.add("test-taxonomy");

    return Array.from(chunks).sort();
  }

  function buildPrompt() {
    var vector = flatVector();
    var lines = [
      "Сгенерируй / настрой e2e-проект (Java + Selenide + JUnit 5 + Allure) со следующим вектором параметров.",
      "",
      "## Benchmark vector",
      "```json",
      JSON.stringify(vector, null, 2),
      "```",
      "",
      "## Стиль кода (обязательно)",
      "- test.style: **" + values.testStyle + "**",
      "- po.fluent: **" + values.poFluent + "**",
      "- po.cross_page_assert: **" + values.poCrossPage + "**",
      "- steps.location: **" + values.stepsLocation + "**",
    ];

    if (matchesShowWhen(paramById("stepsNesting"))) {
      lines.push("- steps.nesting: **" + values.stepsNesting + "**");
    }
    if (matchesShowWhen(paramById("stepsInlineSyntax"))) {
      lines.push("- steps.inline_syntax: **" + values.stepsInlineSyntax + "**");
    }

    lines.push(
      "- po.granularity: **" + values.poGranularity + "**",
      "- allure.report_mode: **" + values.allureReportMode + "**"
    );
    if (values.allureReportMode === "allure3") {
      lines.push(
        "- allure.quality_gate: **allureQualityGate** (rules в `allurerc.json`; known issues — `known.json`)"
      );
    }
    lines.push(
      "- allure.listener_mode: **" + values.allureListenerMode + "**",
      "- console.logToConsole: **" + values.logToConsole + "**"
    );

    if (values.testopsEnabled === "true") {
      lines.push(
        "",
        "## TestOps (CI env)",
        "- ALLURE_ENDPOINT: `" + (values.testopsEndpoint || "https://allure.autotests.cloud") + "`",
        "- ALLURE_PROJECT_ID: `" + (values.testopsProjectId || "—") + "`",
        "- ALLURE_TOKEN: env secret (не в git)",
        "- allurectl watch — см. Gradle-вкладку"
      );
    }

    if (values.testSuite === "login" || values.testSuite === "logout") {
      lines.push(
        "",
        "## Канон vs ladder ethalon",
        "- CI / pyramid: `tests-java/` — smoke `LoginTests`, `LoginFormTests`, `LoginEmbedTests`; `@Manual` на методе в `LoginTests`",
        "- Ladder code: `tests-java/src/test/java/_ethalon/ladder/` — full style ladder `LoginTests`/`LogoutTests` (`@Tag(\"ladder-ethalon\")`, `" +
          buildGradleBin() +
          " testLadderEthalon`)",
        "- RAG split: `test-pyramid` (канон), `test-style-ladder` + `test-logout-flow` (паттерны)"
      );
    }

    if (values.testSuite === "lang-toggle" || values.testSuite === "login-embed") {
      lines.push(
        "",
        "## Header coverage (ADR 003)",
        "- Preview `frontend/header.html` — не target PO",
        "- Component: `LangToggleTests` на `components.html` — hit area 36px, icon 18px",
        "- Integration: `LoginEmbedTests` на `login.html` — visible `#app-header` после mount",
        "- Slices: `./gradlew testComponent` / `./gradlew testIntegration`",
        "",
        "## Header RAG",
        headerRagChunks()
          .map(function (c) {
            return "- `docs/rag/e2e-header/" + c + ".md`";
          })
          .join("\n")
      );
    }

    if (values.testSuite === "visual") {
      lines.push(
        "",
        "## Visual baselines (UI e2e, не отдельный @Layer)",
        "- `@Layer(\"e2e\")` на классе (`LoginBaselineTests`, `LoggedInBaselineTests`); отбор — `@Tag(\"visual\")`",
        "- Gradle: `-DincludeTags=visual` (`testVisual` slice), не wildcard по классу",
        "- Env profile: `" + configEnvName() + "` — run profile `*_visual`, не Test Layer",
        "- Target: `frontend/` через `python -m http.server 3000`",
        "- `attachLastScreenshot=false` — element crop из `ScreenshotBaseline`, не full page",
        "- `-DupdateBaselines=true` — перезаписать PNG в `src/test/resources/screenshots/`"
      );
    }

    lines.push(
      "",
      "## RAG chunks",
      ragChunksForSelection().map(function (c) {
        return "- `docs/rag/e2e/" + c + ".md`";
      }).join("\n"),
      "",
      "## Gradle (из конструктора)",
      "```bash",
      buildGradleCommand(),
      "```",
      "",
      "Канон: ADR 002, `tests-java/` в template-project. Ladder ethalon — `_ethalon/ladder/`. Один тест — один стиль шагов."
    );

    return lines.join("\n");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function highlightShellLine(line) {
    var esc = escapeHtml(line);
    if (/^\s*#/.test(line)) {
      return '<span class="e2e-builder__tok-comment">' + esc + "</span>";
    }
    esc = esc.replace(/\b(export)\b/g, '<span class="e2e-builder__tok-export">$1</span>');
    esc = esc.replace(/\b(allurectl|\.\/gradlew|gradle)\b/g, '<span class="e2e-builder__tok-cmd">$1</span>');
    esc = esc.replace(/(-D[\w.]+(?:=[^\s\\']*)?)/g, '<span class="e2e-builder__tok-flag">$1</span>');
    esc = esc.replace(/\b(ALLURE_[A-Z_]+|TEST_CASE_ID)\b/g, '<span class="e2e-builder__tok-var">$1</span>');
    esc = esc.replace(/(\s+#.*)$/, '<span class="e2e-builder__tok-comment">$1</span>');
    return esc;
  }

  function highlightOutput(text, tab) {
    if (tab !== "gradle") return escapeHtml(text);
    return text.split("\n").map(highlightShellLine).join("\n");
  }

  function rebuildOutputs() {
    outputs.gradle = buildGradleCommand();
    outputs.json = JSON.stringify(flatVector(), null, 2);
    outputs.prompt = buildPrompt();
    hashEl.textContent = "vector#" + flatVector()._hash;
    renderConflicts();
    renderActiveTab();
  }

  function renderActiveTab() {
    var text = outputs[activeTab] || "";
    outputEl.innerHTML = highlightOutput(text, activeTab);
    terminalEl.classList.toggle("terminal-panel--tall", activeTab === "prompt");
  }

  function renderTabs() {
    tabsRoot.innerHTML = "";
    OUTPUT_TABS.forEach(function (tab) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab" + (activeTab === tab.id ? " tab--active" : "");
      btn.textContent = tab.barLabel || tab.label;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", activeTab === tab.id ? "true" : "false");
      btn.dataset.tab = tab.id;
      btn.addEventListener("click", function () {
        activeTab = tab.id;
        renderTabs();
        renderActiveTab();
      });
      tabsRoot.appendChild(btn);
    });
  }

  function onValueChange(paramId, newValue) {
    values[paramId] = newValue;
    if (paramId === "allureListenerMode") syncAllureListenerFromMode();
    if (paramId === "logToConsole" && newValue === "false") {
      renderParams();
    }
    if (paramId === "testopsEnabled") {
      renderParams();
    }
    if (paramId === "testSuite") {
      if (newValue === "visual") {
        values.pyramidLayer = "e2e";
        syncControlButtons("pyramidLayer", "e2e");
      }
      var methodParam = paramById("testMethod");
      var currentMethod = values.testMethod;
      if (currentMethod) {
        var opt = methodParam.options.find(function (o) {
          return o.value === currentMethod;
        });
        if (opt && opt.suite && opt.suite !== newValue) {
          values.testMethod = "";
        }
      }
      renderParams();
    }
    saveState();
    rebuildOutputs();
  }

  function renderRadioParam(param) {
    var mode = radioUiMode(param);
    if (mode === "select") return renderSelectParam(param);

    var wrap = createParamWrap(param);
    if (mode === "toggle") return renderToggleButtons(param, wrap);
    if (mode === "chips") return renderOptionButtons(param, wrap, false);
    if (mode === "single") {
      var plaque = clonePlaqueTemplate("plaque-field-value");
      plaque.querySelector(".plaque-field__label").textContent = param.label;
      var value = plaque.querySelector(".plaque-field__value");
      value.textContent = param.options[0].label;
      if (param.options[0].hint) value.title = param.options[0].hint;
      wrap.appendChild(plaque);
      return wrap;
    }
    return renderOptionButtons(param, wrap, false);
  }

  function renderSelectParam(param) {
    var wrap = createParamWrap(param);
    var plaque = clonePlaqueTemplate("plaque-field-select");

    plaqueLabelEl(param, {}, plaque);

    var select = plaque.querySelector(".plaque-field__control");
    select.id = "e2e-select-" + param.id;
    select.replaceChildren();

    param.options.forEach(function (opt) {
      if (opt.suite && opt.suite !== values.testSuite && opt.value) return;
      var option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.hint) option.title = opt.hint;
      select.appendChild(option);
    });

    select.value = values[param.id] || "";
    select.addEventListener("change", function () {
      onValueChange(param.id, select.value);
    });

    wrap.appendChild(plaque);
    return wrap;
  }

  function renderTextParam(param) {
    var wrap = createParamWrap(param);
    var plaque = clonePlaqueTemplate("plaque-field-text");

    plaqueLabelEl(param, {}, plaque);

    var input = plaque.querySelector(".plaque-field__control");
    input.type = param.type === "password" ? "password" : "text";
    input.id = "e2e-text-" + param.id;
    input.value = values[param.id] || "";
    input.placeholder = param.placeholder || "";
    input.autocomplete = param.sensitive ? "off" : "";
    input.addEventListener("input", function () {
      onValueChange(param.id, input.value);
    });

    wrap.appendChild(plaque);

    if (param.envHint) {
      var hint = document.createElement("p");
      hint.className = "e2e-builder__param-warn";
      hint.textContent = param.envHint;
      wrap.appendChild(hint);
    }

    return wrap;
  }

  function renderCheckStrip(param, wrap) {
    var strip = clonePlaqueTemplate("plaque-field-checkstrip");
    strip.setAttribute("aria-label", param.label || param.id);
    strip.replaceChildren();
    var itemTemplate = clonePlaqueTemplate("plaque-field-checkstrip-item");

    param.options.forEach(function (opt) {
      var row = itemTemplate.cloneNode(true);
      row.dataset.testid = "e2e-check-" + param.id + "-" + opt.value;

      var input = row.querySelector(".plaque-field-checkstrip__input");
      input.dataset.value = opt.value;
      input.checked = (values[param.id] || []).indexOf(opt.value) !== -1;

      var titleParts = [param.label, opt.label];
      if (opt.hint) titleParts.push(opt.hint);
      if (param.warn) titleParts.push(param.warn);
      row.title = titleParts.join(" · ");

      row.querySelector("span").textContent = opt.label;

      input.addEventListener("change", function () {
        var set = new Set(values[param.id] || []);
        if (input.checked) set.add(opt.value);
        else set.delete(opt.value);
        onValueChange(param.id, Array.from(set));
      });

      strip.appendChild(row);
    });

    wrap.appendChild(strip);
    return wrap;
  }

  function renderCheckboxParam(param) {
    var wrap = createParamWrap(param);
    wrap.classList.add("e2e-builder__param--checkstrip");
    if (param.label) {
      var caption = document.createElement("p");
      caption.className = "e2e-builder__param-caption";
      caption.textContent = param.label;
      if (param.warn) caption.title = param.warn;
      wrap.appendChild(caption);
    }
    return renderCheckStrip(param, wrap);
  }

  function renderParam(param) {
    if (param.type === "radio") return renderRadioParam(param);
    if (param.type === "select") return renderSelectParam(param);
    if (param.type === "text" || param.type === "password") return renderTextParam(param);
    if (param.type === "checkbox") return renderCheckboxParam(param);
    return document.createDocumentFragment();
  }

  function renderParams() {
    paramsRoot.innerHTML = "";
    var currentGroup = null;
    var section = null;
    var body = null;

    map.groups.forEach(function (group) {
      section = document.createElement("section");
      section.className = "section e2e-builder__group";
      section.dataset.groupId = group.id;
      section.dataset.testid = "e2e-group-" + group.id;

      var title = document.createElement("h2");
      title.className = "section__title e2e-builder__group-title";
      title.textContent = group.title;
      section.appendChild(title);

      if (group.desc) {
        var groupDesc = document.createElement("p");
        groupDesc.className = "section__desc e2e-builder__group-desc";
        groupDesc.textContent = group.desc;
        section.appendChild(groupDesc);
      }

      body = document.createElement("div");
      body.className = "section__body";
      section.appendChild(body);

      if (group.id === "remote") {
        var hubToggles = renderRemoteHubToggleGrid();
        if (hubToggles) body.appendChild(hubToggles);
      }

      var pendingToggles = [];

      map.params
        .filter(function (p) {
          return p.group === group.id;
        })
        .forEach(function (param) {
          if (isRemoteHubToggleParam(param)) return;
          if (isBooleanToggleParam(param) && matchesShowWhen(param)) {
            pendingToggles.push(param);
            return;
          }
          if (pendingToggles.length === 1) {
            body.appendChild(renderParam(pendingToggles[0]));
            pendingToggles = [];
          } else if (pendingToggles.length > 1) {
            body.appendChild(renderToggleGrid(pendingToggles));
            pendingToggles = [];
          }
          if (matchesShowWhen(param)) {
            body.appendChild(renderParam(param));
          }
        });

      if (pendingToggles.length === 1) {
        body.appendChild(renderParam(pendingToggles[0]));
      } else if (pendingToggles.length > 1) {
        body.appendChild(renderToggleGrid(pendingToggles));
      }

      paramsRoot.appendChild(section);
      currentGroup = group.id;
    });
  }

  function syncPresetActive() {
    presetsRoot.querySelectorAll(".chip[data-preset-id]").forEach(function (btn) {
      var active = btn.dataset.presetId === activePresetId;
      btn.classList.toggle("chip--active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderPresets() {
    presetsRoot.innerHTML = "";
    map.presets.forEach(function (preset) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      if (activePresetId === preset.id) btn.classList.add("chip--active");
      btn.textContent = preset.label;
      btn.title = preset.id;
      btn.dataset.presetId = preset.id;
      btn.dataset.testid = "e2e-preset-" + preset.id;
      btn.setAttribute("aria-pressed", activePresetId === preset.id ? "true" : "false");
      btn.addEventListener("click", function () {
        applyPreset(preset);
      });
      presetsRoot.appendChild(btn);
    });
  }

  function applyPreset(preset) {
    activePresetId = preset.id;
    Object.keys(preset.values).forEach(function (key) {
      if (values.hasOwnProperty(key)) values[key] = preset.values[key];
    });
    if (preset.values.benchmarkLabel) values.benchmarkLabel = preset.values.benchmarkLabel;
    else values.benchmarkLabel = preset.id;
    syncPresetActive();
    renderParams();
    saveState();
    rebuildOutputs();
    statusEl.textContent = "Пресет: " + preset.label;
    setTimeout(function () {
      statusEl.textContent = "";
    }, 2000);
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ values: values, activeTab: activeTab, activePresetId: activePresetId })
      );
    } catch (_e) {
      /* ignore */
    }
  }

  function loadState() {
    try {
      var storedJson = localStorage.getItem(STORAGE_KEY);
      if (!storedJson) return;
      var state = JSON.parse(storedJson);
      if (state.values) {
        Object.keys(state.values).forEach(function (key) {
          if (values.hasOwnProperty(key)) values[key] = state.values[key];
        });
        if (values.allureListenerMode === "per_test_toggle") {
          values.allureListenerMode = "global_off";
        }
        if (values.pyramidLayer === "visual") {
          values.pyramidLayer = "e2e";
          if (values.testSuite !== "visual") values.testSuite = "visual";
        }
      }
      if (state.activeTab) activeTab = state.activeTab;
      if (state.activePresetId) activePresetId = state.activePresetId;
    } catch (_e) {
      /* ignore */
    }
  }

  function copyText(text, okMsg) {
    if (!text) {
      statusEl.textContent = "Нечего копировать";
      return;
    }
    navigator.clipboard.writeText(text).then(
      function () {
        statusEl.textContent = okMsg;
        setTimeout(function () {
          statusEl.textContent = "";
        }, 2000);
      },
      function () {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          statusEl.textContent = okMsg;
          setTimeout(function () {
            statusEl.textContent = "";
          }, 2000);
        } catch (_e) {
          statusEl.textContent = "Не удалось скопировать";
        }
        document.body.removeChild(ta);
      }
    );
  }

  copyBtn.addEventListener("click", function () {
    copyText(outputs[activeTab] || "", "Скопировано: " + activeTab);
  });

  resetBtn.addEventListener("click", function () {
    initValues();
    activePresetId = null;
    activeTab = "gradle";
    renderPresets();
    renderParams();
    renderTabs();
    saveState();
    rebuildOutputs();
    statusEl.textContent = "Сброшено к defaults";
  });

  initValues();
  loadState();
  syncAllureListenerFromMode();
  renderPresets();
  renderParams();
  renderTabs();
  rebuildOutputs();
})();
