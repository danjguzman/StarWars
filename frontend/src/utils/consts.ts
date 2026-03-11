/* Shared app constants. */
export const ASSET_IMAGE_BASE_PATH = "/assets/img";

/* Shared top-level navigation items. */
export const NAV_ITEMS = [
    { label: "Films", path: "films" },
    { label: "People", path: "people" },
    { label: "Planets", path: "planets" },
    { label: "Species", path: "species" },
    { label: "Vehicles", path: "vehicles" },
    { label: "Starships", path: "starships" },
] as const;

/* Shared People data constants. */
export const PEOPLE_FALLBACK_PAGE_SIZE = 12;
export const PEOPLE_ALL_CACHE_KEY = "people:all";
export const PEOPLE_ALL_CACHE_TTL_MS = 5 * 60 * 1000;
export const PEOPLE_CACHE_NAME = "people";
export const PEOPLE_CACHE_TTL_MS = 5 * 60 * 1000;

/* Shared Films data constants. */
export const FILMS_FALLBACK_PAGE_SIZE = 12;
export const FILMS_ALL_CACHE_KEY = "films:all";
export const FILMS_ALL_CACHE_TTL_MS = 5 * 60 * 1000;
export const FILMS_CACHE_NAME = "films";
export const FILMS_CACHE_TTL_MS = 5 * 60 * 1000;

/* Shared Planets data constants. */
export const PLANETS_FALLBACK_PAGE_SIZE = 12;
export const PLANETS_ALL_CACHE_KEY = "planets:all";
export const PLANETS_ALL_CACHE_TTL_MS = 5 * 60 * 1000;
export const PLANETS_CACHE_NAME = "planets";
export const PLANETS_CACHE_TTL_MS = 5 * 60 * 1000;

/* Shared Species data constants. */
export const SPECIES_FALLBACK_PAGE_SIZE = 12;
export const SPECIES_ALL_CACHE_KEY = "species:all";
export const SPECIES_ALL_CACHE_TTL_MS = 5 * 60 * 1000;
export const SPECIES_CACHE_NAME = "species";
export const SPECIES_CACHE_TTL_MS = 5 * 60 * 1000;

/* Shared loading timing constants. */
export const MIN_LOADING_MS = 1000;

/* Shared layout constants for tile-based pages. */
export const TILE_MIN_WIDTH = 260;
export const TILE_HEIGHT = 300;
export const TILE_AVATAR_SIZE = 200;
export const TILE_GAP = 16;
export const CONTENT_MAX_WIDTH = 960;
export const LAYOUT_HORIZONTAL_PADDING = 32;
export const HEADER_HEIGHT = 64;
export const HEADER_HEIGHT_CSS = "calc(4em + env(safe-area-inset-top, 0px))";
export const MAIN_VERTICAL_PADDING = 32;
export const EXTRA_ROWS = 2;
