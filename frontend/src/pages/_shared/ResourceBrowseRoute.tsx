import { type ReactNode, useCallback, useEffect, useMemo } from "react";
import ResourceBrowseView from "@components/PageTemplate/ResourceBrowseView";

type ResourceLoadMode = "initial" | "nextPage" | null;

interface ResourceBrowseRouteProps<TItem extends { url: string }> {
    title: string;
    headerIcon?: ReactNode;
    entityKey: string;
    routeItemId?: string;
    resources: TItem[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    lastFailedRequestMode: ResourceLoadMode;
    initialItemCount: number;
    labelKey?: keyof TItem & string;
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

/* Shared route-level container for resource browse pages. */
export default function ResourceBrowseRoute<TItem extends { url: string }>({
    title,
    headerIcon,
    entityKey,
    routeItemId,
    resources,
    loading,
    loadingMore,
    hasMore,
    error,
    lastFailedRequestMode,
    initialItemCount,
    labelKey,
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
}: ResourceBrowseRouteProps<TItem>) {
    const showInitialLoading = loading || (resources.length === 0 && !error && lastFailedRequestMode !== "initial");

    const selectedItemIndex = useMemo(() => {
        if (!routeItemId) return null;
        return resources.findIndex((item) => getItemId(item) === routeItemId);
    }, [getItemId, resources, routeItemId]);

    const selectedItem = selectedItemIndex !== null && selectedItemIndex >= 0 && selectedItemIndex < resources.length
        ? resources[selectedItemIndex]
        : null;

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
        void fetchResources({ targetCount: initialItemCount });
    }, [fetchResources, initialItemCount]);

    useEffect(() => {
        if (!routeItemId || loading || loadingMore || !hasMore) return;
        if (selectedItemIndex !== -1) return;

        void fetchResources({ nextPage: true });
    }, [fetchResources, hasMore, loading, loadingMore, routeItemId, selectedItemIndex]);

    const isNextPageError = lastFailedRequestMode === "nextPage";

    return (
        <ResourceBrowseView
            title={title}
            headerIcon={headerIcon}
            entityKey={entityKey}
            items={resources}
            selectedItem={selectedItem}
            selectedIndex={selectedItemIndex ?? 0}
            totalItems={resources.length}
            loading={showInitialLoading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            errorTitle={isNextPageError ? errorUi.nextPageTitle : errorUi.initialTitle}
            retryLabel={isNextPageError ? errorUi.nextPageRetryLabel : errorUi.initialRetryLabel}
            labelKey={labelKey}
            getModalAriaLabel={getModalAriaLabel}
            onRetry={retryResourceLoad}
            onLoadMore={() => {
                void fetchResources({ nextPage: true });
            }}
            onOpenItem={onOpenItem}
            onCloseModal={onCloseModal}
            onNavigatePrev={showPrevItem}
            onNavigateNext={showNextItem}
            renderModalContent={renderModalContent}
        />
    );
}
