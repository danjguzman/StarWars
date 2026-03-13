# AGENT CONTEXT

## Stack

- React
- TypeScript (strict mode)
- Mantine UI
- Zustand (state management)
- Fetch API
- React Router
- Phosphor-react library for icons
- Storybook
- Jest
- React Testing Library

---

## Repo Layout Expectations

Monorepo contains:

- /backend
- /frontend

Images live at:

- /frontend/public/assets/img

---

## Architecture Standards

- API requests should be centralized (service + store), not scattered across components.
- Stores own fetching; components consume store state and call store actions.
- Prefer URL-based caching and lookups (SWAPI relationships are URLs).
- Use readable names (prefer “ByUrl” over “ById”).

---

## TypeScript Standards

- Enable strict TypeScript.
- Never use `any` in this project, including explicit annotations, casts, helper aliases, or test code.
- Replace `any` with concrete interfaces, generics, unions, `unknown`, or narrow helper types.
- Avoid matcher or helper patterns that introduce the literal `any` token when a typed alternative exists.
- Types live in a central place (frontend /types folder).

---

## UI Standards

- Use Mantine primitives.
- Favor reusable presentational components.
- All major screens handle loading/error/empty states.
- Responsive layout for mobile and desktop.

---

## Quality Standards

- Storybook stories for core components (multiple states).
- Jest + React Testing Library tests for non-trivial logic and store behavior.
- README documents key decisions and tradeoffs.

---

## Creation Rules

- When creating a new page, component, store, or service, also create the related test file(s) in the same task when the logic is non-trivial.
- New prop-driven components should include tests for meaningful prop behavior (conditional rendering, fallback values, callbacks, disabled states, loading/error/empty states, and variants).
- New services should include tests for non-trivial request/response logic, transformation logic, and error handling.
- New pages should include tests when they contain meaningful state, routing behavior, conditional UI, or integration with stores.
- Do not add trivial tests just to increase coverage. Prioritize behavior that can break.
- Prefer colocated tests when the repo pattern allows it.
