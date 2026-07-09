# Page objects

**reference-app** — home page at app root. Resolved via `baseUrl` in `config/reference_ci_*.properties`.

| Page | Class | Open |
|------|-------|------|
| Home | `HomePage` | `open("")` → `GET /` |
| Login | `LoginPage` | `open("/login")` |

Post-auth state (welcome message, logout) lives on `HomePage` at `/`.

## Profiles

`reference_ci_e2e.properties`: `baseUrl=http://localhost:8080/`

`reference_ci_component.properties`: `baseUrl=http://localhost:3000/` (design-system preview)
