import {
    apiUrl,
    getJson,
    isSwapiPagedResponse,
} from "@services/api";
import { type Starship, type SwapiPagedResponse } from "@types";
import { getCachedPage, getCachedValue, setCachedValue } from "@utils/clientCache";
import {
    STARSHIPS_ALL_CACHE_KEY,
    STARSHIPS_ALL_CACHE_TTL_MS,
    STARSHIPS_CACHE_NAME,
    STARSHIPS_CACHE_TTL_MS,
    STARSHIPS_FALLBACK_PAGE_SIZE,
} from "@utils/consts";

export interface StarshipsPage {
    starships: Starship[];
    hasMore: boolean;
}

/* Return one page-shaped chunk of starships, preferably from the preloaded full-list cache. */
export async function fetchStarshipsPage(page: number, pageSize = STARSHIPS_FALLBACK_PAGE_SIZE) {
    const cachedAllStarships = getCachedValue<Starship[]>(STARSHIPS_ALL_CACHE_KEY);

    if (cachedAllStarships) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            starships: cachedAllStarships.slice(start, end),
            hasMore: end < cachedAllStarships.length,
        } satisfies StarshipsPage;
    }

    const data = await getJson<Starship[] | SwapiPagedResponse<Starship>>(
        apiUrl(`/starships?page=${page}`)
    );

    if (Array.isArray(data)) {
        setCachedValue(STARSHIPS_ALL_CACHE_KEY, data, STARSHIPS_ALL_CACHE_TTL_MS);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            starships: data.slice(start, end),
            hasMore: end < data.length,
        } satisfies StarshipsPage;
    }

    if (isSwapiPagedResponse(data)) {
        return {
            starships: data.results,
            hasMore: Boolean(data.next),
        } satisfies StarshipsPage;
    }

    throw new Error("Unexpected starships response shape");
}

/* Load one starships page through the shared page cache wrapper. */
export async function loadStarships(page: number) {
    const pageData = await getCachedPage(
        STARSHIPS_CACHE_NAME,
        page,
        fetchStarshipsPage,
        STARSHIPS_CACHE_TTL_MS
    );

    return {
        items: pageData.starships,
        hasMore: pageData.hasMore,
    };
}

/* Fetch the full list of starships. */
export function fetchStarships() {
    return getJson<Starship[]>(apiUrl("/starships"));
}

/* Fetch one starship by id. */
export function fetchStarshipById(id: string) {
    return getJson<Starship>(apiUrl(`/starships/${id}`));
}
