import { create } from "zustand";
import { loadSpecies } from "@services/speciesService";
import { type Species } from "@types";
import { getCachedValue, invalidatePageCache } from "@utils/clientCache";
import { MIN_LOADING_MS, SPECIES_ALL_CACHE_KEY, SPECIES_ALL_CACHE_TTL_MS, SPECIES_CACHE_NAME } from "@utils/consts";
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
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedSpeciesCollection = getCachedValue<Species[]>(SPECIES_ALL_CACHE_KEY);
        const hasCollectionCache = Array.isArray(cachedSpeciesCollection) && cachedSpeciesCollection.length > 0;

        const isStateExpired = !nextPage
            && state.lastSyncedAt !== null
            && Date.now() - state.lastSyncedAt >= SPECIES_ALL_CACHE_TTL_MS;

        if (isStateExpired) {
            invalidatePageCache(SPECIES_CACHE_NAME);
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

        if (shouldSkipFetch({
            nextPage,
            loading: activeState.loading,
            loadingMore: activeState.loadingMore,
            hasMore: activeState.hasMore,
            currentPage: activeState.currentPage,
            itemCount: activeState.species.length,
        })) return;

        try {
            const loadStartTime = Date.now();

            if (nextPage) {
                set({ loadingMore: true, error: null, lastFailedRequestMode: null });

                const pageToLoad = activeState.currentPage + 1;
                const pageData = await loadSpecies(pageToLoad);

                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                const latestState = get();
                const newSpecies = filterUniqueResourcesByUrl(latestState.species, pageData.items);

                set({
                    species: [...latestState.species, ...newSpecies],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newSpecies.length > 0,
                    loadingMore: false,
                    lastFailedRequestMode: null,
                    lastSyncedAt: Date.now(),
                });
                return;
            }

            set({ loading: true, loadingMore: false, error: null, lastFailedRequestMode: null });

            const initialSpeciesLoad = await collectPagedResourcesUntilTarget<Species>({
                targetCount,
                loadPage: loadSpecies,
            });

            if (!hasCollectionCache) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            set({
                loading: false,
                species: initialSpeciesLoad.items,
                currentPage: initialSpeciesLoad.currentPage,
                hasMore: initialSpeciesLoad.hasMore,
                lastFailedRequestMode: null,
                lastSyncedAt: Date.now(),
            });
        } catch (error) {
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
