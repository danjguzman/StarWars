import { create } from "zustand";
import { loadFilms } from "@services/filmsService";
import { type Film } from "@types";
import { getCachedValue } from "@utils/clientCache";
import { FILMS_ALL_CACHE_KEY, MIN_LOADING_MS } from "@utils/consts";
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
    currentPage: 0,
    hasMore: true,
    fetchFilms: async (options) => {
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();
        const cachedFilmsCollection = getCachedValue<Film[]>(FILMS_ALL_CACHE_KEY);
        const hasCollectionCache = Array.isArray(cachedFilmsCollection) && cachedFilmsCollection.length > 0;

        if (shouldSkipFetch({
            nextPage,
            loading: state.loading,
            loadingMore: state.loadingMore,
            hasMore: state.hasMore,
            currentPage: state.currentPage,
            itemCount: state.films.length,
        })) return;

        try {
            const loadStartTime = Date.now();

            if (nextPage) {
                set({ loadingMore: true, error: null, lastFailedRequestMode: null });

                const pageToLoad = state.currentPage + 1;
                const pageData = await loadFilms(pageToLoad);

                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                const latestState = get();
                const newFilms = filterUniqueResourcesByUrl(latestState.films, pageData.items);

                set({
                    films: [...latestState.films, ...newFilms],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newFilms.length > 0,
                    loadingMore: false,
                    lastFailedRequestMode: null,
                });
                return;
            }

            set({ loading: true, loadingMore: false, error: null, lastFailedRequestMode: null });

            const initialFilmsLoad = await collectPagedResourcesUntilTarget<Film>({
                targetCount,
                loadPage: loadFilms,
            });

            if (!hasCollectionCache) {
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);
            }

            set({
                loading: false,
                films: initialFilmsLoad.items,
                currentPage: initialFilmsLoad.currentPage,
                hasMore: initialFilmsLoad.hasMore,
                lastFailedRequestMode: null,
            });
        } catch (error) {
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
