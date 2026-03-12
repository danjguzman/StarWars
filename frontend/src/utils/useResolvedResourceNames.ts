import { useMemo } from "react";
import { getPreloadedCollection } from "@services/preloadService";
import {
    RESOURCE_COLLECTIONS,
    getCachedResolvedResourceNames,
    normalizeResourcePath,
    resourceDisplayName,
} from "@utils/resourceResolve";
import { resourceIdFromUrl, resourceKeyFromUrl } from "@utils/swapi";
import { type NamedResource } from "@types";

/*
 * This file holds a reusable hook for turning resource URLs into display names.
 * It resolves names only from the app's local data sources: the current cache
 * and the preloaded in-memory collections gathered when the app boots.
 */

function isSupportedResourceCollection(value: string | null): value is (typeof RESOURCE_COLLECTIONS)[number] {
    return value !== null && RESOURCE_COLLECTIONS.includes(value as (typeof RESOURCE_COLLECTIONS)[number]);
}

function findPreloadedResourceNameByUrl(url: string) {
    const targetPath = normalizeResourcePath(url);
    const targetId = resourceIdFromUrl(url);
    const resourceKey = resourceKeyFromUrl(targetPath);

    if (!isSupportedResourceCollection(resourceKey)) return null;

    const preloadedResources = getPreloadedCollection<NamedResource>(resourceKey) ?? [];

    const strictPathMatch = preloadedResources.find((resource) => {
        if (!resource.url) return false;
        return normalizeResourcePath(resource.url) === targetPath;
    });

    if (strictPathMatch) return resourceDisplayName(strictPathMatch);

    const idMatch = preloadedResources.find((resource) => {
        if (!resource.url || !targetId) return false;
        return resourceIdFromUrl(resource.url) === targetId;
    });

    return resourceDisplayName(idMatch);
}

/* Resolve a list of resource URLs into a single map of `url -> display name`. */
export function useResolvedResourceNames(resourceUrls: string[]) {
    return useMemo(() => {
        const cachedResourceNames = getCachedResolvedResourceNames(resourceUrls);

        return resourceUrls.reduce<Record<string, string>>((resolvedNames, url) => {
            const cachedName = cachedResourceNames[url];
            if (cachedName) {
                resolvedNames[url] = cachedName;
                return resolvedNames;
            }

            const preloadedName = findPreloadedResourceNameByUrl(url);
            if (preloadedName) {
                resolvedNames[url] = preloadedName;
            }

            return resolvedNames;
        }, {});
    }, [resourceUrls]);
}
