---
applyTo: "src/frontend/**/*.{ts,tsx,css}"
description: "Use when editing the React frontend, hooks, API client, or styling in src/frontend. Preserve accessibility labels and keep component, hook, and API concerns separated."
---

# Frontend Instructions

Use the existing structure:
- `components` for presentational UI.
- `hooks` for data-fetching or stateful reuse.
- `api` for HTTP calls.
- `types` for shared frontend types.

Prefer these patterns:
- Keep components focused and pass behavior through props instead of creating global state.
- Keep fetch logic out of components when a hook or API helper already owns it.
- Preserve button labels, headings, and status/error roles used by tests.
- Match the existing CSS class naming style (`block__element`).

Avoid these changes unless required by the task:
- Reorganizing component folders.
- Introducing a new state library.
- Converting simple components to a more abstract pattern without a concrete need.

Validation:
- Prefer the narrowest relevant `vitest` test file.
- If frontend dependencies are not installed, note that before finishing.