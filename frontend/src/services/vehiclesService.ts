import {
    apiUrl,
    getJson,
    isSwapiPagedResponse,
} from "@services/api";
import { getPreloadedCollection } from "@services/preloadService";
import { type SwapiPagedResponse, type Vehicle } from "@types";
import { getCachedPage, getCachedValue, setCachedValue } from "@utils/clientCache";
import {
    VEHICLES_ALL_CACHE_KEY,
    VEHICLES_ALL_CACHE_TTL_MS,
    VEHICLES_CACHE_NAME,
    VEHICLES_CACHE_TTL_MS,
    VEHICLES_FALLBACK_PAGE_SIZE,
} from "@utils/consts";

export interface VehiclesPage {
    vehicles: Vehicle[];
    hasMore: boolean;
}

/* Return one page-shaped chunk of vehicles, preferably from the preloaded full-list cache. */
export async function fetchVehiclesPage(page: number, pageSize = VEHICLES_FALLBACK_PAGE_SIZE) {
    const cachedAllVehicles = getCachedValue<Vehicle[]>(VEHICLES_ALL_CACHE_KEY);
    const preloadedVehicles = getPreloadedCollection<Vehicle>("vehicles");
    const sourceVehicles = cachedAllVehicles ?? preloadedVehicles;

    if (!cachedAllVehicles && preloadedVehicles) {
        setCachedValue(VEHICLES_ALL_CACHE_KEY, preloadedVehicles, VEHICLES_ALL_CACHE_TTL_MS);
    }

    if (sourceVehicles) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            vehicles: sourceVehicles.slice(start, end),
            hasMore: end < sourceVehicles.length,
        } satisfies VehiclesPage;
    }

    const data = await getJson<Vehicle[] | SwapiPagedResponse<Vehicle>>(
        apiUrl(`/vehicles?page=${page}`)
    );

    if (Array.isArray(data)) {
        setCachedValue(VEHICLES_ALL_CACHE_KEY, data, VEHICLES_ALL_CACHE_TTL_MS);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            vehicles: data.slice(start, end),
            hasMore: end < data.length,
        } satisfies VehiclesPage;
    }

    if (isSwapiPagedResponse(data)) {
        return {
            vehicles: data.results,
            hasMore: Boolean(data.next),
        } satisfies VehiclesPage;
    }

    throw new Error("Unexpected vehicles response shape");
}

/* Load one vehicles page through the shared page cache wrapper. */
export async function loadVehicles(page: number) {
    const pageData = await getCachedPage(
        VEHICLES_CACHE_NAME,
        page,
        fetchVehiclesPage,
        VEHICLES_CACHE_TTL_MS
    );

    return {
        items: pageData.vehicles,
        hasMore: pageData.hasMore,
    };
}

/* Fetch the full list of vehicles. */
export function fetchVehicles() {
    return getJson<Vehicle[]>(apiUrl("/vehicles"));
}

/* Fetch one vehicle by id. */
export function fetchVehicleById(id: string) {
    return getJson<Vehicle>(apiUrl(`/vehicles/${id}`));
}
