# Mock E-Commerce Site Copilot Instructions

This workspace contains two application surfaces and matching tests:
- `src/frontend`: React 19 + TypeScript + Vite frontend.
- `src/backend/MockEcommerce.Api`: .NET minimal API backend.
- `test/frontend` and `test/backend`: test projects that should stay aligned with the implementation.

Prefer small, targeted changes. Do not mix frontend and backend refactors unless the feature crosses the API boundary.

When changing the frontend:
- Keep code in TypeScript with functional React components and existing naming/style conventions.
- Reuse code from `src/frontend/src/api`, `src/frontend/src/hooks`, and `src/frontend/src/components` before adding new abstractions.
- Preserve accessible names and roles because the frontend tests rely on them.

When changing the backend:
- Follow the existing minimal API structure: endpoint mappings in `Endpoints`, domain models in `Models`, service contracts in `Services`.
- Keep endpoint handlers thin and put state or business rules into services.
- Return concrete HTTP results rather than throwing for expected validation or not-found cases.

When changing tests:
- Update or add the narrowest tests that exercise the touched behavior.
- Keep frontend tests in `test/frontend` and backend tests in `test/backend/MockEcommerce.Api.Tests`.

Validation expectations:
- Frontend: run the smallest relevant `vitest` scope if dependencies are installed.
- Backend: run the smallest relevant `dotnet test` scope for the touched API/service code.
- If validation cannot run because dependencies are missing, state that clearly.

Known repo-specific risk:
- The cart flow is incomplete in the current backend. Check cart endpoint and service implementations before assuming add-to-cart behavior works end to end.