import { type ReactNode, useCallback, useEffect, useMemo } from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import Modal from "@components/Modal";
import ListTemplate from "@components/PageTemplate/ListTemplate";
import PageTemplate from "@components/PageTemplate";

type ResourceLoadMode = "initial" | "nextPage" | null;

interface ResourceBrowsePageProps<TItem extends { url: string }> {
    title: string;
    headerIcon?: ReactNode;
    entityKey: string;
    routeItemId?: string;
    resources: TItem[];
    cachedResources?: TItem[] | null;
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
    errorUi?: {
        initialTitle: string;
        nextPageTitle: string;
        initialRetryLabel: string;
        nextPageRetryLabel: string;
    };
}

export default function ResourceBrowsePage<TItem extends { url: string }>({
    title,
    headerIcon,
    entityKey,
    routeItemId,
    resources,
    cachedResources = null,
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
    errorUi = {
        initialTitle: `Couldn't load ${title}`,
        nextPageTitle: `Couldn't load more ${title.toLowerCase()}`,
        initialRetryLabel: `Retry loading ${title.toLowerCase()}`,
        nextPageRetryLabel: "Try loading more again",
    },
}: ResourceBrowsePageProps<TItem>) {
    /* Use the full cached resource list for modal navigation when it is available. */
    const modalItems = useMemo(() => {
        if (cachedResources && cachedResources.length > 0) return cachedResources;
        return resources;
    }, [cachedResources, resources]);

    /* Show loaded items first, or a small cached slice while the first request is still loading. */
    const visibleItems = useMemo(() => {
        if (resources.length > 0) return resources;
        if (modalItems.length === 0) return [];
        return modalItems.slice(0, initialItemCount);
    }, [initialItemCount, modalItems, resources]);

    /* Find which item in the modal list matches the id in the current route. */
    const selectedItemIndex = useMemo(() => {
        if (!routeItemId) return null;
        return modalItems.findIndex((item) => getItemId(item) === routeItemId);
    }, [getItemId, modalItems, routeItemId]);

    /* Read the selected item only when the route points to a real item in the list. */
    const selectedItem = selectedItemIndex !== null && selectedItemIndex >= 0 && selectedItemIndex < modalItems.length
        ? modalItems[selectedItemIndex]
        : null;

    /* Open the modal route for the item at the matching index. */
    const openItemByIndex = useCallback((index: number) => {
        const targetItem = modalItems[index];
        if (!targetItem) return;
        onOpenItem(targetItem);
    }, [modalItems, onOpenItem]);

    /* Go to the previous item and wrap to the end when needed. */
    const showPrevItem = useCallback(() => {
        if (selectedItemIndex === null || selectedItemIndex < 0 || modalItems.length === 0) return;
        openItemByIndex((selectedItemIndex - 1 + modalItems.length) % modalItems.length);
    }, [modalItems.length, openItemByIndex, selectedItemIndex]);

    /* Go to the next item and wrap to the start when needed. */
    const showNextItem = useCallback(() => {
        if (selectedItemIndex === null || selectedItemIndex < 0 || modalItems.length === 0) return;
        openItemByIndex((selectedItemIndex + 1) % modalItems.length);
    }, [modalItems.length, openItemByIndex, selectedItemIndex]);

    /* Retry the failed request, either for more results or for the first load. */
    const retryResourceLoad = useCallback(() => {
        if (lastFailedRequestMode === "nextPage" && visibleItems.length > 0) {
            void fetchResources({ nextPage: true });
            return;
        }

        void fetchResources({ targetCount: initialItemCount });
    }, [fetchResources, initialItemCount, lastFailedRequestMode, visibleItems.length]);

    /* Load the first batch of items when the page opens. */
    useEffect(() => {
        void fetchResources({ targetCount: initialItemCount });
    }, [fetchResources, initialItemCount]);

    /* Keep loading more pages when the URL points to an item that is not loaded yet. */
    useEffect(() => {
        if (!routeItemId || loading || loadingMore || !hasMore) return;
        if (selectedItemIndex !== -1) return;

        void fetchResources({ nextPage: true });
    }, [fetchResources, hasMore, loading, loadingMore, routeItemId, selectedItemIndex]);

    return (
        <PageTemplate title={title} headerIcon={headerIcon}>
            <Stack gap="md">
                {/* Show a clear error message and retry action when loading fails. */}
                {error ? (
                    <Alert
                        color="red"
                        title={lastFailedRequestMode === "nextPage" ? errorUi.nextPageTitle : errorUi.initialTitle}
                        variant="light"
                    >
                        <Stack gap="xs" align="flex-start">
                            <Text size="sm">{error}</Text>
                            <Button variant="light" color="red" onClick={retryResourceLoad}>
                                {lastFailedRequestMode === "nextPage" ? errorUi.nextPageRetryLabel : errorUi.initialRetryLabel}
                            </Button>
                        </Stack>
                    </Alert>
                ) : null}

                {/* Show the resource grid and load more items when the list reaches the end. */}
                <ListTemplate
                    items={visibleItems}
                    entityKey={entityKey}
                    onLoadMore={() => {
                        void fetchResources({ nextPage: true });
                    }}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onItemClick={({ item }) => {
                        onOpenItem(item);
                    }}
                />
            </Stack>

            {/* Show the shared details modal when an item is selected. */}
            <Modal
                opened={selectedItem !== null}
                ariaLabel={selectedItem ? getModalAriaLabel?.(selectedItem) ?? `${title} details` : `${title} details`}
                onClose={onCloseModal}
                onNavigatePrev={showPrevItem}
                onNavigateNext={showNextItem}
            >
                {selectedItem ? renderModalContent({
                    item: selectedItem,
                    selectedIndex: selectedItemIndex ?? 0,
                    total: modalItems.length,
                    onPrev: showPrevItem,
                    onNext: showNextItem,
                }) : null}
            </Modal>
        </PageTemplate>
    );
}
