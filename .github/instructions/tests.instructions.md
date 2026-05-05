---
applyTo: "test/**/*.{ts,tsx,cs}"
description: "Use when editing frontend or backend tests for this repo. Prefer behavior-focused tests close to the touched surface and keep assertions aligned with existing accessible UI text and API contracts."
---

# Test Instructions

For frontend tests:
- Prefer Testing Library queries by role, label, or visible text.
- Mock API-layer functions or hooks at the same boundary already used by nearby tests.
- Assert user-visible states rather than implementation details.

For backend tests:
- Use service tests for state transitions and endpoint tests for HTTP contracts.
- Cover success, invalid input, and not-found cases when touching an endpoint.
- Reuse the existing xUnit style and `WebApplicationFactory<Program>` pattern for API tests.

General:
- Keep tests narrow and deterministic.
- If a missing implementation gap is discovered, capture it in the test or call it out explicitly.