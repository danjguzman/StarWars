import { type ReactNode, useCallback, useMemo } from "react";
import { Stack, Text } from "@mantine/core";
import Modal from "@components/Modal";
import { type ModalStackEntry } from "@stores/modalStackStore";
import styles from "./ResourceModalLayer.module.css";

interface ResourceModalLayerProps<TItem extends { url: string }> {
    title: string;
    entry: ModalStackEntry;
    resources: TItem[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    onCloseModal: () => void;
    onOpenItem: (item: TItem) => void;
    getItemId: (item: TItem) => string | null;
    renderModalContent: (options: {
        item: TItem;
        selectedIndex: number;
        total: number;
        onPrev: () => void;
        onNext: () => void;
    }) => ReactNode;
    getModalAriaLabel?: (item: TItem) => string;
    zIndex: number;
    interactive: boolean;
    lockScroll: boolean;
    onExitComplete: (instanceId: string) => void;
}

export default function ResourceModalLayer<TItem extends { url: string }>({
    title,
    entry,
    resources,
    loading,
    loadingMore,
    error,
    onCloseModal,
    onOpenItem,
    getItemId,
    renderModalContent,
    getModalAriaLabel,
    zIndex,
    interactive,
    lockScroll,
    onExitComplete,
}: ResourceModalLayerProps<TItem>) {
    const selectedItemIndex = useMemo(() => {
        return resources.findIndex((item) => getItemId(item) === entry.resourceId);
    }, [entry.resourceId, getItemId, resources]);

    const selectedItem = selectedItemIndex >= 0 && selectedItemIndex < resources.length
        ? resources[selectedItemIndex]
        : null;

    const openItemByIndex = useCallback((index: number) => {
        const targetItem = resources[index];
        if (!targetItem) return;
        onOpenItem(targetItem);
    }, [onOpenItem, resources]);

    const showPrevItem = useCallback(() => {
        if (selectedItemIndex < 0 || resources.length === 0) return;
        openItemByIndex((selectedItemIndex - 1 + resources.length) % resources.length);
    }, [openItemByIndex, resources.length, selectedItemIndex]);

    const showNextItem = useCallback(() => {
        if (selectedItemIndex < 0 || resources.length === 0) return;
        openItemByIndex((selectedItemIndex + 1) % resources.length);
    }, [openItemByIndex, resources.length, selectedItemIndex]);

    const modalBody = selectedItem ? renderModalContent({
        item: selectedItem,
        selectedIndex: selectedItemIndex,
        total: resources.length,
        onPrev: showPrevItem,
        onNext: showNextItem,
    }) : (
        <Stack className={styles.statusStack}>
            <Text className={styles.statusText}>
                {loading || loadingMore
                    ? `Loading ${title.toLowerCase()} details...`
                    : error ?? `${title} details are unavailable right now.`}
            </Text>
        </Stack>
    );

    return (
        <Modal
            opened={entry.state === "open"}
            closing={entry.state === "closing"}
            ariaLabel={selectedItem ? getModalAriaLabel?.(selectedItem) ?? `${title} details` : `Loading ${title} details`}
            onClose={onCloseModal}
            onNavigatePrev={showPrevItem}
            onNavigateNext={showNextItem}
            allowInteraction={interactive}
            lockScroll={lockScroll}
            zIndex={zIndex}
            onExitComplete={() => {
                onExitComplete(entry.instanceId);
            }}
        >
            {modalBody}
        </Modal>
    );
}
