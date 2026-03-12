import { type ReactNode } from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import HeaderSearch from "@components/PageTemplate/HeaderSearch";
import ListTemplate from "@components/PageTemplate/ListTemplate";
import PageTemplate from "@components/PageTemplate";

interface ResourceBrowseViewProps<TItem extends { url: string }> {
    title: string;
    headerIcon?: ReactNode;
    entityKey: string;
    items: TItem[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    showCompletionIndicator?: boolean;
    error: string | null;
    errorTitle: string;
    retryLabel: string;
    labelKey?: keyof TItem & string;
    onRetry: () => void;
    onLoadMore: () => void;
    onOpenItem: (item: TItem) => void;
}

/* Shared presentational view for browse pages. */
export default function ResourceBrowseView<TItem extends { url: string }>({
    title,
    headerIcon,
    entityKey,
    items,
    loading,
    loadingMore,
    hasMore,
    showCompletionIndicator = true,
    error,
    errorTitle,
    retryLabel,
    labelKey,
    onRetry,
    onLoadMore,
    onOpenItem,
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
                    showCompletionIndicator={showCompletionIndicator}
                    onItemClick={({ item }) => {
                        onOpenItem(item);
                    }}
                />
            </Stack>
        </PageTemplate>
    );
}
