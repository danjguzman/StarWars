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
    const showCompletionIndicator = !hasMore && resources.length > initialItemCount;

    return (
        <ResourceBrowseView
            title={title}
            headerIcon={headerIcon}
            entityKey={entityKey}
            items={resources}
            loading={showInitialLoading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            showCompletionIndicator={showCompletionIndicator}
            error={error}
            errorTitle={isNextPageError ? errorUi.nextPageTitle : errorUi.initialTitle}
            retryLabel={isNextPageError ? errorUi.nextPageRetryLabel : errorUi.initialRetryLabel}
            labelKey={labelKey}
            onRetry={retryResourceLoad}
            onLoadMore={() => {
                void fetchResources({ nextPage: true });
            }}
            onOpenItem={onOpenItem}
        />
    );
}
