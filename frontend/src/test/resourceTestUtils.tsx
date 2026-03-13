import { useSyncExternalStore } from "react";
import { type NamedResource } from "@types";
import { invalidateCacheByPrefix, setCachedValue } from "@utils/clientCache";

type StoreUpdate<TState> = TState | ((currentState: TState) => TState);

export interface HookStore<TState> {
    getState(): TState;
    setState(update: StoreUpdate<TState>): void;
    useStore(): TState;
}

const RESOURCE_KEYS = ["films", "people", "planets", "species", "vehicles", "starships"] as const;

type ResourceKey = (typeof RESOURCE_KEYS)[number];

export function createHookStore<TState>(initialState: TState): HookStore<TState> {
    let state = initialState;
    const listeners = new Set<() => void>();

    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    };

    const getSnapshot = () => state;

    return {
        getState() {
            return state;
        },
        setState(update: StoreUpdate<TState>) {
            state = typeof update === "function"
                ? (update as (currentState: TState) => TState)(state)
                : update;

            listeners.forEach((listener) => {
                listener();
            });
        },
        useStore() {
            return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
        },
    };
}

export function clearResourceCaches() {
    RESOURCE_KEYS.forEach((resourceKey) => {
        invalidateCacheByPrefix(`${resourceKey}:`);
    });
}

export function seedResolvedResourceCollections(collections: Partial<Record<ResourceKey, NamedResource[]>>) {
    Object.entries(collections).forEach(([resourceKey, resources]) => {
        if (!resources) return;
        setCachedValue(`${resourceKey}:all`, resources);
    });
}
