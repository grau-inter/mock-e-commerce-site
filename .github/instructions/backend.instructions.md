---
applyTo: "src/backend/**/*.cs"
description: "Use when editing the .NET backend API, services, models, or program setup. Keep minimal API endpoints thin and push mutable cart logic into services."
---

# Backend Instructions

Backend conventions for this repo:
- Route registration lives in endpoint extension classes under `Endpoints`.
- Service interfaces and implementations live under `Services`.
- Models should stay simple and serializable for minimal API responses.

Implementation guidance:
- Keep endpoint handlers responsible for HTTP mapping, validation, and result selection.
- Put shared state changes and lookup/update behavior in services.
- Favor deterministic in-memory behavior over hidden side effects.
- For expected failures, return typed results such as `NotFound`, `ValidationProblem`, or `NoContent` instead of throwing exceptions.

Testing guidance:
- Add service tests for stateful/cart behavior.
- Add endpoint tests for route-level behavior, especially for validation and not-found cases.
- Keep test names in the current `Method_Scenario_Result` style.