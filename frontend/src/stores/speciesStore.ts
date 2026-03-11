import { create } from "zustand";
import { loadSpecies } from "@services/speciesService";
import { type Species } from "@types";
import { getCachedValue } from "@utils/clientCache";
import { MIN_LOADING_MS, SPECIES_ALL_CACHE_KEY } from "@utils/consts";
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
    currentPage: 0,
    hasMore: true,
    fetchSpecies: async (options) => {
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedSpeciesCollection = getCachedValue<Species[]>(SPECIES_ALL_CACHE_KEY);
        const hasCollectionCache = Array.isArray(cachedSpeciesCollection) && cachedSpeciesCollection.length > 0;

        if (shouldSkipFetch({
            nextPage,
            loading: state.loading,
            loadingMore: state.loadingMore,
            hasMore: state.hasMore,
            currentPage: state.currentPage,
            itemCount: state.species.length,
        })) return;

        try {
            const loadStartTime = Date.now();

            if (nextPage) {
                set({ loadingMore: true, error: null, lastFailedRequestMode: null });

                const pageToLoad = state.currentPage + 1;
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
