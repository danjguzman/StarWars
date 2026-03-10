import {
    apiUrl,
    getJson,
    isSwapiPagedResponse,
    type SwapiPagedResponse,
} from "@services/api";
import { type Person } from "@types";
import { getCachedPage, getCachedValue, setCachedValue } from "@utils/clientCache";
import {
    PEOPLE_ALL_CACHE_KEY,
    PEOPLE_ALL_CACHE_TTL_MS,
    PEOPLE_CACHE_NAME,
    PEOPLE_CACHE_TTL_MS,
    PEOPLE_FALLBACK_PAGE_SIZE,
} from "@utils/consts";
/*
 * This file holds the People-specific API helpers.
 * The app normally preloads the full people list into cache at startup.
 * Because the store still loads people in page-shaped chunks for infinite scroll,
 * `fetchPeoplePage` first slices that preloaded full-list cache and only falls back
 * to a network request when the full cached data is missing.
 * This file also fetches the full people collection, loads one cached page-shaped
 * chunk of people for the store, and fetches one person by id.
 */

export interface PeoplePage {
    people: Person[];
    hasMore: boolean;
}

/* Return one page-shaped chunk of people, preferably from the preloaded full-list cache. */
export async function fetchPeoplePage(page: number, pageSize = PEOPLE_FALLBACK_PAGE_SIZE) {
    /* Read the full cached people list first, because preload usually puts it there. */
    const cachedAllPeople = getCachedValue<Person[]>(PEOPLE_ALL_CACHE_KEY);

    /* Slice the cached full list into the requested page shape when it is available. */
    if (cachedAllPeople) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            people: cachedAllPeople.slice(start, end),
            hasMore: end < cachedAllPeople.length,
        } satisfies PeoplePage;
    }

    /* Fall back to the API only when the full cached people list is not available. */
    const data = await getJson<Person[] | SwapiPagedResponse<Person>>(
        apiUrl(`/people?page=${page}`)
    );

    /* Handle APIs that return the whole people list as one array. */
    if (Array.isArray(data)) {
        setCachedValue(PEOPLE_ALL_CACHE_KEY, data, PEOPLE_ALL_CACHE_TTL_MS);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            people: data.slice(start, end),
            hasMore: end < data.length,
        } satisfies PeoplePage;
    }

    /* Handle APIs that return a normal paged SWAPI response. */
    if (isSwapiPagedResponse(data)) {
        return {
            people: data.results,
            hasMore: Boolean(data.next),
        } satisfies PeoplePage;
    }

    /* Fail loudly if the API response shape does not match either expected format. */
    throw new Error("Unexpected people response shape");
}

/* Load one people page through the shared page cache wrapper. */
export async function loadPeople(page: number) {
    const pageData = await getCachedPage(
        PEOPLE_CACHE_NAME,
        page,
        fetchPeoplePage,
        PEOPLE_CACHE_TTL_MS
    );

    return {
        items: pageData.people,
        hasMore: pageData.hasMore,
    };
}

/* Fetch the full list of people. */
export function fetchPeople() {
    return getJson<Person[]>(apiUrl("/people"));
}

/* Fetch one person by id. */
export function fetchPersonById(id: string) {
    return getJson<Person>(apiUrl(`/people/${id}`));
}
