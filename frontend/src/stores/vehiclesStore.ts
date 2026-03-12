import { create } from "zustand";
import { loadVehicles } from "@services/vehiclesService";
import { type Vehicle } from "@types";
import { getCachedValue, invalidatePageCache } from "@utils/clientCache";
import { MIN_LOADING_MS, VEHICLES_ALL_CACHE_KEY, VEHICLES_ALL_CACHE_TTL_MS, VEHICLES_CACHE_NAME } from "@utils/consts";
import { buildUserFacingError } from "@utils/errors";
import { waitForMinimumLoading } from "@utils/loading";
import { collectPagedResourcesUntilTarget, filterUniqueResourcesByUrl, shouldSkipFetch } from "@utils/pagedResource";

type VehiclesRequestMode = "initial" | "nextPage";

interface VehiclesState {
    vehicles: Vehicle[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    lastFailedRequestMode: VehiclesRequestMode | null;
    lastSyncedAt: number | null;
    currentPage: number;
    hasMore: boolean;
    fetchVehicles: (options?: { nextPage?: boolean; targetCount?: number }) => Promise<void>;
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
    vehicles: [],
    loading: false,
    loadingMore: false,
    error: null,
    lastFailedRequestMode: null,
    lastSyncedAt: null,
    currentPage: 0,
    hasMore: true,
    fetchVehicles: async (options) => {

        /* Read fetch mode and target count from options. */
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedVehiclesCollection = getCachedValue<Vehicle[]>(VEHICLES_ALL_CACHE_KEY);
        const hasCollectionCache = Array.isArray(cachedVehiclesCollection) && cachedVehiclesCollection.length > 0;

        const isStateExpired = !nextPage
            && state.lastSyncedAt !== null
            && Date.now() - state.lastSyncedAt >= VEHICLES_ALL_CACHE_TTL_MS;

        if (isStateExpired) {
            invalidatePageCache(VEHICLES_CACHE_NAME);
            set({
                vehicles: [],
                currentPage: 0,
                hasMore: true,
                error: null,
                lastFailedRequestMode: null,
                loading: false,
                loadingMore: false,
                lastSyncedAt: null,
            });
        }

        const activeState = isStateExpired ? get() : state;

        /* Skip requests when current state cannot fetch. */
        if (shouldSkipFetch({
            nextPage,
            loading: activeState.loading,
            loadingMore: activeState.loadingMore,
            hasMore: activeState.hasMore,
            currentPage: activeState.currentPage,
            itemCount: activeState.vehicles.length,
        })) return;

        /* Run fetch flow and update store state. */
        try {

            /* Capture start time for minimum loader duration, to prevent quick "Loading" flash. */
            const loadStartTime = Date.now();

            /* Load and append the next page when requested. */
            if (nextPage) {

                /* Set Loading Flags */
                set({ loadingMore: true, error: null, lastFailedRequestMode: null });

                /* Resolve the next page from cache first, then API if needed. */
                const pageToLoad = activeState.currentPage + 1;
                const pageData = await loadVehicles(pageToLoad);

                /* Keep "Loading" visible for at least the minimum duration. */
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                /* Deduplicate results by URL before appending. */
                const latestState = get();
                const newVehicles = filterUniqueResourcesByUrl(latestState.vehicles, pageData.items);

                /* Append new results and update pagination state. */
                set({
                    vehicles: [...latestState.vehicles, ...newVehicles],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newVehicles.length > 0,
                    loadingMore: false,
                    lastFailedRequestMode: null,
                    lastSyncedAt: Date.now(),
                });
                return;

            } else {

                /* Clear Loading Flags */
                set({ loading: true, loadingMore: false, error: null, lastFailedRequestMode: null });

            }

            /* Load initial pages until target count is reached or no more data exists. */
            const initialVehiclesLoad = await collectPagedResourcesUntilTarget<Vehicle>({
                targetCount,
                loadPage: loadVehicles,
            });

            /* Keep loading visible for at least the minimum duration. */
            if (!hasCollectionCache) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            /* Replace list with aggregated results and update pagination state. */
            set({
                loading: false,
                vehicles: initialVehiclesLoad.items,
                currentPage: initialVehiclesLoad.currentPage,
                hasMore: initialVehiclesLoad.hasMore,
                lastFailedRequestMode: null,
                lastSyncedAt: Date.now(),
            });

        } catch (error) {

            /* Set error and clear loading flags on request failure. */
            set({
                error: nextPage
                    ? buildUserFacingError("We couldn't load more vehicles", error, "Please try again")
                    : buildUserFacingError("We couldn't load the Vehicles archive", error, "Please try again"),
                lastFailedRequestMode: nextPage ? "nextPage" : "initial",
                loading: false,
                loadingMore: false,
            });
        }
    },
}));
