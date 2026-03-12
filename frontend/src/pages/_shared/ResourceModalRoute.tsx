import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Group, Loader, Stack, Text } from "@mantine/core";
import Modal from "@components/Modal";

type ResourceLoadMode = "initial" | "nextPage" | null;
const MODAL_LOADING_MIN_MS = 1000;

interface ResourceModalRouteProps<TItem extends { url: string }> {
    title: string;
    routeItemId?: string;
    resources: TItem[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    lastFailedRequestMode: ResourceLoadMode;
    initialItemCount: number;
    fetchResources: (options?: { nextPage?: boolean; targetCount?: number }) => Promise<void>;
    getItemId: (item: TItem) => string | null;
    onOpenItem: (item: TItem) => void;
    onCloseModal: () => void;
    renderModalContent: (options: {
        item: TItem;
        selectedIndex: number;
        total: number;
        onPrev: () => void;
        onNext: () => void;
    }) => ReactNode;
    getModalAriaLabel?: (item: TItem) => string;
}

/* Shared route-level container that renders a modal over the current browse page. */
export default function ResourceModalRoute<TItem extends { url: string }>({
    title,
    routeItemId,
    resources,
    loading,
    loadingMore,
    hasMore,
    error,
    lastFailedRequestMode,
    initialItemCount,
    fetchResources,
    getItemId,
    onOpenItem,
    onCloseModal,
    renderModalContent,
    getModalAriaLabel,
}: ResourceModalRouteProps<TItem>) {
    const loadingFallbackStartRef = useRef<number | null>(null);
    const loadingFallbackTimeoutRef = useRef<number | null>(null);
    const [showLoadingFallback, setShowLoadingFallback] = useState(false);
    const selectedItemIndex = useMemo(() => {
        if (!routeItemId) return null;
        return resources.findIndex((item) => getItemId(item) === routeItemId);
    }, [getItemId, resources, routeItemId]);

    const selectedItem = selectedItemIndex !== null && selectedItemIndex >= 0 && selectedItemIndex < resources.length
        ? resources[selectedItemIndex]
        : null;
    const shouldShowLoadingFallback = Boolean(routeItemId) && !selectedItem && !error;

    const openItemByIndex = useCallback((index: number) => {
        const targetItem = resources[index];
        if (!targetItem) return;
        onOpenItem(targetItem);
    }, [onOpenItem, resources]);

    const showPrevItem = useCallback(() => {
        if (selectedItemIndex === null || selectedItemIndex < 0 || resources.length === 0) return;
        openItemByIndex((selectedItemIndex - 1 + resources.length) % resources.length);
    }, [openItemByIndex, resources.length, selectedItemIndex]);

    const showNextItem = useCallback(() => {
        if (selectedItemIndex === null || selectedItemIndex < 0 || resources.length === 0) return;
        openItemByIndex((selectedItemIndex + 1) % resources.length);
    }, [openItemByIndex, resources.length, selectedItemIndex]);

    const retryResourceLoad = useCallback(() => {
        if (lastFailedRequestMode === "nextPage" && resources.length > 0) {
            void fetchResources({ nextPage: true });
            return;
        }

        void fetchResources({ targetCount: initialItemCount });
    }, [fetchResources, initialItemCount, lastFailedRequestMode, resources.length]);

    useEffect(() => {
        return () => {
            if (loadingFallbackTimeoutRef.current !== null) {
                window.clearTimeout(loadingFallbackTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!routeItemId) {
            if (loadingFallbackTimeoutRef.current !== null) {
                window.clearTimeout(loadingFallbackTimeoutRef.current);
                loadingFallbackTimeoutRef.current = null;
            }
            loadingFallbackStartRef.current = null;
            setShowLoadingFallback(false);
            return;
        }

        if (shouldShowLoadingFallback) {
            if (loadingFallbackTimeoutRef.current !== null) {
                window.clearTimeout(loadingFallbackTimeoutRef.current);
                loadingFallbackTimeoutRef.current = null;
            }

            if (!showLoadingFallback) {
                loadingFallbackStartRef.current = Date.now();
                setShowLoadingFallback(true);
            }

            return;
        }

        if (!showLoadingFallback) return;

        const loadingStartedAt = loadingFallbackStartRef.current;
        const elapsed = loadingStartedAt ? Date.now() - loadingStartedAt : MODAL_LOADING_MIN_MS;
        const remaining = MODAL_LOADING_MIN_MS - elapsed;

        if (remaining <= 0) {
            loadingFallbackStartRef.current = null;
            setShowLoadingFallback(false);
            return;
        }

        loadingFallbackTimeoutRef.current = window.setTimeout(() => {
            loadingFallbackTimeoutRef.current = null;
            loadingFallbackStartRef.current = null;
            setShowLoadingFallback(false);
        }, remaining);

        return () => {
            if (loadingFallbackTimeoutRef.current !== null) {
                window.clearTimeout(loadingFallbackTimeoutRef.current);
                loadingFallbackTimeoutRef.current = null;
            }
        };
    }, [routeItemId, shouldShowLoadingFallback, showLoadingFallback]);

    useEffect(() => {
        if (!routeItemId) return;
        void fetchResources({ targetCount: initialItemCount });
    }, [fetchResources, initialItemCount, routeItemId]);

    useEffect(() => {
        if (!routeItemId || loading || loadingMore || !hasMore) return;
        if (selectedItemIndex !== -1) return;

        void fetchResources({ nextPage: true });
    }, [fetchResources, hasMore, loading, loadingMore, routeItemId, selectedItemIndex]);

    const modalBody = selectedItem && !showLoadingFallback ? renderModalContent({
        item: selectedItem,
        selectedIndex: selectedItemIndex ?? 0,
        total: resources.length,
        onPrev: showPrevItem,
        onNext: showNextItem,
    }) : (
        <Stack align="center" gap="sm" py="lg">
            {showLoadingFallback ? (
                <Loader color="yellow" size="md" type="oval" />
            ) : null}
            <Text c={showLoadingFallback ? undefined : error ? "red.4" : undefined} ta="center" role={showLoadingFallback ? "status" : undefined}>
                {showLoadingFallback ? `Loading ${title.toLowerCase()} details...` : error}
            </Text>
            {!showLoadingFallback && error ? (
                <Group>
                    <Button variant="light" color="red" onClick={retryResourceLoad}>
                        Retry
                    </Button>
                </Group>
            ) : null}
        </Stack>
    );

    return (
        <Modal
            opened={Boolean(routeItemId)}
            ariaLabel={selectedItem ? getModalAriaLabel?.(selectedItem) ?? `${title} details` : `Loading ${title} details`}
            onClose={onCloseModal}
            onNavigatePrev={showPrevItem}
            onNavigateNext={showNextItem}
        >
            {modalBody}
        </Modal>
    );
}
