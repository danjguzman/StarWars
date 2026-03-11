import {
    apiUrl,
    getJson,
    isSwapiPagedResponse,
} from "@services/api";
import { type Planet, type SwapiPagedResponse } from "@types";
import { getCachedPage, getCachedValue, setCachedValue } from "@utils/clientCache";
import {
    PLANETS_ALL_CACHE_KEY,
    PLANETS_ALL_CACHE_TTL_MS,
    PLANETS_CACHE_NAME,
    PLANETS_CACHE_TTL_MS,
    PLANETS_FALLBACK_PAGE_SIZE,
} from "@utils/consts";

export interface PlanetsPage {
    planets: Planet[];
    hasMore: boolean;
}

/* Return one page-shaped chunk of planets, preferably from the preloaded full-list cache. */
export async function fetchPlanetsPage(page: number, pageSize = PLANETS_FALLBACK_PAGE_SIZE) {
    const cachedAllPlanets = getCachedValue<Planet[]>(PLANETS_ALL_CACHE_KEY);

    if (cachedAllPlanets) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            planets: cachedAllPlanets.slice(start, end),
            hasMore: end < cachedAllPlanets.length,
        } satisfies PlanetsPage;
    }

    const data = await getJson<Planet[] | SwapiPagedResponse<Planet>>(
        apiUrl(`/planets?page=${page}`)
    );

    if (Array.isArray(data)) {
        setCachedValue(PLANETS_ALL_CACHE_KEY, data, PLANETS_ALL_CACHE_TTL_MS);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            planets: data.slice(start, end),
            hasMore: end < data.length,
        } satisfies PlanetsPage;
    }

    if (isSwapiPagedResponse(data)) {
        return {
            planets: data.results,
            hasMore: Boolean(data.next),
        } satisfies PlanetsPage;
    }

    throw new Error("Unexpected planets response shape");
}

/* Load one planets page through the shared page cache wrapper. */
export async function loadPlanets(page: number) {
    const pageData = await getCachedPage(
        PLANETS_CACHE_NAME,
        page,
        fetchPlanetsPage,
        PLANETS_CACHE_TTL_MS
    );

    return {
        items: pageData.planets,
        hasMore: pageData.hasMore,
    };
}

/* Fetch the full list of planets. */
export function fetchPlanets() {
    return getJson<Planet[]>(apiUrl("/planets"));
}

/* Fetch one planet by id. */
export function fetchPlanetById(id: string) {
    return getJson<Planet>(apiUrl(`/planets/${id}`));
}
