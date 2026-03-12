import { create } from "zustand";
import { type Starship } from "@types";
import { loadStarships } from "@services/starshipsService";
import { getCachedValue, invalidatePageCache } from "@utils/clientCache";
import { MIN_LOADING_MS, STARSHIPS_ALL_CACHE_KEY, STARSHIPS_ALL_CACHE_TTL_MS, STARSHIPS_CACHE_NAME } from "@utils/consts";
import { buildUserFacingError } from "@utils/errors";
import { waitForMinimumLoading } from "@utils/loading";
import { collectPagedResourcesUntilTarget, filterUniqueResourcesByUrl, shouldSkipFetch } from "@utils/pagedResource";

type StarshipsRequestMode = "initial" | "nextPage";

interface StarshipsState {
    starships: Starship[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    lastFailedRequestMode: StarshipsRequestMode | null;
    lastSyncedAt: number | null;
    currentPage: number;
    hasMore: boolean;
    fetchStarships: (options?: { nextPage?: boolean; targetCount?: number }) => Promise<void>;
}

export const useStarshipsStore = create<StarshipsState>((set, get) => ({
    starships: [],
    loading: false,
    loadingMore: false,
    error: null,
    lastFailedRequestMode: null,
    lastSyncedAt: null,
    currentPage: 0,
    hasMore: true,
    fetchStarships: async (options) => {

        /* Read fetch mode and target count from options. */
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedStarshipsCollection = getCachedValue<Starship[]>(STARSHIPS_ALL_CACHE_KEY);
        const hasCollectionCache = Array.isArray(cachedStarshipsCollection) && cachedStarshipsCollection.length > 0;

        const isStateExpired = !nextPage
            && state.lastSyncedAt !== null
            && Date.now() - state.lastSyncedAt >= STARSHIPS_ALL_CACHE_TTL_MS;

        if (isStateExpired) {
            invalidatePageCache(STARSHIPS_CACHE_NAME);
            set({
                starships: [],
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
            itemCount: activeState.starships.length,
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
                const pageData = await loadStarships(pageToLoad);

                /* Keep "Loading" visible for at least the minimum duration. */
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                /* Deduplicate results by URL before appending. */
                const latestState = get();
                const newStarships = filterUniqueResourcesByUrl(latestState.starships, pageData.items);

                /* Append new results and update pagination state. */
                set({
                    starships: [...latestState.starships, ...newStarships],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newStarships.length > 0,
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
            const initialStarshipsLoad = await collectPagedResourcesUntilTarget<Starship>({
                targetCount,
                loadPage: loadStarships,
            });

            /* Keep loading visible for at least the minimum duration. */
            if (!hasCollectionCache) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            /* Replace list with aggregated results and update pagination state. */
            set({
                loading: false,
                starships: initialStarshipsLoad.items,
                currentPage: initialStarshipsLoad.currentPage,
                hasMore: initialStarshipsLoad.hasMore,
                lastFailedRequestMode: null,
                lastSyncedAt: Date.now(),
            });

        } catch (error) {

            /* Set error and clear loading flags on request failure. */
            set({
                error: nextPage
                    ? buildUserFacingError("We couldn't load more starships", error, "Please try again")
                    : buildUserFacingError("We couldn't load the Starships archive", error, "Please try again"),
                lastFailedRequestMode: nextPage ? "nextPage" : "initial",
                loading: false,
                loadingMore: false,
            });
        }
    },
}));
