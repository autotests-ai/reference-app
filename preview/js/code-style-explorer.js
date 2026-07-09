(function () {
  var catalog = window.codeStyleCatalog;
  if (!catalog) return;

  var catalogRoot = document.getElementById("cse-catalog");
  var outputEl = document.getElementById("cse-output");
  var titleEl = document.getElementById("cse-sample-title");
  var metaEl = document.getElementById("cse-sample-meta");
  var builderLinkEl = document.getElementById("cse-builder-link");
  var previewId = "canon-smoke";

  function topicById(id) {
    return catalog.topics.find(function (t) {
      return t.id === id;
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatRag(rag) {
    if (!rag || !rag.length) return "—";
    return rag
      .map(function (id) {
        return "docs/rag/e2e/" + id + ".md";
      })
      .join(", ");
  }

  function formatVector(vector) {
    if (!vector) return "—";
    return Object.keys(vector)
      .map(function (key) {
        return key + "=" + vector[key];
      })
      .join(" · ");
  }

  function syncPreviewHighlight() {
    catalogRoot.querySelectorAll(".code-style-explorer__topic").forEach(function (btn) {
      btn.classList.toggle("code-style-explorer__topic--active", btn.dataset.topicId === previewId);
      btn.setAttribute("aria-pressed", btn.dataset.topicId === previewId ? "true" : "false");
    });
  }

  function renderTerminal(topicId) {
    var topic = topicById(topicId);
    if (!topic) return;

    previewId = topicId;
    syncPreviewHighlight();

    titleEl.textContent = topic.title;
    metaEl.innerHTML =
      '<span class="code-style-explorer__meta-item">' +
      escapeHtml(topic.summary) +
      "</span>" +
      '<span class="code-style-explorer__meta-item"><strong>источник</strong> ' +
      escapeHtml(topic.source) +
      "</span>" +
      '<span class="code-style-explorer__meta-item"><strong>RAG</strong> <code>' +
      escapeHtml(formatRag(topic.rag)) +
      '</code></span>' +
      '<span class="code-style-explorer__meta-item"><strong>вектор</strong> <code class="code-style-explorer__vector">' +
      escapeHtml(formatVector(topic.vector)) +
      '</code></span>' +
      '<span class="code-style-explorer__meta-item"><strong>ADR</strong> <code>docs/adr/002-e2e-canonical-patterns.md</code></span>';

    outputEl.textContent = topic.code;

    if (builderLinkEl) {
      builderLinkEl.href = "e2e-builder.html?catalog=" + encodeURIComponent(topic.id);
      builderLinkEl.hidden = false;
    }
  }

  function renderTopic(topic) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-style-explorer__topic";
    btn.dataset.topicId = topic.id;
    btn.dataset.testid = "cse-topic-" + topic.id;
    btn.setAttribute("aria-pressed", "false");

    var name = document.createElement("span");
    name.className = "code-style-explorer__topic-title";
    name.textContent = topic.title;

    var summary = document.createElement("span");
    summary.className = "code-style-explorer__topic-summary text text--muted";
    summary.textContent = topic.summary;

    btn.appendChild(name);
    btn.appendChild(summary);
    btn.addEventListener("click", function () {
      renderTerminal(topic.id);
    });
    return btn;
  }

  function renderSection(section) {
    var topics = catalog.topics.filter(function (t) {
      return t.section === section.id;
    });
    if (!topics.length) return null;

    var block = document.createElement("section");
    block.className = "code-style-explorer__section";
    if (section.collapsed) block.classList.add("code-style-explorer__section--collapsed");

    var heading = document.createElement("h2");
    heading.className = "code-style-explorer__section-title";

    if (section.collapsed) {
      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "code-style-explorer__section-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML =
        '<span class="code-style-explorer__section-chevron" aria-hidden="true"></span>' +
        escapeHtml(section.title);
      toggle.addEventListener("click", function () {
        var open = block.classList.toggle("code-style-explorer__section--open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      heading.appendChild(toggle);
    } else {
      heading.textContent = section.title;
    }
    block.appendChild(heading);

    var body = document.createElement("div");
    body.className = "code-style-explorer__section-body";
    topics.forEach(function (topic) {
      body.appendChild(renderTopic(topic));
    });
    block.appendChild(body);
    return block;
  }

  function renderCatalog() {
    catalogRoot.innerHTML = "";
    catalog.sections.forEach(function (section) {
      var node = renderSection(section);
      if (node) catalogRoot.appendChild(node);
    });
  }

  renderCatalog();
  renderTerminal(previewId);
})();
