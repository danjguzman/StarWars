import { create } from "zustand";
import { type Film } from "@types";
import { loadFilms } from "@services/filmsService";
import { getCachedValue, invalidatePageCache } from "@utils/clientCache";
import { FILMS_ALL_CACHE_KEY, FILMS_ALL_CACHE_TTL_MS, FILMS_CACHE_NAME, MIN_LOADING_MS } from "@utils/consts";
import { buildUserFacingError } from "@utils/errors";
import { waitForMinimumLoading } from "@utils/loading";
import { collectPagedResourcesUntilTarget, filterUniqueResourcesByUrl, shouldSkipFetch } from "@utils/pagedResource";

type FilmsRequestMode = "initial" | "nextPage";

interface FilmsState {
    films: Film[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    lastFailedRequestMode: FilmsRequestMode | null;
    lastSyncedAt: number | null;
    currentPage: number;
    hasMore: boolean;
    fetchFilms: (options?: { nextPage?: boolean; targetCount?: number }) => Promise<void>;
}

export const useFilmsStore = create<FilmsState>((set, get) => ({
    films: [],
    loading: false,
    loadingMore: false,
    error: null,
    lastFailedRequestMode: null,
    lastSyncedAt: null,
    currentPage: 0,
    hasMore: true,
    fetchFilms: async (options) => {

        /* Read fetch mode and target count from options. */
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedFilmsCollection = getCachedValue<Film[]>(FILMS_ALL_CACHE_KEY);
        const hasCollectionCache = Array.isArray(cachedFilmsCollection) && cachedFilmsCollection.length > 0;

        const isStateExpired = !nextPage
            && state.lastSyncedAt !== null
            && Date.now() - state.lastSyncedAt >= FILMS_ALL_CACHE_TTL_MS;

        if (isStateExpired) {
            invalidatePageCache(FILMS_CACHE_NAME);
            set({
                films: [],
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
            itemCount: activeState.films.length,
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
                const pageData = await loadFilms(pageToLoad);

                /* Keep "Loading" visible for at least the minimum duration. */
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                /* Deduplicate results by URL before appending. */
                const latestState = get();
                const newFilms = filterUniqueResourcesByUrl(latestState.films, pageData.items);

                /* Append new results and update pagination state. */
                set({
                    films: [...latestState.films, ...newFilms],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newFilms.length > 0,
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
            const initialFilmsLoad = await collectPagedResourcesUntilTarget<Film>({
                targetCount,
                loadPage: loadFilms,
            });

            /* Keep loading visible for at least the minimum duration. */
            if (!hasCollectionCache) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            /* Replace list with aggregated results and update pagination state. */
            set({
                loading: false,
                films: initialFilmsLoad.items,
                currentPage: initialFilmsLoad.currentPage,
                hasMore: initialFilmsLoad.hasMore,
                lastFailedRequestMode: null,
                lastSyncedAt: Date.now(),
            });

        } catch (error) {

            /* Set error and clear loading flags on request failure. */
            set({
                error: nextPage
                    ? buildUserFacingError("We couldn't load more films", error, "Please try again")
                    : buildUserFacingError("We couldn't load the Films archive", error, "Please try again"),
                lastFailedRequestMode: nextPage ? "nextPage" : "initial",
                loading: false,
                loadingMore: false,
            });
        }
    },
}));
