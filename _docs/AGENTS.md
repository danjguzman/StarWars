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

People images live at:

- /backend/assets/img/people

Backend should expose these images to the frontend via a static route.

---

## Architecture Standards

- API requests should be centralized (service + store), not scattered across components.
- Stores own fetching; components consume store state and call store actions.
- Prefer URL-based caching and lookups (SWAPI relationships are URLs).
- Use readable names (prefer “ByUrl” over “ById”).

---

## TypeScript Standards

- Enable strict TypeScript.
- Avoid 'any' types.
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
