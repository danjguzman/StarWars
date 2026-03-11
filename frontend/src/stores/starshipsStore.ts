import { create } from "zustand";
import { loadStarships } from "@services/starshipsService";
import { type Starship } from "@types";
import { getCachedValue } from "@utils/clientCache";
import { MIN_LOADING_MS, STARSHIPS_ALL_CACHE_KEY } from "@utils/consts";
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
    currentPage: 0,
    hasMore: true,
    fetchStarships: async (options) => {
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedStarshipsCollection = getCachedValue<Starship[]>(STARSHIPS_ALL_CACHE_KEY);
        const hasCollectionCache = Array.isArray(cachedStarshipsCollection) && cachedStarshipsCollection.length > 0;

        if (shouldSkipFetch({
            nextPage,
            loading: state.loading,
            loadingMore: state.loadingMore,
            hasMore: state.hasMore,
            currentPage: state.currentPage,
            itemCount: state.starships.length,
        })) return;

        try {
            const loadStartTime = Date.now();

            if (nextPage) {
                set({ loadingMore: true, error: null, lastFailedRequestMode: null });

                const pageToLoad = state.currentPage + 1;
                const pageData = await loadStarships(pageToLoad);

                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                const latestState = get();
                const newStarships = filterUniqueResourcesByUrl(latestState.starships, pageData.items);

                set({
                    starships: [...latestState.starships, ...newStarships],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newStarships.length > 0,
                    loadingMore: false,
                    lastFailedRequestMode: null,
                });
                return;
            }

            set({ loading: true, loadingMore: false, error: null, lastFailedRequestMode: null });

            const initialStarshipsLoad = await collectPagedResourcesUntilTarget<Starship>({
                targetCount,
                loadPage: loadStarships,
            });

            if (!hasCollectionCache) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            set({
                loading: false,
                starships: initialStarshipsLoad.items,
                currentPage: initialStarshipsLoad.currentPage,
                hasMore: initialStarshipsLoad.hasMore,
                lastFailedRequestMode: null,
            });
        } catch (error) {
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
