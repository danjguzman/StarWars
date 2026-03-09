import { getCachedValue } from "@utils/clientCache";
import { resourceIdFromUrl, resourceKeyFromUrl } from "@utils/swapi";

export const RESOURCE_COLLECTIONS = [
    "films",
    "people",
    "planets",
    "species",
    "vehicles",
    "starships",
] as const;

type ResourceCollection = (typeof RESOURCE_COLLECTIONS)[number];

export interface NamedResource {
    url: string;
    name?: string;
    title?: string;
}

export interface ResolvedResourceItem {
    url: string;
    name: string;
}

function isResourceCollection(value: string | null): value is ResourceCollection {
    return value !== null && RESOURCE_COLLECTIONS.includes(value as ResourceCollection);
}

export function allResourceCacheKey(resource: ResourceCollection) {
    return `${resource}:all`;
}

export function normalizeResourcePath(url: string) {
    return url.replace(/^https?:\/\/[^/]+/i, "").replace(/\/+$/, "");
}

export function resourceDisplayName(resource: NamedResource | null | undefined) {
    return resource?.name ?? resource?.title ?? null;
}

export function resourceCacheKeyFromUrl(url: string) {
    const resourceKey = resourceKeyFromUrl(normalizeResourcePath(url));

    if (!isResourceCollection(resourceKey)) {
        return null;
    }

    return allResourceCacheKey(resourceKey);
}

export function findCachedResourceNameByUrl(url: string) {
    const preferredCacheKey = resourceCacheKeyFromUrl(url);
    const targetPath = normalizeResourcePath(url);
    const targetId = resourceIdFromUrl(url);
    const targetResourceKey = resourceKeyFromUrl(targetPath);

    const orderedCacheKeys = preferredCacheKey
        ? [preferredCacheKey, ...RESOURCE_COLLECTIONS.map((resource) => allResourceCacheKey(resource)).filter((cacheKey) => cacheKey !== preferredCacheKey)]
        : RESOURCE_COLLECTIONS.map((resource) => allResourceCacheKey(resource));

    for (const cacheKey of orderedCacheKeys) {
        const cachedResources = getCachedValue<NamedResource[]>(cacheKey) ?? [];

        const strictPathMatch = cachedResources.find((resource) => {
            if (!resource.url) return false;
            return normalizeResourcePath(resource.url) === targetPath;
        });

        if (strictPathMatch) {
            return resourceDisplayName(strictPathMatch);
        }

        const idMatch = cachedResources.find((resource) => {
            if (!resource.url || !targetId || !targetResourceKey) return false;

            const resourcePath = normalizeResourcePath(resource.url);
            const resourceId = resourceIdFromUrl(resource.url);
            const resourceKey = resourceKeyFromUrl(resourcePath);

            return resourceKey === targetResourceKey && resourceId === targetId;
        });

        if (idMatch) {
            return resourceDisplayName(idMatch);
        }
    }

    return null;
}

export function getCachedResolvedResourceNames(urls: string[]) {
    return urls.reduce<Record<string, string>>((accumulator, url) => {
        const cachedName = findCachedResourceNameByUrl(url);

        if (cachedName) {
            accumulator[url] = cachedName;
        }

        return accumulator;
    }, {});
}

export function resolveResourceItems(urls: string[], resolvedNames: Record<string, string>) {
    return urls.map((url, index) => ({
        url,
        name: resolvedNames[url] ?? findCachedResourceNameByUrl(url) ?? `Unknown ${index + 1}`,
    }));
}
