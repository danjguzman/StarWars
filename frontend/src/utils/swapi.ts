/*
 * This file holds small helpers for working with SWAPI-style URLs.
 * It extracts resource ids and resource keys from URLs, builds app route paths,
 * and turns resource keys into labels the UI can display.
 */

/* Map each supported resource key to the label shown in the UI. */
export const RESOURCE_CATEGORY_LABELS = {
    people: "People",
    species: "Species",
    starships: "Starships",
    vehicles: "Vehicles",
    planets: "Planets",
    films: "Films",
} as const;

/* Represent the valid resource keys supported by the label map above. */
export type ResourceCategoryKey = keyof typeof RESOURCE_CATEGORY_LABELS;

export const SUPPORTED_RESOURCE_CATEGORY_KEYS = Object.keys(RESOURCE_CATEGORY_LABELS) as ResourceCategoryKey[];

export interface ModalRouteTarget {
    resourceKey: ResourceCategoryKey;
    resourceId: string;
    routePath: string;
    closePath: string;
}

/* Check whether a string matches one of the supported resource category keys. */
export function isResourceCategoryKey(value: string | null): value is ResourceCategoryKey {
    return value !== null && value in RESOURCE_CATEGORY_LABELS;
}

/* Build the full SWAPI URL for one person id. */
export function personUrlFromId(id: string) {
    return `https://swapi.info/api/people/${id}`;
}

/* Pull the numeric resource id from the end of a SWAPI URL. */
export function resourceIdFromUrl(url: string) {
    const match = url.match(/\/(\d+)\/?$/);

    if (!match) {
        return null;
    }

    return match[1];
}

/* Pull the resource key, like `people` or `films`, from a SWAPI URL. */
export function resourceKeyFromUrl(url: string) {
    const match = url.match(/\/api\/([^/]+)\//i);

    if (!match) {
        return null;
    }

    return match[1].toLowerCase();
}

/* Pull the resource key from an app pathname, like `/people/1`. */
export function resourceKeyFromPathname(pathname: string) {
    const match = pathname.match(/^\/([^/]+)/);

    if (!match) {
        return null;
    }

    const resourceKey = match[1].toLowerCase();
    return isResourceCategoryKey(resourceKey) ? resourceKey : null;
}

/* Build the app route path from a known resource key and id. */
export function resourceRoutePathFromParts(resourceKey: ResourceCategoryKey, resourceId: string) {
    return `/${resourceKey}/${resourceId}`;
}

/* Build the app route path for a resource URL, like `/people/1`. */
export function resourceRoutePathFromUrl(url: string) {
    const resourceKey = resourceKeyFromUrl(url);
    const resourceId = resourceIdFromUrl(url);

    if (!isResourceCategoryKey(resourceKey) || !resourceId) {
        return null;
    }

    return resourceRoutePathFromParts(resourceKey, resourceId);
}

/* Parse a modal-capable pathname into a resource target, like `/people/1`. */
export function modalRouteTargetFromPathname(pathname: string): ModalRouteTarget | null {
    const match = pathname.match(/^\/([^/]+)\/(\d+)\/?$/i);

    if (!match) {
        return null;
    }

    const resourceKey = match[1].toLowerCase();
    const resourceId = match[2];

    if (!isResourceCategoryKey(resourceKey)) {
        return null;
    }

    return {
        resourceKey,
        resourceId,
        routePath: resourceRoutePathFromParts(resourceKey, resourceId),
        closePath: `/${resourceKey}`,
    };
}

/* Return either the lowercase resource key or the display label for a resource URL. */
export function resourceCategoryFromUrl(url: string, capitalize = false) {
    const resourceKey = resourceKeyFromUrl(url);

    if (!isResourceCategoryKey(resourceKey)) {
        return capitalize ? RESOURCE_CATEGORY_LABELS.people : "people";
    }

    return capitalize ? RESOURCE_CATEGORY_LABELS[resourceKey] : resourceKey;
}

/* Convenience helper for reading a person id from a person URL. */
export function personIdFromUrl(url: string) {
    return resourceIdFromUrl(url);
}
