# Star Wars Explorer — App Requirements

- API Documentation: https://swapi.info/documentation
- Mantine UI Documentation: https://mantine.dev/getting-started/
- Note that these may not be 100% exclusive, and changes can be made per prompt.
- Prompt requests overwrite requirements.

## Purpose

Build a simple Star Wars browsing app that demonstrates production-quality frontend architecture:

- Detailed entity views
- Related-entity navigation
- Centralized state management (store layer owns fetching)
- Reusable Mantine-based components
- Clean loading/error/empty handling everywhere
- Responsive UI (mobile + desktop)
- Storybook examples + unit tests

This file is context only. The agent should wait for explicit instructions for each step.

---

## Data Source

Use a SWAPI-compatible API returning entities with URL references (example URLs are from swapi.info).

Entity types used:

- People
- Planets
- Films
- Species
- Vehicles
- Starships

Important:

- Relationships are expressed as URLs, so related entity lookups are done by URL.
- Navigation should be derived from these URLs.

---

## People (Person) Data Requirements

A Person object includes at least:

- name
- height
- mass
- hair_color
- skin_color
- eye_color
- birth_year
- gender
- homeworld (url)
- films (url array)
- species (url array)
- vehicles (url array)
- starships (url array)
- created
- edited
- url

The app must display these fields on the Person detail screen.

Example Person:

```json
{
    "name": "Luke Skywalker",
    "height": "172",
    "mass": "77",
    "hair_color": "blond",
    "skin_color": "fair",
    "eye_color": "blue",
    "birth_year": "19BBY",
    "gender": "male",
    "homeworld": "https://swapi.info/api/planets/1",
    "films": [
        "https://swapi.info/api/films/1",
        "https://swapi.info/api/films/2",
        "https://swapi.info/api/films/3",
        "https://swapi.info/api/films/6"
    ],
    "species": [],
    "vehicles": [
        "https://swapi.info/api/vehicles/14",
        "https://swapi.info/api/vehicles/30"
    ],
    "starships": [
        "https://swapi.info/api/starships/12",
        "https://swapi.info/api/starships/22"
    ],
    "created": "2014-12-09T13:50:51.644000Z",
    "edited": "2014-12-20T21:17:56.891000Z",
    "url": "https://swapi.info/api/people/1"
}
```

---

## Related Entity Display and Navigation

Person detail view must show related entities and allow navigation:

- Homeworld -> Planet detail page
- Films -> Film detail pages
- Species -> Species detail pages
- Vehicles -> Vehicle detail pages
- Starships -> Starship detail pages

The app must support navigation between entity types (people, planets, starships, etc.) via these relationships.

---

## List UI Requirements for People, Species, Vehicles, Planets, Starships, Films.

The list view must:

- Render as a flex row that wraps (tile/card layout), renderd in a circle (border radius + overflow hidden)
- Images must fit proportionally inside circle tile.
- Show an image icon per person (if available) plus at least the name
- Use virtualization so offscreen items are not mounted
- Use infinite scrolling to fetch more results when reaching the bottom

---

## Local Image Icon Requirement

People list tiles display image icons stored in the monorepo:

- /backend/assets/img/people
- /frontend (React app)

Backend must expose these images to the frontend (static hosting route).

If an image does not exist for a person, show a fallback icon/avatar.

Image mapping can be:

- A naming convention derived from person name, or
- A frontend mapping file (name/url -> filename)

Choose one approach and use it consistently.

---

## State Management Requirements

A store layer must own all API data fetching.

Rules:

- No ad hoc fetching inside React components
- Stores expose state and actions
- Loading/error/empty states must be representable from store state

Because the API uses URL relationships, caching should be URL-based:

- Cache entities by URL per type
- Lists should store ordered arrays of entity URLs

Action naming should be readable and URL-based:

- fetchEntityById
- fetchEntityByUrl
- ensureEntityByUrl
- fetchPeopleFirstPage
- fetchPeopleNextPage

---

## Loading, Error, and Empty Handling

Every major UI area must handle:

- Loading
- Error (with meaningful message and retry when applicable)
- Empty results

This applies to:

- People list
- Person detail sections (related entity lists)
- Entity detail pages for other types

---

## Component Architecture Requirements

- Use Mantine primitives as the base
- Separate container and presentational components:
    - Containers call store actions and select state
    - Presentational components render props and handle UI only

Reusable components should exist for common states:

- LoadingState
- ErrorState
- EmptyState
- Reusable entity tile/card for list, display items

---

## Storybook Requirement

Create Storybook stories for at least 2–3 components showing multiple states.

Examples of states to demonstrate:

- Loading
- Populated
- Error
- Empty

Stories must not require live API calls.

---

## Code Quality Requirement

- Strict TypeScript
- Avoid 'any' types
- Unit tests for non-trivial logic (Jest + React Testing Library)
