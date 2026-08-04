# Page objects

**reference-app** — home page at app root. Resolved via `baseUrl` in `config/reference_ci_*.properties`.

| Page | Class | Open |
|------|-------|------|
| Home | `HomePage` | `open("")` → `GET /` |
| Login | `LoginPage` | `open("/login")` |

Post-auth state (welcome message, logout) lives on `HomePage` at `/`.

## Profiles

`reference_ci_e2e.properties` / `reference_ci_integration.properties`: `baseUrl=http://localhost:8820/`
