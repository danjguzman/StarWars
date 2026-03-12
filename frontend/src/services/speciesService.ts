import {
    apiUrl,
    getJson,
    isSwapiPagedResponse,
} from "@services/api";
import { getPreloadedCollection } from "@services/preloadService";
import { type Species, type SwapiPagedResponse } from "@types";
import { getCachedPage, getCachedValue, setCachedValue } from "@utils/clientCache";
import {
    SPECIES_ALL_CACHE_KEY,
    SPECIES_ALL_CACHE_TTL_MS,
    SPECIES_CACHE_NAME,
    SPECIES_CACHE_TTL_MS,
    SPECIES_FALLBACK_PAGE_SIZE,
} from "@utils/consts";

export interface SpeciesPage {
    species: Species[];
    hasMore: boolean;
}

/* Return one page-shaped chunk of species, preferably from the preloaded full-list cache. */
export async function fetchSpeciesPage(page: number, pageSize = SPECIES_FALLBACK_PAGE_SIZE) {
    const cachedAllSpecies = getCachedValue<Species[]>(SPECIES_ALL_CACHE_KEY);
    const preloadedSpecies = getPreloadedCollection<Species>("species");
    const sourceSpecies = cachedAllSpecies ?? preloadedSpecies;

    if (!cachedAllSpecies && preloadedSpecies) {
        setCachedValue(SPECIES_ALL_CACHE_KEY, preloadedSpecies, SPECIES_ALL_CACHE_TTL_MS);
    }

    if (sourceSpecies) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            species: sourceSpecies.slice(start, end),
            hasMore: end < sourceSpecies.length,
        } satisfies SpeciesPage;
    }

    const data = await getJson<Species[] | SwapiPagedResponse<Species>>(
        apiUrl(`/species?page=${page}`)
    );

    if (Array.isArray(data)) {
        setCachedValue(SPECIES_ALL_CACHE_KEY, data, SPECIES_ALL_CACHE_TTL_MS);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            species: data.slice(start, end),
            hasMore: end < data.length,
        } satisfies SpeciesPage;
    }

    if (isSwapiPagedResponse(data)) {
        return {
            species: data.results,
            hasMore: Boolean(data.next),
        } satisfies SpeciesPage;
    }

    throw new Error("Unexpected species response shape");
}

/* Load one species page through the shared page cache wrapper. */
export async function loadSpecies(page: number) {
    const pageData = await getCachedPage(
        SPECIES_CACHE_NAME,
        page,
        fetchSpeciesPage,
        SPECIES_CACHE_TTL_MS
    );

    return {
        items: pageData.species,
        hasMore: pageData.hasMore,
    };
}

/* Fetch the full list of species. */
export function fetchSpecies() {
    return getJson<Species[]>(apiUrl("/species"));
}

/* Fetch one species by id. */
export function fetchSpeciesById(id: string) {
    return getJson<Species>(apiUrl(`/species/${id}`));
}
