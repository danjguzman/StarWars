import { create } from "zustand";
import { getPreloadedCollection } from "@services/preloadService";
import { type Planet } from "@types";
import { loadPlanets } from "@services/planetsService";
import { getCachedValue, invalidatePageCache } from "@utils/clientCache";
import { MIN_LOADING_MS, PLANETS_ALL_CACHE_KEY, PLANETS_ALL_CACHE_TTL_MS, PLANETS_CACHE_NAME, PLANETS_FALLBACK_PAGE_SIZE } from "@utils/consts";
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

        /* Read fetch mode and target count from options. */
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedPlanetsCollection = getCachedValue<Planet[]>(PLANETS_ALL_CACHE_KEY);
        const preloadedPlanetsCollection = getPreloadedCollection<Planet>("planets");
        const sourcePlanetsCollection = cachedPlanetsCollection ?? preloadedPlanetsCollection;
        const hasCollectionSnapshot = Array.isArray(sourcePlanetsCollection) && sourcePlanetsCollection.length > 0;

        const isStateExpired = !nextPage
            && state.lastSyncedAt !== null
            && Date.now() - state.lastSyncedAt >= PLANETS_ALL_CACHE_TTL_MS;

        if (isStateExpired) {
            invalidatePageCache(PLANETS_CACHE_NAME);

            const resetSourcePlanets = sourcePlanetsCollection && sourcePlanetsCollection.length > 0
                ? sourcePlanetsCollection
                : state.planets;

            if (resetSourcePlanets.length > 0) {
                set({
                    planets: resetSourcePlanets.slice(0, PLANETS_FALLBACK_PAGE_SIZE),
                    currentPage: 1,
                    hasMore: resetSourcePlanets.length > PLANETS_FALLBACK_PAGE_SIZE || state.hasMore,
                    error: null,
                    lastFailedRequestMode: null,
                    loading: false,
                    loadingMore: false,
                    lastSyncedAt: Date.now(),
                });
                return;
            }

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

        /* Skip requests when current state cannot fetch. */
        if (shouldSkipFetch({
            nextPage,
            loading: activeState.loading,
            loadingMore: activeState.loadingMore,
            hasMore: activeState.hasMore,
            currentPage: activeState.currentPage,
            itemCount: activeState.planets.length,
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
                const pageData = await loadPlanets(pageToLoad);

                /* Keep "Loading" visible for at least the minimum duration. */
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                /* Deduplicate results by URL before appending. */
                const latestState = get();
                const newPlanets = filterUniqueResourcesByUrl(latestState.planets, pageData.items);

                /* Append new results and update pagination state. */
                set({
                    planets: [...latestState.planets, ...newPlanets],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newPlanets.length > 0,
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
            const initialPlanetsLoad = await collectPagedResourcesUntilTarget<Planet>({
                targetCount,
                loadPage: loadPlanets,
            });

            /* Keep loading visible for at least the minimum duration. */
            if (!hasCollectionSnapshot) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            /* Replace list with aggregated results and update pagination state. */
            set({
                loading: false,
                planets: initialPlanetsLoad.items,
                currentPage: initialPlanetsLoad.currentPage,
                hasMore: initialPlanetsLoad.hasMore,
                lastFailedRequestMode: null,
                lastSyncedAt: Date.now(),
            });

        } catch (error) {

            /* Set error and clear loading flags on request failure. */
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
