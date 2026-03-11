import { create } from "zustand";
import { loadVehicles } from "@services/vehiclesService";
import { type Vehicle } from "@types";
import { getCachedValue } from "@utils/clientCache";
import { MIN_LOADING_MS, VEHICLES_ALL_CACHE_KEY } from "@utils/consts";
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
    currentPage: 0,
    hasMore: true,
    fetchVehicles: async (options) => {
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedVehiclesCollection = getCachedValue<Vehicle[]>(VEHICLES_ALL_CACHE_KEY);
        const hasCollectionCache = Array.isArray(cachedVehiclesCollection) && cachedVehiclesCollection.length > 0;

        if (shouldSkipFetch({
            nextPage,
            loading: state.loading,
            loadingMore: state.loadingMore,
            hasMore: state.hasMore,
            currentPage: state.currentPage,
            itemCount: state.vehicles.length,
        })) return;

        try {
            const loadStartTime = Date.now();

            if (nextPage) {
                set({ loadingMore: true, error: null, lastFailedRequestMode: null });

                const pageToLoad = state.currentPage + 1;
                const pageData = await loadVehicles(pageToLoad);

                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                const latestState = get();
                const newVehicles = filterUniqueResourcesByUrl(latestState.vehicles, pageData.items);

                set({
                    vehicles: [...latestState.vehicles, ...newVehicles],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newVehicles.length > 0,
                    loadingMore: false,
                    lastFailedRequestMode: null,
                });
                return;
            }

            set({ loading: true, loadingMore: false, error: null, lastFailedRequestMode: null });

            const initialVehiclesLoad = await collectPagedResourcesUntilTarget<Vehicle>({
                targetCount,
                loadPage: loadVehicles,
            });

            if (!hasCollectionCache) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            set({
                loading: false,
                vehicles: initialVehiclesLoad.items,
                currentPage: initialVehiclesLoad.currentPage,
                hasMore: initialVehiclesLoad.hasMore,
                lastFailedRequestMode: null,
            });
        } catch (error) {
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
