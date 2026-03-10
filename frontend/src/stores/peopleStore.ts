import { create } from "zustand";
import { type Person } from "@types";
import { loadPeople } from "@services/peopleService";
import { MIN_LOADING_MS } from "@utils/consts";
import { waitForMinimumLoading } from "@utils/loading";
import { collectPagedResourcesUntilTarget, filterUniqueResourcesByUrl, shouldSkipFetch } from "@utils/pagedResource";

interface PeopleState {
    people: Person[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    currentPage: number;
    hasMore: boolean;
    fetchPeople: (options?: { nextPage?: boolean; targetCount?: number }) => Promise<void>;
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
    people: [],
    loading: false,
    loadingMore: false,
    error: null,
    currentPage: 0,
    hasMore: true,
    fetchPeople: async (options) => {

        /* Read fetch mode and target count from options. */
        const nextPage = options?.nextPage ?? false;
        const targetCount = options?.targetCount ?? 0;
        const state = get();

        /* Skip requests when current state cannot fetch. */
        if (shouldSkipFetch({
            nextPage,
            loading: state.loading,
            loadingMore: state.loadingMore,
            hasMore: state.hasMore,
            currentPage: state.currentPage,
            itemCount: state.people.length,
        })) return;

        /* Run fetch flow and update store state. */
        try {

            /* Capture start time for minimum loader duration, to prevent quick "Loading" flash. */
            const loadStartTime = Date.now();

            /* Load and append the next page when requested. */
            if (nextPage) {

                /* Set Loading Flags */
                set({ loadingMore: true, error: null });

                /* Resolve the next page from cache first, then API if needed. */
                const pageToLoad = state.currentPage + 1;
                const pageData = await loadPeople(pageToLoad);

                /* Keep "Loading" visible for at least the minimum duration. */
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                /* Deduplicate results by URL before appending. */
                const latestState = get();
                const newPeople = filterUniqueResourcesByUrl(latestState.people, pageData.items);

                /* Append new results and update pagination state. */
                set({
                    people: [...latestState.people, ...newPeople],
                    currentPage: pageToLoad,
                    hasMore: pageData.hasMore && newPeople.length > 0,
                    loadingMore: false,
                });
                return;

            } else {

                /* Clear Loading Flags */
                set({ loading: true, loadingMore: false, error: null });

            }

            /* Load initial pages until target count is reached or no more data exists. */
            const initialPeopleLoad = await collectPagedResourcesUntilTarget<Person>({
                targetCount,
                loadPage: loadPeople,
            });

            /* Keep loading visible for at least the minimum duration. */
            await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

            /* Replace list with aggregated results and update pagination state. */
            set({
                loading: false,
                people: initialPeopleLoad.items,
                currentPage: initialPeopleLoad.currentPage,
                hasMore: initialPeopleLoad.hasMore,
            });

        } catch {

            /* Set error and clear loading flags on request failure. */
            set({
                error: nextPage ? "Failed to load more people" : "Failed to load people",
                loading: false,
                loadingMore: false,
            });
        }
    },
}));
