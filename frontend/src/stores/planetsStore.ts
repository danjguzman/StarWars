import { create } from "zustand";
import { loadPlanets } from "@services/planetsService";
import { type Planet } from "@types";
import { getCachedValue, invalidatePageCache } from "@utils/clientCache";
import { MIN_LOADING_MS, PLANETS_ALL_CACHE_KEY, PLANETS_ALL_CACHE_TTL_MS, PLANETS_CACHE_NAME } from "@utils/consts";
import { buildUserFacingError } from "@utils/errors";
import { waitForMinimumLoading } from "@utils/loading";
import { collectPagedResourcesUntilTarget, filterUniqueResourcesByUrl, shouldSkipFetch } from "@utils/pagedResource";

type PlanetsRequestMode = "initial" | "nextPage";

interface PlanetsState {
    planets: Planet[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    lastFailedRequestMode: PlanetsRequestMode | null;
    lastSyncedAt: number | null;
    currentPage: number;
    hasMore: boolean;
    fetchPlanets: (options?: { nextPage?: boolean; targetCount?: number }) => Promise<void>;
}

export const usePlanetsStore = create<PlanetsState>((set, get) => ({
    planets: [],
    loading: false,
    loadingMore: false,
    error: null,
    lastFailedRequestMode: null,
    lastSyncedAt: null,
    currentPage: 0,
    hasMore: true,
    fetchPlanets: async (options) => {
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedPlanetsCollection = getCachedValue<Planet[]>(PLANETS_ALL_CACHE_KEY);
        const hasCollectionCache = Array.isArray(cachedPlanetsCollection) && cachedPlanetsCollection.length > 0;

        const isStateExpired = !nextPage
            && state.lastSyncedAt !== null
            && Date.now() - state.lastSyncedAt >= PLANETS_ALL_CACHE_TTL_MS;

        if (isStateExpired) {
            invalidatePageCache(PLANETS_CACHE_NAME);
            set({
                planets: [],
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

        if (shouldSkipFetch({
            nextPage,
            loading: activeState.loading,
            loadingMore: activeState.loadingMore,
            hasMore: activeState.hasMore,
            currentPage: activeState.currentPage,
            itemCount: activeState.planets.length,
        })) return;

        try {
            const loadStartTime = Date.now();

            if (nextPage) {
                set({ loadingMore: true, error: null, lastFailedRequestMode: null });

                const pageToLoad = activeState.currentPage + 1;
                const pageData = await loadPlanets(pageToLoad);

                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                const latestState = get();
                const newPlanets = filterUniqueResourcesByUrl(latestState.planets, pageData.items);

                set({
                    planets: [...latestState.planets, ...newPlanets],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newPlanets.length > 0,
                    loadingMore: false,
                    lastFailedRequestMode: null,
                    lastSyncedAt: Date.now(),
                });
                return;
            }

            set({ loading: true, loadingMore: false, error: null, lastFailedRequestMode: null });

            const initialPlanetsLoad = await collectPagedResourcesUntilTarget<Planet>({
                targetCount,
                loadPage: loadPlanets,
            });

            if (!hasCollectionCache) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            set({
                loading: false,
                planets: initialPlanetsLoad.items,
                currentPage: initialPlanetsLoad.currentPage,
                hasMore: initialPlanetsLoad.hasMore,
                lastFailedRequestMode: null,
                lastSyncedAt: Date.now(),
            });
        } catch (error) {
            set({
                error: nextPage
                    ? buildUserFacingError("We couldn't load more planets", error, "Please try again")
                    : buildUserFacingError("We couldn't load the Planets archive", error, "Please try again"),
                lastFailedRequestMode: nextPage ? "nextPage" : "initial",
                loading: false,
                loadingMore: false,
            });
        }
    },
}));
