const RESOURCE_CATEGORY_LABELS = {
    people: "People",
    species: "Species",
    starships: "Starships",
    vehicles: "Vehicles",
    planets: "Planets",
    films: "Films",
} as const;

type ResourceCategoryKey = keyof typeof RESOURCE_CATEGORY_LABELS;

function isResourceCategoryKey(value: string | null): value is ResourceCategoryKey {
    return value !== null && value in RESOURCE_CATEGORY_LABELS;
}

export function personUrlFromId(id: string) {
    return `https://swapi.info/api/people/${id}`;
}

export function resourceIdFromUrl(url: string) {
    const match = url.match(/\/(\d+)\/?$/);

    if (!match) {
        return null;
    }

    return match[1];
}

export function resourceKeyFromUrl(url: string) {
    const match = url.match(/\/api\/([^/]+)\//i);

    if (!match) {
        return null;
    }

    return match[1].toLowerCase();
}

export function resourceRoutePathFromUrl(url: string) {
    const resourceKey = resourceKeyFromUrl(url);
    const resourceId = resourceIdFromUrl(url);

    if (!resourceKey || !resourceId) {
        return null;
    }

    return `/${resourceKey}/${resourceId}`;
}

export function resourceCategoryFromUrl(url: string, capitalize = false) {
    const resourceKey = resourceKeyFromUrl(url);

    if (!isResourceCategoryKey(resourceKey)) {
        return capitalize ? RESOURCE_CATEGORY_LABELS.people : "people";
    }

    return capitalize ? RESOURCE_CATEGORY_LABELS[resourceKey] : resourceKey;
}

export function personIdFromUrl(url: string) {
    return resourceIdFromUrl(url);
}
