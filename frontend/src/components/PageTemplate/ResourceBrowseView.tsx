import { type ReactNode } from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import HeaderSearch from "@components/PageTemplate/HeaderSearch";
import Modal from "@components/Modal";
import ListTemplate from "@components/PageTemplate/ListTemplate";
import PageTemplate from "@components/PageTemplate";

interface ResourceBrowseViewProps<TItem extends { url: string }> {
    title: string;
    headerIcon?: ReactNode;
    entityKey: string;
    items: TItem[];
    selectedItem: TItem | null;
    selectedIndex: number;
    totalItems: number;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    errorTitle: string;
    retryLabel: string;
    labelKey?: keyof TItem & string;
    getModalAriaLabel?: (item: TItem) => string;
    onRetry: () => void;
    onLoadMore: () => void;
    onOpenItem: (item: TItem) => void;
    onCloseModal: () => void;
    onNavigatePrev: () => void;
    onNavigateNext: () => void;
    renderModalContent: (options: {
        item: TItem;
        selectedIndex: number;
        total: number;
        onPrev: () => void;
        onNext: () => void;
    }) => ReactNode;
}

/* Shared presentational view for browse pages. */
export default function ResourceBrowseView<TItem extends { url: string }>({
    title,
    headerIcon,
    entityKey,
    items,
    selectedItem,
    selectedIndex,
    totalItems,
    loading,
    loadingMore,
    hasMore,
    error,
    errorTitle,
    retryLabel,
    labelKey,
    getModalAriaLabel,
    onRetry,
    onLoadMore,
    onOpenItem,
    onCloseModal,
    onNavigatePrev,
    onNavigateNext,
    renderModalContent,
}: ResourceBrowseViewProps<TItem>) {
    return (
        <PageTemplate
            title={title}
            headerIcon={headerIcon}
            headerAside={
                <HeaderSearch
                    items={items}
                    labelKey={labelKey}
                    placeholder={`Search ${title.toLowerCase()}`}
                    emptyLabel={`No matching ${title.toLowerCase()} loaded on this page yet.`}
                    onSelect={onOpenItem}
                />
            }
        >
            <Stack gap="md">
                {error ? (
                    <Alert color="red" title={errorTitle} variant="light">
                        <Stack gap="xs" align="flex-start">
                            <Text size="sm">{error}</Text>
                            <Button variant="light" color="red" onClick={onRetry}>
                                {retryLabel}
                            </Button>
                        </Stack>
                    </Alert>
                ) : null}

                <ListTemplate
                    items={items}
                    entityKey={entityKey}
                    labelKey={labelKey}
                    loading={loading}
                    onLoadMore={onLoadMore}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onItemClick={({ item }) => {
                        onOpenItem(item);
                    }}
                />
            </Stack>

            <Modal
                opened={selectedItem !== null}
                ariaLabel={selectedItem ? getModalAriaLabel?.(selectedItem) ?? `${title} details` : `${title} details`}
                onClose={onCloseModal}
                onNavigatePrev={onNavigatePrev}
                onNavigateNext={onNavigateNext}
            >
                {selectedItem ? renderModalContent({
                    item: selectedItem,
                    selectedIndex,
                    total: totalItems,
                    onPrev: onNavigatePrev,
                    onNext: onNavigateNext,
                }) : null}
            </Modal>
        </PageTemplate>
    );
}
