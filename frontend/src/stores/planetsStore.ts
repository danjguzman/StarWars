import { create } from "zustand";
import { loadPlanets } from "@services/planetsService";
import { type Planet } from "@types";
import { MIN_LOADING_MS } from "@utils/consts";
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
    currentPage: 0,
    hasMore: true,
    fetchPlanets: async (options) => {
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();

        if (shouldSkipFetch({
            nextPage,
            loading: state.loading,
            loadingMore: state.loadingMore,
            hasMore: state.hasMore,
            currentPage: state.currentPage,
            itemCount: state.planets.length,
        })) return;

        try {
            const loadStartTime = Date.now();

            if (nextPage) {
                set({ loadingMore: true, error: null, lastFailedRequestMode: null });

                const pageToLoad = state.currentPage + 1;
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
                });
                return;
            }

            set({ loading: true, loadingMore: false, error: null, lastFailedRequestMode: null });

            const initialPlanetsLoad = await collectPagedResourcesUntilTarget<Planet>({
                targetCount,
                loadPage: loadPlanets,
            });

            await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

            set({
                loading: false,
                planets: initialPlanetsLoad.items,
                currentPage: initialPlanetsLoad.currentPage,
                hasMore: initialPlanetsLoad.hasMore,
                lastFailedRequestMode: null,
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
