import { type ReactNode, useCallback, useMemo } from "react";
import { Stack, Text } from "@mantine/core";
import Modal from "@components/Modal";

type ResourceLoadMode = "initial" | "nextPage" | null;

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
    error,
    getItemId,
    onOpenItem,
    onCloseModal,
    renderModalContent,
    getModalAriaLabel,
}: ResourceModalRouteProps<TItem>) {
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

    const modalBody = selectedItem ? renderModalContent({
        item: selectedItem,
        selectedIndex: selectedItemIndex ?? 0,
        total: resources.length,
        onPrev: showPrevItem,
        onNext: showNextItem,
    }) : (
        <Stack align="center" gap="sm" py="lg">
            <Text c={error ? "red.4" : undefined} ta="center">
                {error ?? `${title} details are unavailable right now.`}
            </Text>
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
