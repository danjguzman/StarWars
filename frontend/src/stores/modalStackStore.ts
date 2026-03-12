import { create } from "zustand";
import { type ModalRouteTarget, type ResourceCategoryKey } from "@utils/swapi";

export type ModalStackEntryState = "open" | "closing";

export interface ModalStackEntry {
    instanceId: string;
    resourceKey: ResourceCategoryKey;
    resourceId: string;
    routePath: string;
    closePath: string;
    state: ModalStackEntryState;
}

function markEntryClosing(entry: ModalStackEntry): ModalStackEntry {
    return {
        ...entry,
        state: "closing",
    };
}

interface ModalStackState {
    stack: ModalStackEntry[];
    syncToRoute: (target: ModalRouteTarget | null) => void;
    removeEntry: (instanceId: string) => void;
    resetStack: () => void;
}

let nextModalInstanceId = 0;

function createModalStackEntry(target: ModalRouteTarget): ModalStackEntry {
    nextModalInstanceId += 1;

    return {
        instanceId: `modal-${nextModalInstanceId}`,
        resourceKey: target.resourceKey,
        resourceId: target.resourceId,
        routePath: target.routePath,
        closePath: target.closePath,
        state: "open",
    };
}

function findLatestOpenEntryIndex(stack: ModalStackEntry[]) {
    for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index]?.state === "open") return index;
    }

    return -1;
}

export const useModalStackStore = create<ModalStackState>((set) => ({
    stack: [],
    syncToRoute: (target) => {
        set((state) => {
            const latestOpenEntryIndex = findLatestOpenEntryIndex(state.stack);

            if (!target) {
                if (latestOpenEntryIndex === -1) return state;

                return {
                    stack: state.stack.map((entry) => (
                        entry.state === "closing"
                            ? entry
                            : markEntryClosing(entry)
                    )),
                };
            }

            if (latestOpenEntryIndex === -1) {
                return {
                    stack: [...state.stack, createModalStackEntry(target)],
                };
            }

            const latestOpenEntry = state.stack[latestOpenEntryIndex];

            if (
                latestOpenEntry.resourceKey === target.resourceKey
                && latestOpenEntry.resourceId === target.resourceId
                && latestOpenEntry.routePath === target.routePath
                && latestOpenEntry.closePath === target.closePath
            ) {
                return state;
            }

            if (latestOpenEntry.resourceKey === target.resourceKey) {
                return {
                    stack: state.stack.map((entry, index) => (
                        index === latestOpenEntryIndex
                            ? {
                                ...entry,
                                resourceId: target.resourceId,
                                routePath: target.routePath,
                                closePath: target.closePath,
                                state: "open",
                            }
                            : entry
                    )),
                };
            }

            return {
                    stack: [
                        ...state.stack.map((entry, index) => (
                            index === latestOpenEntryIndex
                            ? markEntryClosing(entry)
                            : entry
                    )),
                    createModalStackEntry(target),
                ],
            };
        });
    },
    removeEntry: (instanceId) => {
        set((state) => ({
            stack: state.stack.filter((entry) => entry.instanceId !== instanceId),
        }));
    },
    resetStack: () => {
        set({ stack: [] });
    },
}));
