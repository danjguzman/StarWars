import { useEffect, useMemo, useState } from "react";
import { getJson } from "@services/api";
import {
    type NamedResource,
    getCachedResolvedResourceNames,
    resourceDisplayName,
} from "@utils/resourceResolve";

/*
 * This file holds a reusable hook for turning resource URLs into display names.
 * It first checks the client cache for known names, then fetches any missing
 * resources and merges those fetched names back into one lookup object.
 */

/* Resolve a list of resource URLs into a single map of `url -> display name`. */
export function useResolvedResourceNames(resourceUrls: string[]) {

    /* Keep names that were fetched because they were not already in cache. */
    const [fetchedResourceNames, setFetchedResourceNames] = useState<Record<string, string>>({});

    /* Read any names that can already be resolved from the client cache. */
    const cachedResourceNames = useMemo(() => {
        return getCachedResolvedResourceNames(resourceUrls);
    }, [resourceUrls]);

    /* Combine cached names with fetched names into one lookup object for the UI. */
    const resolvedResourceNames = useMemo(
        () => ({
            ...cachedResourceNames,
            ...fetchedResourceNames,
        }),
        [cachedResourceNames, fetchedResourceNames]
    );

    useEffect(() => {

        /* Track whether the hook is still mounted before saving async results. */
        let isMounted = true;

        /* Only fetch URLs that still do not have a cached name. */
        const unresolvedUrls = resourceUrls.filter((url) => !cachedResourceNames[url]);

        /* Stop early when every resource name was already resolved from cache. */
        if (unresolvedUrls.length === 0) {
            return () => {
                isMounted = false;
            };
        }

        /* Fetch each missing resource so its display name can be read from the response. */
        Promise.all(

            unresolvedUrls.map(async (url) => {
                try {
                    const resource = await getJson<NamedResource>(url);
                    const displayName = resourceDisplayName(resource);

                    /* Return a URL/name pair only when the resource has a usable label. */
                    return displayName ? [url, displayName] as const : null;
                } catch {

                    /* Ignore failed resource fetches and leave them unresolved for now. */
                    return null;
                }
            })

        ).then((entries) => {

            /* Stop if the hook was unmounted before the requests finished. */
            if (!isMounted) return;

            /* Turn the fetched URL/name pairs into the same lookup-object shape used by the UI. */
            const fetchedNames = entries.reduce<Record<string, string>>((accumulator, entry) => {
                if (!entry) return accumulator;

                const [url, displayName] = entry;
                accumulator[url] = displayName;
                return accumulator;
            }, {});

            /* Stop if none of the fetches produced a usable name. */
            if (Object.keys(fetchedNames).length === 0) return;

            /* Merge the new fetched names into hook state without losing earlier results. */
            setFetchedResourceNames((current) => ({
                ...current,
                ...fetchedNames,
            }));
        });

        /* Mark the effect as inactive so async work does not update after unmount. */
        return () => {
            isMounted = false;
        };
    }, [cachedResourceNames, resourceUrls]);

    return resolvedResourceNames;
}
