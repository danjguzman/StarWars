import { type NamedResource } from "@types";
import { getCachedValue } from "@utils/clientCache";
import { resourceIdFromUrl, resourceKeyFromUrl } from "@utils/swapi";

/*
 * This file helps the app turn SWAPI resource URLs into UI-friendly data.
 * It knows how to normalize URLs, look up cached resource names, collect related URLs,
 * and build simple `{ url, name }` items for modal menus and related resource buttons.
 */

type ResourceCollection = (typeof RESOURCE_COLLECTIONS)[number];

/* List the resource collections that this resolver knows how to read from cache. */
export const RESOURCE_COLLECTIONS = [
    "films",
    "people",
    "planets",
    "species",
    "vehicles",
    "starships",
] as const;

/* Check whether a resource key is one of the collections supported by this file. */
function isResourceCollection(value: string | null): value is ResourceCollection {
    return value !== null && RESOURCE_COLLECTIONS.includes(value as ResourceCollection);
}

/* Build the cache key for one full resource collection. */
export function allResourceCacheKey(resource: ResourceCollection) {
    return `${resource}:all`;
}

/* Strip the domain and trailing slash so resource URLs can be compared more reliably. */
export function normalizeResourcePath(url: string) {
    return url.replace(/^https?:\/\/[^/]+/i, "").replace(/\/+$/, "");
}

/* Pick the best display label from a resource object. */
export function resourceDisplayName(resource: NamedResource | null | undefined) {
    return resource?.name ?? resource?.title ?? null;
}

/* Work out which collection cache a resource URL most likely belongs to. */
export function resourceCacheKeyFromUrl(url: string) {
    const resourceKey = resourceKeyFromUrl(normalizeResourcePath(url));
    if (!isResourceCollection(resourceKey)) return null;
    return allResourceCacheKey(resourceKey);
}

/* Find a resource name from the in-memory cache by matching its URL or id. */
export function findCachedResourceNameByUrl(url: string) {
    const preferredCacheKey = resourceCacheKeyFromUrl(url);
    const targetPath = normalizeResourcePath(url);
    const targetId = resourceIdFromUrl(url);
    const targetResourceKey = resourceKeyFromUrl(targetPath);

    /* Check the most likely cache first, then fall back to the rest if needed. */
    const orderedCacheKeys = preferredCacheKey
        ? [preferredCacheKey, ...RESOURCE_COLLECTIONS.map((resource) => allResourceCacheKey(resource)).filter((cacheKey) => cacheKey !== preferredCacheKey)]
        : RESOURCE_COLLECTIONS.map((resource) => allResourceCacheKey(resource));

    /* Look through each cached collection until a matching resource is found. */
    for (const cacheKey of orderedCacheKeys) {
        const cachedResources = getCachedValue<NamedResource[]>(cacheKey) ?? [];

        /* Try to match the full normalized URL path first. */
        const strictPathMatch = cachedResources.find((resource) => {
            if (!resource.url) return false;
            return normalizeResourcePath(resource.url) === targetPath;
        });

        if (strictPathMatch) return resourceDisplayName(strictPathMatch);

        /* If the full path did not match, try matching by resource type and id instead. */
        const idMatch = cachedResources.find((resource) => {
            if (!resource.url || !targetId || !targetResourceKey) return false;
            const resourcePath = normalizeResourcePath(resource.url);
            const resourceId = resourceIdFromUrl(resource.url);
            const resourceKey = resourceKeyFromUrl(resourcePath);
            return resourceKey === targetResourceKey && resourceId === targetId;
        });

        if (idMatch) return resourceDisplayName(idMatch);
    }

    /* Return nothing when the resource name could not be found in cache. */
    return null;
}

/* Resolve as many names as possible from cache for a list of resource URLs. */
export function getCachedResolvedResourceNames(urls: string[]) {
    return urls.reduce<Record<string, string>>((accumulator, url) => {
        const cachedName = findCachedResourceNameByUrl(url);
        if (cachedName) accumulator[url] = cachedName;
        return accumulator;
    }, {});
}

/* Merge multiple related-resource URL groups into one deduped list. */
export function collectRelatedResourceUrls(resourceGroups: Array<readonly string[] | null | undefined>) {
    return Array.from(new Set(resourceGroups.flatMap((group) => group ?? [])));
}

/* Build UI-ready related items by pairing each URL with its resolved display name. */
export function resolveResourceItems(urls: string[], resolvedNames: Record<string, string>) {
    return urls.map((url, index) => ({
        url,
        name: resolvedNames[url] ?? findCachedResourceNameByUrl(url) ?? `Unknown ${index + 1}`,
    }));
}
