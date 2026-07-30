# Java test stacks (reference-app)

Layout mirrors qa-guru-refs: **language first**, then `{build}-{framework}-{driver}`.

| Path | Matrix id | Role |
|------|-----------|------|
| [`../tests/`](../tests/) | `java/gradle-junit5-selenide` | **SSOT** — full pyramid (short path kept for ergonomics) |
| [`gradle-junit5-selenium/`](gradle-junit5-selenium/) | `java/gradle-junit5-selenium` | UI smoke sibling (WebDriver) |

Python / JS siblings stay language-rooted at repo top (`tests-python/`, `tests-js/`) until migrated to `python/pip-pytest-selenium` / `javascript/…` if needed.
