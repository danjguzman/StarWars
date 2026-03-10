import { apiUrl, getJson, isSwapiPagedResponse } from "@services/api";
import { setCachedValue } from "@utils/clientCache";
import { allResourceCacheKey, RESOURCE_COLLECTIONS } from "@utils/resourceResolve";

/*
 * This file preloads the main SWAPI resource collections when the app starts.
 * It collects every entity for each supported resource type and stores the results
 * in the client cache so the rest of the app can read from cache first.
 *
 * This is especially useful because SWAPI.info does not support paging in the way
 * this app needs for its list and infinite-scroll flows, so the app preloads full
 * collections and then simulates paging by slicing cached data into chunks.
 */

const PRELOAD_CACHE_TTL_MS = 5 * 60 * 1000;

type PreloadEndpoint = (typeof RESOURCE_COLLECTIONS)[number];
type SwapiEntity = Record<string, unknown>;

let preloadPromise: Promise<void> | null = null;

/* Fetch every entity for one resource type, including all paged results when needed. */
async function collectAllEntities(endpoint: PreloadEndpoint): Promise<SwapiEntity[]> {
    const initialData = await getJson<unknown>(apiUrl(`/${endpoint}`));

    if (Array.isArray(initialData)) {
        return initialData as SwapiEntity[];
    }

    if (!isSwapiPagedResponse<SwapiEntity>(initialData)) {
        throw new Error(`Unexpected response shape for ${endpoint}`);
    }

    const entities = [...initialData.results];
    let nextUrl = initialData.next;

    while (nextUrl) {
        const nextPageData = await getJson<unknown>(nextUrl);

        if (!isSwapiPagedResponse<SwapiEntity>(nextPageData)) {
            throw new Error(`Unexpected paged response shape for ${endpoint}`);
        }

        entities.push(...nextPageData.results);
        nextUrl = nextPageData.next;
    }

    return entities;
}

/* Preload every supported resource collection and save each one in cache. */
async function preloadSwapiDataInternal(): Promise<void> {
    await Promise.all(
        RESOURCE_COLLECTIONS.map(async (endpoint) => {
            const entities = await collectAllEntities(endpoint);
            setCachedValue(allResourceCacheKey(endpoint), entities, PRELOAD_CACHE_TTL_MS);
        })
    );
}

/* Start preload work once and reuse the same promise for repeated callers. */
export function preloadSwapiData(): Promise<void> {
    if (!preloadPromise) {
        preloadPromise = preloadSwapiDataInternal().catch((error) => {
            preloadPromise = null;
            throw error;
        });
    }

    return preloadPromise;
}
