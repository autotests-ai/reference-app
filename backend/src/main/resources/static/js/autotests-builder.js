import { initPlaqueTemplates, clonePlaqueTemplate, applyPlaqueStretch } from './plaque-field.js';
import { escapeHtml, copyToClipboard } from './dom-utils.js';
import { highlightJson, highlightShell } from './code-highlight.js';

(async function () {
  await initPlaqueTemplates();

  var map = window.testParamsMap;
  if (!map) return;

  var STORAGE_KEY = "autotests-builder-v1";
  var values = {};
  var activePresetId = null;
  var activeTab = "gradle";
  var outputs = { gradle: "", json: "", prompt: "" };
  var OUTPUT_TABS = [
    { id: "prompt", label: "Agent prompt", barLabel: "Agent" },
    { id: "gradle", label: "Terminal", barLabel: "Terminal" },
    { id: "json", label: "JSON vector", barLabel: "JSON" },
  ];

  var presetsRoot = document.getElementById("e2e-presets");
  var paramsRoot = document.getElementById("e2e-params");
  var conflictsEl = document.getElementById("e2e-conflicts");
  var outputEl = document.getElementById("autotests-output");
  var hashEl = document.getElementById("e2e-hash");
  var terminalEl = document.getElementById("e2e-terminal");
  var copyBtn = document.getElementById("autotests-copy");
  var resetBtn = document.getElementById("e2e-reset");
  var statusEl = document.getElementById("autotests-status");
  var tabsRoot = document.getElementById("autotests-tabs");

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

  function isVisualSliceSuite(suite) {
    return map.visualSliceSuites && map.visualSliceSuites.indexOf(suite || values.testSuite) !== -1;
  }

  /** Env suffix: baseline suite → run profile `*_visual`, not a separate @Layer. */
  function configEnvSuffix() {
    if (isVisualSliceSuite()) return "visual";
    return values.pyramidLayer;
  }

  function configEnvName() {
    if (!values.configStand) return "local_e2e";
    return values.configStand + "_" + configEnvSuffix();
  }

  function gradleTestFilter() {
    var cls = suiteClassFilter();
    if (cls === "*") return "tests.*";
    if (cls.charAt(0) === "*") return cls;
    var method = values.testMethod;
    if (method) return "tests." + cls + "." + method;
    return "tests." + cls;
  }

  function buildToolBin() {
    if (values.buildTool === "maven") {
      return values.mavenInvoker === "mvn" ? "mvn" : "./mvnw";
    }
    return values.gradleBin === "gradle" ? "gradle" : "./gradlew";
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
    if (
      param.id === "configStand" ||
      param.id === "pyramidLayer" ||
      param.id === "testSuite" ||
      param.id === "parallelism" ||
      param.id === "browserSize"
    ) {
      return true;
    }
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
    wrap.className = "configurator__param";
    wrap.dataset.paramId = param.id;
    if (!matchesShowWhen(param)) wrap.classList.add("configurator__param--hidden");
    return wrap;
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

  function renderSegTogglePlaque(param, opts) {
    opts = opts || {};
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
      btn.textContent = opt.label;
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

    if (opts.stretch === false) return plaque;
    return applyPlaqueStretch(plaque);
  }

  function isRemoteHubFlag(param) {
    return map.remoteHubFlagIds && map.remoteHubFlagIds.indexOf(param.id) !== -1;
  }

  function gridCell(cellClass) {
    var cell = document.createElement("div");
    cell.className = "plaque-field-grid__cell" + (cellClass ? " " + cellClass : "");
    return cell;
  }

  function mixedGrid(ratio, ariaLabel, testid) {
    var grid = document.createElement("div");
    grid.className = "plaque-field-grid plaque-field-grid--mixed";
    if (ratio) grid.classList.add("plaque-field-grid--ratio-" + ratio);
    grid.setAttribute("role", "group");
    if (ariaLabel) grid.setAttribute("aria-label", ariaLabel);
    if (testid) grid.dataset.testid = testid;
    return grid;
  }

  function appendParamCell(grid, cellClass, param, opts) {
    if (!param || !matchesShowWhen(param)) return;
    var cell = gridCell(cellClass);
    var nodeOpts = Object.assign({ inGrid: true }, opts || {});
    cell.appendChild(renderParamNode(param, nodeOpts));
    grid.appendChild(cell);
  }

  function renderParamNode(param, opts) {
    opts = opts || {};
    if (opts.compactSelect || param.compact) {
      return renderCompactSelectParam(param);
    }
    if (opts.segNoStretch) {
      return renderSegTogglePlaque(param, { stretch: false });
    }
    return renderParam(param, opts);
  }

  function renderBuildGroupGrid() {
    var stack = document.createElement("div");
    stack.className = "plaque-field-grid-stack plaque-field-grid-stack--ratio-221";
    stack.dataset.testid = "e2e-build-grid";

    var row1 = mixedGrid("221", "OS, language and java version", "e2e-build-os-lang-row");
    appendParamCell(row1, null, paramById("buildOs"));
    appendParamCell(row1, null, paramById("buildLanguage"));
    appendParamCell(row1, null, paramById("javaVersion"), { compactSelect: true });
    if (row1.childElementCount) stack.appendChild(row1);

    var row2 = mixedGrid("221", "Build tool chain", "e2e-build-tool-row");
    appendParamCell(row2, null, paramById("buildTool"), { segNoStretch: true });
    if (values.buildTool === "maven") {
      appendParamCell(row2, null, paramById("mavenInvoker"), { segNoStretch: true });
      appendParamCell(row2, null, paramById("mavenVersion"), { compactSelect: true });
    } else {
      appendParamCell(row2, null, paramById("gradleBin"), { segNoStretch: true });
      appendParamCell(row2, null, paramById("gradleVersion"), { compactSelect: true });
    }
    if (row2.childElementCount) stack.appendChild(row2);

    return stack;
  }

  function renderRunGroupPanelStack() {
    var stack = document.createElement("div");
    stack.className = "plaque-field-panel-stack";
    stack.dataset.testid = "e2e-run-panel-stack";

    (map.runPanelStackParamIds || []).forEach(function (id) {
      var param = paramById(id);
      if (!param || !matchesShowWhen(param)) return;
      stack.appendChild(renderParam(param));
    });

    return stack.childElementCount ? stack : document.createDocumentFragment();
  }

  function renderDriverGroupGridStack() {
    var stack = document.createElement("div");
    stack.className = "plaque-field-grid-stack";
    stack.dataset.testid = "e2e-driver-grid";

    var browserRow = mixedGrid(null, "Browser identity", "e2e-driver-browser-row");
    appendParamCell(browserRow, "plaque-field-grid__cell--lg", paramById("browser"));
    appendParamCell(browserRow, "plaque-field-grid__cell--lg", paramById("browserVersion"));
    if (browserRow.childElementCount) stack.appendChild(browserRow);

    var runtimeRow = mixedGrid(null, "Driver runtime", "e2e-driver-runtime-row");
    appendParamCell(runtimeRow, "plaque-field-grid__cell--lg", paramById("headless"), { segNoStretch: true });
    appendParamCell(runtimeRow, "plaque-field-grid__cell--lg", paramById("browserSize"));
    if (runtimeRow.childElementCount) stack.appendChild(runtimeRow);

    var afterEachRow = mixedGrid(null, "closeBrowserAfterEach", "e2e-driver-closeBrowserAfterEach-row");
    appendParamCell(afterEachRow, "plaque-field-grid__cell--full", paramById("closeBrowserAfterEach"), {
      segNoStretch: true,
    });
    if (afterEachRow.childElementCount) stack.appendChild(afterEachRow);

    var afterAllRow = mixedGrid(null, "closeBrowserAfterAll", "e2e-driver-closeBrowserAfterAll-row");
    appendParamCell(afterAllRow, "plaque-field-grid__cell--full", paramById("closeBrowserAfterAll"), {
      segNoStretch: true,
    });
    if (afterAllRow.childElementCount) stack.appendChild(afterAllRow);

    return stack.childElementCount ? stack : document.createDocumentFragment();
  }

  function syncTestFrameworkVersionOptions(selectEl, keepCurrent) {
    if (!selectEl) return;
    var framework = values.testFramework || "junit5";
    var versions = (map.testFrameworkVersions && map.testFrameworkVersions[framework]) || [];
    var preferred =
      (map.testFrameworkDefaults && map.testFrameworkDefaults[framework]) ||
      (versions.length ? versions[0] : "");
    var current = keepCurrent ? values.testFrameworkVersion : preferred;
    if (versions.indexOf(current) === -1) current = preferred;
    values.testFrameworkVersion = current;
    selectEl.replaceChildren();
    versions.forEach(function (version) {
      var option = document.createElement("option");
      option.value = version;
      option.textContent = version;
      option.selected = version === current;
      selectEl.appendChild(option);
    });
  }

  function renderParallelGroupGridStack() {
    var stack = document.createElement("div");
    stack.className = "plaque-field-grid-stack plaque-field-grid-stack--parallel";
    stack.dataset.testid = "e2e-parallel-grid";

    var frameworkRow = mixedGrid("41", "Test framework and version", "e2e-parallel-framework-row");
    appendParamCell(frameworkRow, null, paramById("testFramework"));
    appendParamCell(frameworkRow, null, paramById("testFrameworkVersion"), { compactSelect: true });
    if (frameworkRow.childElementCount) stack.appendChild(frameworkRow);

    var executionRow = mixedGrid("11", "Execution mode and parallel threads", "e2e-parallel-row");
    appendParamCell(executionRow, null, paramById("junitParallelMode"), { segNoStretch: true });
    appendParamCell(executionRow, null, paramById("parallelism"));
    if (executionRow.childElementCount) stack.appendChild(executionRow);

    var versionSelect = stack.querySelector('[data-param-id="testFrameworkVersion"] select');
    syncTestFrameworkVersionOptions(versionSelect, true);

    return stack.childElementCount ? stack : document.createDocumentFragment();
  }

  function renderRemoteGroupPanelStack() {
    var stack = document.createElement("div");
    stack.className = "plaque-field-panel-stack";
    stack.dataset.testid = "e2e-remote-panel-stack";

    var remoteUrl = paramById("remoteUrl");
    if (remoteUrl && matchesShowWhen(remoteUrl)) {
      stack.appendChild(renderParam(remoteUrl));
    }

    var flagsGrid = renderRemoteHubFlagsGrid();
    if (flagsGrid.nodeType === 1) {
      stack.appendChild(flagsGrid);
    }

    return stack.childElementCount ? stack : document.createDocumentFragment();
  }

  function mixedGridCellClass(flagCount) {
    if (flagCount >= 4) return "plaque-field-grid__cell--sm";
    if (flagCount === 3) return "plaque-field-grid__cell--md";
    if (flagCount === 2) return "plaque-field-grid__cell--lg";
    return "plaque-field-grid__cell--md";
  }

  function renderRemoteHubFlagsGrid() {
    if (!map.remoteHubFlagIds || !map.remoteHubFlagIds.length) {
      return document.createDocumentFragment();
    }

    var visibleIds = map.remoteHubFlagIds.filter(function (id) {
      var param = paramById(id);
      return param && matchesShowWhen(param);
    });
    if (!visibleIds.length) {
      return document.createDocumentFragment();
    }

    var grid = clonePlaqueTemplate("plaque-field-grid-remote-hub");
    grid.replaceChildren();
    grid.dataset.testid = "e2e-remote-flags-grid";

    var cellClass = mixedGridCellClass(visibleIds.length);

    visibleIds.forEach(function (id) {
      var param = paramById(id);

      var cell = document.createElement("div");
      cell.className = "plaque-field-grid__cell " + cellClass;
      cell.appendChild(renderSegTogglePlaque(param, { stretch: false }));
      grid.appendChild(cell);
    });

    return grid;
  }

  function renderToggleButtons(param, wrap) {
    wrap.appendChild(renderSegTogglePlaque(param));
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
    if (isVisualSliceSuite() && values.pyramidLayer !== "e2e") {
      issues.push("BaselineTests: Test layer должен быть e2e (@Layer(\"e2e\")), не " + values.pyramidLayer);
    }
    if (isVisualSliceSuite() && values.configStand === "one-page-form_prod") {
      issues.push("BaselineTests нужен local HTTP (frontend/ на :3000), не prod profile");
    }
    if (values.testMethod) {
      var methodOpt = paramById("testMethod").options.find(function (o) {
        return o.value === values.testMethod;
      });
      if (methodOpt && methodOpt.suite && methodOpt.suite !== values.testSuite) {
        issues.push("testMethod относится к " + methodOpt.suite + ", а выбран suite " + values.testSuite);
      }
    }
    if (values.parallelism !== "1" && isVisualSliceSuite() && values.junitParallelMode === "same_thread") {
      issues.push("BaselineTests @SAME_THREAD: parallelism > 1 даёт выигрыш только в suite, не внутри класса");
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
      var gradleBin = buildToolBin();
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
    lines = lines.concat(joinContinuedLines("  " + buildToolBin() + " test \\", gradleBody));

    var mode = values.allureReportMode || "allure3";
    if (mode === "allure3") {
      lines.push("");
      lines.push("# После upload — quality gate + локальный HTML (опционально):");
      lines.push(buildToolBin() + " allureQualityGate -q");
      lines.push(buildToolBin() + " allureReport -q");
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
    gradleBody.push("  --tests '" + testFilter + "'");

    if (testopsOn) {
      return buildTestOpsShell(gradleBody, testFilter);
    }

    var gradleBin = buildToolBin();
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
        "- allurectl watch — см. Terminal-вкладку"
      );
    }

    if (values.testSuite === "login" || values.testSuite === "logout") {
      lines.push(
        "",
        "## Канон vs ladder ethalon",
        "- CI / pyramid: `tests-java/` — smoke `LoginTests`, `LoginFormTests`, `LoginEmbedTests`; `@Manual` на методе в `LoginTests`",
        "- Ladder code: `tests-java/src/test/java/_ethalon/ladder/` — full style ladder `LoginTests`/`LogoutTests` (`@Tag(\"ladder-ethalon\")`, `" +
          buildToolBin() +
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
            return "- `" + map.resolveRagChunkPath(c) + "`";
          })
          .join("\n")
      );
    }

    if (isVisualSliceSuite()) {
      lines.push(
        "",
        "## Visual baselines (UI e2e, не отдельный @Layer)",
        "- `@Layer(\"e2e\")` на классе (`" + suiteClassFilter() + "`); CI slice — env `*_visual`",
        "- Terminal: `--tests '" + gradleTestFilter() + "'` с env `" + configEnvName() + "`",
        "- Target: `frontend/` через `python -m http.server 3000`",
        "- `attachLastScreenshot=false` — element crop из `ScreenshotBaseline`, не full page",
        "- `-DupdateBaselines=true` — перезаписать PNG в `src/test/resources/screenshots/`"
      );
    }

    lines.push(
      "",
      "## RAG chunks",
      ragChunksForSelection().map(function (c) {
        return "- `" + map.resolveRagChunkPath(c) + "`";
      }).join("\n"),
      "",
      "## Terminal (из конструктора)",
      "```bash",
      buildGradleCommand(),
      "```",
      "",
      "Канон: ADR 002, `tests-java/` в template-project. Ladder ethalon — `_ethalon/ladder/`. Один тест — один стиль шагов."
    );

    return lines.join("\n");
  }

  function highlightOutput(text, tab) {
    if (tab === "gradle") {
      return highlightShell(text);
    }
    if (tab === "json") {
      return highlightJson(text);
    }
    return escapeHtml(text);
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
    terminalEl.classList.toggle("panel--tall", activeTab === "prompt");
    terminalEl.classList.toggle("ch-theme--vscode", activeTab === "json" || activeTab === "gradle");
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
    if (paramId === "buildTool") {
      renderParams();
    }
    if (paramId === "testFramework") {
      var preferred = (map.testFrameworkDefaults && map.testFrameworkDefaults[newValue]) || "";
      if (preferred) values.testFrameworkVersion = preferred;
      renderParams();
    }
    if (paramId === "logToConsole" && newValue === "false") {
      renderParams();
    }
    if (paramId === "testopsEnabled") {
      renderParams();
    }
    if (paramId === "testSuite") {
      if (isVisualSliceSuite(newValue)) {
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

  function renderRadioParam(param, opts) {
    opts = opts || {};
    if (param.id === "pyramidLayer") {
      var wrap = createParamWrap(param);
      wrap.appendChild(applyPlaqueStretch(renderSegTogglePlaque(param)));
      return wrap;
    }
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
      wrap.appendChild(applyPlaqueStretch(plaque));
      return wrap;
    }
    return renderOptionButtons(param, wrap, false);
  }

  function renderCompactSelectParam(param) {
    var label = document.createElement("label");
    label.className = "plaque-field plaque-field--stretch";
    label.dataset.paramId = param.id;
    label.dataset.testid = "e2e-param-" + param.id;
    label.setAttribute("aria-label", param.label || param.id);

    var select = document.createElement("select");
    select.className = "plaque-field__control";
    select.id = "e2e-select-" + param.id;
    select.setAttribute("aria-label", param.label || param.id);
    if (param.id === "testFrameworkVersion") {
      select.dataset.testid = "e2e-select-testFrameworkVersion";
    }

    param.options.forEach(function (opt) {
      if (opt.suite && opt.suite !== values.testSuite && opt.value) return;
      var option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.hint) option.title = opt.hint;
      select.appendChild(option);
    });

    if (param.id === "testFrameworkVersion") {
      syncTestFrameworkVersionOptions(select, true);
    } else {
      select.value = values[param.id] || "";
    }

    select.addEventListener("change", function () {
      onValueChange(param.id, select.value);
    });

    label.appendChild(select);
    return label;
  }

  function renderSelectParam(param, opts) {
    opts = opts || {};
    var plaque = clonePlaqueTemplate("plaque-field-select");
    plaque.dataset.paramId = param.id;
    plaque.dataset.testid = "e2e-param-" + param.id;

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

    var field = applyPlaqueStretch(plaque);
    if (opts.inGrid) return field;
    var wrap = createParamWrap(param);
    wrap.appendChild(field);
    return wrap;
  }

  function renderTextParam(param, opts) {
    opts = opts || {};
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

    var field = applyPlaqueStretch(plaque);
    if (opts.inGrid) return field;

    var wrap = createParamWrap(param);
    wrap.appendChild(field);

    if (param.envHint) {
      var hint = document.createElement("p");
      hint.className = "autotests-builder__param-warn";
      hint.textContent = param.envHint;
      wrap.appendChild(hint);
    }

    return wrap;
  }

  function renderTagStrip(param, wrap) {
    var strip = clonePlaqueTemplate("plaque-field-tagstrip");
    strip.setAttribute("aria-label", param.label || param.id);
    strip.replaceChildren();
    var itemTemplate = clonePlaqueTemplate("plaque-field-tagstrip-item");

    param.options.forEach(function (opt) {
      var row = itemTemplate.cloneNode(true);
      row.dataset.testid = "e2e-check-" + param.id + "-" + opt.value;

      var input = row.querySelector(".plaque-field-tagstrip__input");
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
    wrap.classList.add("configurator__param--tagstrip");
    if (param.label) {
      var caption = document.createElement("p");
      caption.className = "text text--sm text--muted configurator__param-caption";
      caption.textContent = param.label;
      if (param.warn) caption.title = param.warn;
      wrap.appendChild(caption);
    }
    return renderTagStrip(param, wrap);
  }

  function renderParam(param, opts) {
    opts = opts || {};
    if (param.type === "radio") return renderRadioParam(param, opts);
    if (param.type === "select") return renderSelectParam(param, opts);
    if (param.type === "text" || param.type === "password") return renderTextParam(param, opts);
    if (param.type === "checkbox") return renderCheckboxParam(param);
    return document.createDocumentFragment();
  }

  function createPanelDots() {
    var dots = document.createElement("div");
    dots.className = "panel__dots";
    dots.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 3; i++) {
      var dot = document.createElement("span");
      dot.className = "panel__dot";
      dots.appendChild(dot);
    }
    return dots;
  }

  function renderParams() {
    paramsRoot.innerHTML = "";
    var currentGroup = null;
    var section = null;
    var body = null;

    map.groups.forEach(function (group) {
      section = document.createElement("div");
      section.className = "panel panel--content autotests-builder__group";
      if (group.groupLayout === "wide") section.classList.add("configurator__group--wide");
      else if (group.groupLayout === "dense") section.classList.add("configurator__group--dense");
      section.dataset.groupId = group.id;
      section.dataset.testid = "e2e-group-" + group.id;

      var bar = document.createElement("div");
      bar.className = "panel__bar";
      bar.appendChild(createPanelDots());

      var trail = document.createElement("div");
      trail.className = "panel__trail";
      var title = document.createElement("span");
      title.className = "panel__title autotests-builder__group-title";
      title.textContent = group.title;
      trail.appendChild(title);
      bar.appendChild(trail);
      section.appendChild(bar);

      body = document.createElement("div");
      body.className = "panel__body";

      if (group.desc) {
        var groupDesc = document.createElement("p");
        groupDesc.className = "text text--sm text--muted autotests-builder__group-desc";
        groupDesc.textContent = group.desc;
        body.appendChild(groupDesc);
      }

      section.appendChild(body);

      if (group.id === "build") {
        body.appendChild(renderBuildGroupGrid());
      } else if (group.id === "run") {
        body.appendChild(renderRunGroupPanelStack());
        map.params
          .filter(function (p) {
            return p.group === group.id && p.id === "junitTags";
          })
          .forEach(function (param) {
            if (matchesShowWhen(param)) body.appendChild(renderParam(param));
          });
      } else if (group.id === "driver") {
        body.appendChild(renderDriverGroupGridStack());
      } else if (group.id === "parallel") {
        body.appendChild(renderParallelGroupGridStack());
      } else if (group.id === "remote") {
        body.appendChild(renderRemoteGroupPanelStack());
      } else {
        map.params
          .filter(function (p) {
            return p.group === group.id;
          })
          .forEach(function (param) {
            if (matchesShowWhen(param)) {
              body.appendChild(renderParam(param));
            }
          });
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

  function applyCatalogFromUrl() {
    var catalogId = new URLSearchParams(window.location.search).get("catalog");
    if (!catalogId || !window.codeStyleCatalog) return false;

    var topic = window.codeStyleCatalog.topics.find(function (t) {
      return t.id === catalogId;
    });
    if (!topic) return false;

    if (topic.builderPreset) {
      var preset = map.presets.find(function (p) {
        return p.id === topic.builderPreset;
      });
      if (preset) {
        activePresetId = preset.id;
        Object.keys(preset.values).forEach(function (key) {
          if (values.hasOwnProperty(key)) values[key] = preset.values[key];
        });
      }
    } else {
      activePresetId = null;
    }

    if (topic.vector) {
      Object.keys(topic.vector).forEach(function (key) {
        if (values.hasOwnProperty(key)) values[key] = topic.vector[key];
      });
    }

    return true;
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
          if (!isVisualSliceSuite(values.testSuite)) values.testSuite = "login-baseline";
        }
        if (values.testSuite === "visual") {
          values.testSuite = "login-baseline";
        }
        if (!values.buildTool) values.buildTool = "gradle";
        if (!values.buildOs) values.buildOs = "mac";
        if (!values.buildLanguage) values.buildLanguage = "java";
        if (!values.javaVersion) values.javaVersion = "21";
        if (values.gradleInvoker && !values.gradleBin) {
          values.gradleBin = values.gradleInvoker;
        }
        if (!values.gradleBin) values.gradleBin = "gradlew";
        if (!values.testFramework) values.testFramework = "junit5";
        if (!values.testFrameworkVersion) {
          values.testFrameworkVersion =
            (map.testFrameworkDefaults && map.testFrameworkDefaults.junit5) || "5.11.4";
        }
        if (!values.closeBrowserAfterAll) values.closeBrowserAfterAll = "true";
      }
      if (state.activeTab) activeTab = state.activeTab;
      if (state.activePresetId) activePresetId = state.activePresetId;
    } catch (_e) {
      /* ignore */
    }
  }

  function copyText(text, okMsg) {
    void copyToClipboard(text, {
      onEmpty: function () {
        statusEl.textContent = "Нечего копировать";
      },
      onSuccess: function () {
        statusEl.textContent = okMsg;
        setTimeout(function () {
          statusEl.textContent = "";
        }, 2000);
      },
      onError: function () {
        statusEl.textContent = "Не удалось скопировать";
      },
    });
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
  applyCatalogFromUrl();
  syncAllureListenerFromMode();
  renderPresets();
  renderParams();
  renderTabs();
  rebuildOutputs();
})();
