import { create } from "zustand";
import { type Person } from "@types";
import { fetchPeoplePage } from "@services/peopleService";
import { getCachedPage } from "@utils/clientCache";
import { waitForMinimumLoading } from "@utils/loading";

/* Cache Constants */
const PEOPLE_CACHE_NAME = "people";
const PEOPLE_CACHE_TTL_MS = 5 * (60 * 1000);
const MIN_LOADING_MS = 1000;

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
        if (nextPage) {
            if (state.loading || state.loadingMore || !state.hasMore) return;
        } else {
            if (state.loading || (state.currentPage > 0 && state.people.length > 0)) return;
        }

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
                const pageData = await getCachedPage(
                    PEOPLE_CACHE_NAME,
                    pageToLoad,
                    fetchPeoplePage,
                    PEOPLE_CACHE_TTL_MS
                );

                /* Keep "Loading" visible for at least the minimum duration. */
                await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

                /* Deduplicate results by URL before appending. */
                const latestState = get();
                const existingPeople = new Set(latestState.people.map((person) => person.url));
                const newPeople = pageData.people.filter((person) => !existingPeople.has(person.url));

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
            let pageToLoad = 1;
            let hasMore = true;
            const aggregatedPeople: Person[] = [];
            const seenUrls = new Set<string>();

            /* Fetch pages and aggregate unique people into one list. */
            while (hasMore) {

                const pageData = await getCachedPage(
                    PEOPLE_CACHE_NAME,
                    pageToLoad,
                    fetchPeoplePage,
                    PEOPLE_CACHE_TTL_MS
                );

                /* Keep only unique people while building the initial list. */
                for (const person of pageData.people) {
                    if (!seenUrls.has(person.url)) {
                        seenUrls.add(person.url);
                        aggregatedPeople.push(person);
                    }
                }

                /* Stop once paging ends or initial target count is satisfied. */
                hasMore = pageData.hasMore;
                const enoughItemsLoaded = targetCount > 0 && aggregatedPeople.length >= targetCount;
                if (!hasMore || enoughItemsLoaded || targetCount === 0) {
                    break;
                }

                /* Move to the next page when more data is needed. */
                pageToLoad += 1;
            }

            /* Keep loading visible for at least the minimum duration. */
            await waitForMinimumLoading(loadStartTime, MIN_LOADING_MS);

            /* Replace list with aggregated results and update pagination state. */
            set({
                loading: false,
                people: aggregatedPeople,
                currentPage: pageToLoad,
                hasMore,
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
