import { create } from "zustand";
import { getPreloadedCollection } from "@services/preloadService";
import { type Species } from "@types";
import { loadSpecies } from "@services/speciesService";
import { getCachedValue, invalidatePageCache } from "@utils/clientCache";
import { MIN_LOADING_MS, SPECIES_ALL_CACHE_KEY, SPECIES_ALL_CACHE_TTL_MS, SPECIES_CACHE_NAME, SPECIES_FALLBACK_PAGE_SIZE } from "@utils/consts";
import { buildUserFacingError } from "@utils/errors";
import { waitForMinimumLoading } from "@utils/loading";
import { collectPagedResourcesUntilTarget, filterUniqueResourcesByUrl, shouldSkipFetch } from "@utils/pagedResource";

type SpeciesRequestMode = "initial" | "nextPage";

interface SpeciesState {
    species: Species[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    lastFailedRequestMode: SpeciesRequestMode | null;
    lastSyncedAt: number | null;
    currentPage: number;
    hasMore: boolean;
    fetchSpecies: (options?: { nextPage?: boolean; targetCount?: number }) => Promise<void>;
}

export const useSpeciesStore = create<SpeciesState>((set, get) => ({
    species: [],
    loading: false,
    loadingMore: false,
    error: null,
    lastFailedRequestMode: null,
    lastSyncedAt: null,
    currentPage: 0,
    hasMore: true,
    fetchSpecies: async (options) => {

        /* Read fetch mode and target count from options. */
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedSpeciesCollection = getCachedValue<Species[]>(SPECIES_ALL_CACHE_KEY);
        const preloadedSpeciesCollection = getPreloadedCollection<Species>("species");
        const sourceSpeciesCollection = cachedSpeciesCollection ?? preloadedSpeciesCollection;
        const hasCollectionSnapshot = Array.isArray(sourceSpeciesCollection) && sourceSpeciesCollection.length > 0;

        const isStateExpired = !nextPage
            && state.lastSyncedAt !== null
            && Date.now() - state.lastSyncedAt >= SPECIES_ALL_CACHE_TTL_MS;

        if (isStateExpired) {
            invalidatePageCache(SPECIES_CACHE_NAME);

            const resetSourceSpecies = sourceSpeciesCollection && sourceSpeciesCollection.length > 0
                ? sourceSpeciesCollection
                : state.species;

            if (resetSourceSpecies.length > 0) {
                set({
                    species: resetSourceSpecies.slice(0, SPECIES_FALLBACK_PAGE_SIZE),
                    currentPage: 1,
                    hasMore: resetSourceSpecies.length > SPECIES_FALLBACK_PAGE_SIZE || state.hasMore,
                    error: null,
                    lastFailedRequestMode: null,
                    loading: false,
                    loadingMore: false,
                    lastSyncedAt: Date.now(),
                });
                return;
            }

            set({
                species: [],
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
            itemCount: activeState.species.length,
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
                const pageData = await loadSpecies(pageToLoad);

                /* Keep "Loading" visible for at least the minimum duration. */
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                /* Deduplicate results by URL before appending. */
                const latestState = get();
                const newSpecies = filterUniqueResourcesByUrl(latestState.species, pageData.items);

                /* Append new results and update pagination state. */
                set({
                    species: [...latestState.species, ...newSpecies],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newSpecies.length > 0,
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
            const initialSpeciesLoad = await collectPagedResourcesUntilTarget<Species>({
                targetCount,
                loadPage: loadSpecies,
            });

            /* Keep loading visible for at least the minimum duration. */
            if (!hasCollectionSnapshot) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            /* Replace list with aggregated results and update pagination state. */
            set({
                loading: false,
                species: initialSpeciesLoad.items,
                currentPage: initialSpeciesLoad.currentPage,
                hasMore: initialSpeciesLoad.hasMore,
                lastFailedRequestMode: null,
                lastSyncedAt: Date.now(),
            });

        } catch (error) {

            /* Set error and clear loading flags on request failure. */
            set({
                error: nextPage
                    ? buildUserFacingError("We couldn't load more species", error, "Please try again")
                    : buildUserFacingError("We couldn't load the Species archive", error, "Please try again"),
                lastFailedRequestMode: nextPage ? "nextPage" : "initial",
                loading: false,
                loadingMore: false,
            });
        }
    },
}));
