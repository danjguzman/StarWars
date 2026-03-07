import { create } from "zustand";
import { type Person } from "../types/person";
import { fetchPeople } from "../services/peopleService";

interface PeopleState {
    people: Person[];
    loading: boolean;
    error: string | null;
    isCached: boolean;
    fetchPeople: (options?: { force?: boolean }) => Promise<void>;
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
    people: [],
    loading: false,
    error: null,
    isCached: false,
    fetchPeople: async (options) => {

        // Do We Force re-fetch?
        const force = options?.force ?? false;

        // Cache check: if we already have data, do nothing unless forced
        if (!force && get().isCached && get().people.length > 0) return;

        try {

            // Set Loading Message & Fetch Data
            set({ loading: true, error: null });
            const data = await fetchPeople();

            // Let Loading Message Sit For At Least 1 Second (avoids "Loading..." flicker)
            await new Promise(r=>setTimeout(r, 1000));

            // Set Data & Clear Loading Message
            set({ loading: false, people: data });

        } catch {

            set({
                error: "Failed to load people",
                loading: false
            });

        }
    }
}));