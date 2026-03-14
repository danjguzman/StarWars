import { type ReactNode } from "react";
import { Alert, Box, Button, Text } from "@mantine/core";
import {
    Alien as AlienIcon,
    FlyingSaucer as FlyingSaucerIcon,
    Planet as PlanetIcon,
    TrainRegional as TrainRegionalIcon,
    User,
    Users as UsersIcon,
} from "phosphor-react";
import { FilmReelIcon } from "@phosphor-icons/react";
import HeaderSearch from "@components/PageTemplate/HeaderSearch";
import ListTemplate from "@components/PageTemplate/ListTemplate";
import PageTemplate from "@components/PageTemplate";
import styles from "./ResourceBrowseView.module.css";

interface ResourceBrowseViewProps<TItem extends { url: string }> {
    title: string;
    headerIcon?: ReactNode;
    entityKey: string;
    items: TItem[];
    searchItems?: TItem[];
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

function emptyStateIconByEntityKey(entityKey: string) {
    const commonProps = {
        size: 96,
        color: "var(--mantine-color-gray-5)",
        weight: "regular" as const,
    };

    if (entityKey === "films") return <FilmReelIcon {...commonProps} />;
    if (entityKey === "people") return <UsersIcon {...commonProps} />;
    if (entityKey === "planets") return <PlanetIcon {...commonProps} />;
    if (entityKey === "species") return <AlienIcon {...commonProps} />;
    if (entityKey === "vehicles") return <TrainRegionalIcon {...commonProps} />;
    if (entityKey === "starships") return <FlyingSaucerIcon {...commonProps} />;
    return <User {...commonProps} />;
}

/* Shared presentational view for browse pages. */
export default function ResourceBrowseView<TItem extends { url: string }>({
    title,
    headerIcon,
    entityKey,
    items,
    searchItems,
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
    const showEmptyState = !loading && !error && items.length === 0;

    return (
        <PageTemplate
            title={title}
            headerIcon={headerIcon}
            headerAside={
                <HeaderSearch
                    items={searchItems ?? items}
                    labelKey={labelKey}
                    placeholder={`Search ${title.toLowerCase()}`}
                    emptyLabel={`No matching ${title.toLowerCase()} loaded on this page yet.`}
                    onSelect={onOpenItem}
                />
            }
        >
            <Box className={styles.contentStack}>
                {error ? (
                    <Alert className={styles.errorAlert} title={errorTitle}>
                        <Box className={styles.errorBody}>
                            <Text className={styles.errorMessage}>{error}</Text>
                            <Button className={styles.retryButton} onClick={onRetry}>
                                {retryLabel}
                            </Button>
                        </Box>
                    </Alert>
                ) : null}

                {showEmptyState ? (
                    <Box className={styles.emptyState}>
                        <Box className={styles.emptyStateContent}>
                            {emptyStateIconByEntityKey(entityKey)}
                            <Text className={styles.emptyStateLabel}>{`No ${title} Available`}</Text>
                        </Box>
                    </Box>
                ) : (
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
                )}
            </Box>
        </PageTemplate>
    );
}
