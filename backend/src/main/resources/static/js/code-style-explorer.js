(function () {
  var map = window.testParamsMap;
  var samples = window.codeStyleSamples;
  if (!map || !samples) return;

  var GROUP_IDS = ["code_style", "code_structure"];
  var paramsRoot = document.getElementById("cse-params");
  var outputEl = document.getElementById("cse-output");
  var titleEl = document.getElementById("cse-sample-title");
  var metaEl = document.getElementById("cse-sample-meta");
  var values = {};

  function defaultValue(param) {
    return param.default !== undefined ? String(param.default) : "";
  }

  function initValues() {
    map.params.forEach(function (param) {
      if (GROUP_IDS.indexOf(param.group) === -1) return;
      values[param.id] = defaultValue(param);
    });
  }

  function matchesShowWhen(param) {
    if (!param.showWhen) return true;
    return Object.keys(param.showWhen).every(function (key) {
      return param.showWhen[key].indexOf(values[key]) !== -1;
    });
  }

  function ragChunkFor(paramId, value) {
    var hints = map.ragChunkHints && map.ragChunkHints[paramId];
    if (hints && hints[value]) return hints[value];
    if (paramId === "poFluent" && (value === "true" || value === "mixed")) return "po-fluent";
    if (paramId === "locatorStyle" && value === "data_testid") return "po-locators";
    if (paramId === "stepsLocation" && (value === "po_annotated" || value === "hybrid")) return "po-step";
    return null;
  }

  function sampleKey(paramId, value) {
    return paramId + ":" + value;
  }

  function lookupSample(paramId, value) {
    var key = sampleKey(paramId, value);
    if (samples[key]) return samples[key];
    var rag = ragChunkFor(paramId, value);
    var param = map.params.find(function (p) {
      return p.id === paramId;
    });
    var opt = param && param.options
      ? param.options.find(function (o) {
          return o.value === value;
        })
      : null;
    return {
      title: (param ? param.label : paramId) + " = " + value,
      source: "—",
      rag: rag || "—",
      language: "text",
      code: (opt && opt.hint) || "Пример для этой оси пока не добавлен в code-style-samples.js",
    };
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderTerminal(paramId, value) {
    var sample = lookupSample(paramId, value);
    var param = map.params.find(function (p) {
      return p.id === paramId;
    });
    var ragId = sample.rag && sample.rag !== "—" ? sample.rag : ragChunkFor(paramId, value);
    var ragLine = ragId ? "docs/rag/e2e/" + ragId + ".md" : "—";
    var adrLine = "docs/adr/002-e2e-canonical-patterns.md";

    titleEl.textContent = sample.title;
    metaEl.innerHTML =
      '<span class="code-style-explorer__meta-item"><strong>ось</strong> ' +
      escapeHtml(param ? param.label : paramId) +
      " · <code>" +
      escapeHtml(value) +
      '</code></span>' +
      '<span class="code-style-explorer__meta-item"><strong>источник</strong> ' +
      escapeHtml(sample.source) +
      "</span>" +
      '<span class="code-style-explorer__meta-item"><strong>RAG</strong> <code>' +
      escapeHtml(ragLine) +
      '</code></span>' +
      '<span class="code-style-explorer__meta-item"><strong>ADR</strong> <code>' +
      escapeHtml(adrLine) +
      "</code></span>";

    outputEl.textContent = sample.code;
  }

  function syncButtons(paramId, value) {
    paramsRoot.querySelectorAll('[data-param-id="' + paramId + '"] .plaque-field-option').forEach(function (btn) {
      var on = btn.dataset.value === value;
      btn.classList.toggle("plaque-field-option--on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function onValueChange(paramId, value) {
    values[paramId] = value;
    syncButtons(paramId, value);
    renderParams();
    renderTerminal(paramId, value);
  }

  function renderOptionList(param) {
    var wrap = document.createElement("div");
    wrap.className = "configurator__param";
    wrap.dataset.paramId = param.id;
    wrap.dataset.testid = "cse-param-" + param.id;

    var list = document.createElement("div");
    list.className = "plaque-field-list plaque-field-list--dense";
    list.setAttribute("role", "radiogroup");
    list.setAttribute("aria-label", param.label);

    param.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "plaque-field-option";
      btn.dataset.value = opt.value;
      btn.textContent = opt.label;
      if (opt.hint) btn.title = opt.hint;
      if (values[param.id] === opt.value) {
        btn.classList.add("plaque-field-option--on");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.setAttribute("aria-pressed", "false");
      }
      btn.addEventListener("click", function () {
        if (values[param.id] === opt.value) {
          renderTerminal(param.id, opt.value);
          return;
        }
        onValueChange(param.id, opt.value);
      });
      list.appendChild(btn);
    });

    wrap.appendChild(list);
    return wrap;
  }

  function renderParams() {
    paramsRoot.innerHTML = "";
    map.groups
      .filter(function (group) {
        return GROUP_IDS.indexOf(group.id) !== -1;
      })
      .forEach(function (group) {
        var section = document.createElement("div");
        section.className =
          "panel panel--content configurator-option-presets__panel-group configurator__group--dense";
        section.dataset.groupId = group.id;
        section.dataset.testid = "cse-group-" + group.id;

        var bar = document.createElement("div");
        bar.className = "panel__bar";
        bar.innerHTML =
          '<div class="panel__dots" aria-hidden="true"><span class="panel__dot"></span><span class="panel__dot"></span><span class="panel__dot"></span></div>' +
          '<div class="panel__trail"><span class="panel__title">' +
          group.title +
          "</span></div>";
        section.appendChild(bar);

        var body = document.createElement("div");
        body.className = "panel__body";
        if (group.desc) {
          var desc = document.createElement("p");
          desc.className = "text text--sm text--muted configurator-option-presets__panel-group-desc";
          desc.textContent = group.desc;
          body.appendChild(desc);
        }

        map.params
          .filter(function (p) {
            return p.group === group.id && p.type === "radio";
          })
          .forEach(function (param) {
            if (matchesShowWhen(param)) body.appendChild(renderOptionList(param));
          });

        section.appendChild(body);
        paramsRoot.appendChild(section);
      });
  }

  initValues();
  renderParams();
  renderTerminal("testStyle", values.testStyle);
})();
