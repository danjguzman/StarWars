import {
    apiUrl,
    getJson,
    isSwapiPagedResponse,
} from "@services/api";
import { type Film, type SwapiPagedResponse } from "@types";
import { getCachedPage, getCachedValue, setCachedValue } from "@utils/clientCache";
import {
    FILMS_ALL_CACHE_KEY,
    FILMS_ALL_CACHE_TTL_MS,
    FILMS_CACHE_NAME,
    FILMS_CACHE_TTL_MS,
    FILMS_FALLBACK_PAGE_SIZE,
} from "@utils/consts";

export interface FilmsPage {
    films: Film[];
    hasMore: boolean;
}

/* Return one page-shaped chunk of films, preferably from the preloaded full-list cache. */
export async function fetchFilmsPage(page: number, pageSize = FILMS_FALLBACK_PAGE_SIZE) {
    const cachedAllFilms = getCachedValue<Film[]>(FILMS_ALL_CACHE_KEY);

    if (cachedAllFilms) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            films: cachedAllFilms.slice(start, end),
            hasMore: end < cachedAllFilms.length,
        } satisfies FilmsPage;
    }

    const data = await getJson<Film[] | SwapiPagedResponse<Film>>(
        apiUrl(`/films?page=${page}`)
    );

    if (Array.isArray(data)) {
        setCachedValue(FILMS_ALL_CACHE_KEY, data, FILMS_ALL_CACHE_TTL_MS);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            films: data.slice(start, end),
            hasMore: end < data.length,
        } satisfies FilmsPage;
    }

    if (isSwapiPagedResponse(data)) {
        return {
            films: data.results,
            hasMore: Boolean(data.next),
        } satisfies FilmsPage;
    }

    throw new Error("Unexpected films response shape");
}

/* Load one films page through the shared page cache wrapper. */
export async function loadFilms(page: number) {
    const pageData = await getCachedPage(
        FILMS_CACHE_NAME,
        page,
        fetchFilmsPage,
        FILMS_CACHE_TTL_MS
    );

    return {
        items: pageData.films,
        hasMore: pageData.hasMore,
    };
}

/* Fetch the full list of films. */
export function fetchFilms() {
    return getJson<Film[]>(apiUrl("/films"));
}

/* Fetch one film by id. */
export function fetchFilmById(id: string) {
    return getJson<Film>(apiUrl(`/films/${id}`));
}
