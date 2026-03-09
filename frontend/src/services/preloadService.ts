import { apiUrl, getJson, isSwapiPagedResponse } from "@services/api";
import { setCachedValue } from "@utils/clientCache";

const PRELOAD_CACHE_TTL_MS = 5 * 60 * 1000;

const PRELOAD_ENDPOINTS = [
    "films",
    "people",
    "planets",
    "species",
    "vehicles",
    "starships",
] as const;

type PreloadEndpoint = (typeof PRELOAD_ENDPOINTS)[number];
type SwapiEntity = Record<string, unknown>;

let preloadPromise: Promise<void> | null = null;

function allCacheKey(endpoint: PreloadEndpoint) {
    return `${endpoint}:all`;
}

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

async function preloadSwapiDataInternal(): Promise<void> {
    await Promise.all(
        PRELOAD_ENDPOINTS.map(async (endpoint) => {
            const entities = await collectAllEntities(endpoint);
            setCachedValue(allCacheKey(endpoint), entities, PRELOAD_CACHE_TTL_MS);
        })
    );
}

export function preloadSwapiData(): Promise<void> {
    if (!preloadPromise) {
        preloadPromise = preloadSwapiDataInternal().catch((error) => {
            preloadPromise = null;
            throw error;
        });
    }

    return preloadPromise;
}
