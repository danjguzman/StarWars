import { useState } from "react";
import { Box, Paper, Stack, Text } from "@mantine/core";
import {
    Alien as AlienIcon,
    CircleNotch as CircleNotchIcon,
    FlyingSaucer as FlyingSaucerIcon,
    Planet as PlanetIcon,
    Robot as RobotIcon,
    TrainRegional as TrainRegionalIcon,
    User,
    Users as UsersIcon,
} from "phosphor-react";
import { FilmReelIcon } from "@phosphor-icons/react";
import { getEntityImageSources } from "@utils/assets";
import { resourceIdFromUrl } from "@utils/swapi";
import InfiniteScrollSentinel from "@components/InfiniteScrollSentinel";
import { useInfiniteScroll } from "@utils/useInfiniteScroll";
import styles from "./index.module.css";

interface CardImageState {
    loaded: boolean;
    missing: boolean;
    imageSourceIndex: number;
}

/* Remember resolved card image state so revisiting a page does not replay the fallback flash. */
const persistedCardImageStateByUrl = new Map<string, CardImageState>();

/* Reset persisted card image state between isolated test runs. */
export function clearPersistedCardImageState() {
    persistedCardImageStateByUrl.clear();
}

interface ListTemplateProps<TItem extends { url: string }> {
    items: TItem[];
    entityKey: string;
    onLoadMore: () => void;
    loading?: boolean;
    hasMore: boolean;
    loadingMore: boolean;
    showCompletionIndicator?: boolean;
    labelKey?: keyof TItem & string;
    onItemClick?: (selection: { item: TItem; label: string }) => void;
}

function fallbackIconByEntityKey(entityKey: string) {
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

/* Read the best known image state for one card from the current render and persisted cache. */
function getCardImageState(
    itemUrl: string,
    loadedImageByUrl: Record<string, boolean>,
    missingImageByUrl: Record<string, boolean>,
    imageSourceIndexByUrl: Record<string, number>
) {
    const persistedState = persistedCardImageStateByUrl.get(itemUrl);

    return {
        loaded: loadedImageByUrl[itemUrl] ?? persistedState?.loaded ?? false,
        missing: missingImageByUrl[itemUrl] ?? persistedState?.missing ?? false,
        imageSourceIndex: imageSourceIndexByUrl[itemUrl] ?? persistedState?.imageSourceIndex ?? 0,
    } satisfies CardImageState;
}

/* Save the latest resolved image state so future mounts can reuse it immediately. */
function setPersistedCardImageState(itemUrl: string, nextState: CardImageState) {
    persistedCardImageStateByUrl.set(itemUrl, nextState);
}

export default function ListTemplate<TItem extends { url: string }>({
    items,
    entityKey,
    onLoadMore,
    loading = false,
    hasMore,
    loadingMore,
    showCompletionIndicator = true,
    labelKey = "name" as keyof TItem & string,
    onItemClick,
}: ListTemplateProps<TItem>) {
    const scrollMainContentToTop = () => {
        const scrollRoot = document.getElementById("app-main-scroll");

        if (scrollRoot && typeof scrollRoot.scrollTo === "function") {
            scrollRoot.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const [missingImageByUrl, setMissingImageByUrl] = useState<Record<string, boolean>>({});
    const [loadedImageByUrl, setLoadedImageByUrl] = useState<Record<string, boolean>>({});
    const [imageSourceIndexByUrl, setImageSourceIndexByUrl] = useState<Record<string, number>>({});
    const fallbackIcon = fallbackIconByEntityKey(entityKey);
    const sentinelRef = useInfiniteScroll({
        hasMore,
        onLoadMore,
        disabled: loading || loadingMore,
        contentLength: items.length,
    });

    /* Get & animate gradient rings on hover. */
    function getRingGradientId(item: TItem) {
        return `list-ring-gradient-${item.url.replace(/[^a-zA-Z0-9-_]/g, "-")}`;
    }

    /* Get all supported image variants for this resource card. */
    function getItemImageSources(item: TItem) {
        const itemId = resourceIdFromUrl(item.url);
        return getEntityImageSources(entityKey, itemId);
    }

    /* Get item label/name, or defauled to "unknown" since SWAPI does have some missing data. */
    function getItemLabel(item: TItem) {
        const value = item[labelKey];
        if (typeof value === "string" && value.length > 0) return value;
        return "Unknown";
    }

    return (
        <>
            <Box
                className={styles.grid}
            >
                {items.map((item) => {
                    const itemKey = item.url;
                    const itemLabel = getItemLabel(item);
                    const imageSources = getItemImageSources(item);
                    const cardImageState = getCardImageState(
                        item.url,
                        loadedImageByUrl,
                        missingImageByUrl,
                        imageSourceIndexByUrl
                    );
                    const imageSourceIndex = cardImageState.imageSourceIndex;
                    const imageSrc = imageSources[imageSourceIndex] ?? null;
                    const imageMissing = !imageSrc || cardImageState.missing;
                    const imageLoaded = cardImageState.loaded && !imageMissing;
                    const ringGradientId = getRingGradientId(item);
                    const isInteractive = Boolean(onItemClick);

                    const handleItemSelect = (target?: HTMLElement) => {
                        target?.blur();
                        onItemClick?.({ item, label: itemLabel });
                    };

                    return (
                        <Paper
                            key={itemKey}
                            className={`${styles.card}${isInteractive ? ` ${styles.cardInteractive}` : ""}`}
                            role={isInteractive ? "button" : undefined}
                            tabIndex={isInteractive ? 0 : undefined}
                            aria-label={isInteractive ? `Open ${itemLabel}` : undefined}
                            onClick={isInteractive ? (event) => {
                                handleItemSelect(event.currentTarget);
                            } : undefined}
                            onKeyDown={isInteractive
                                ? (event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        handleItemSelect(event.currentTarget);
                                    }
                                }
                                : undefined}
                        >
                            <Stack className={styles.cardContent}>
                                <Box
                                    className={styles.avatarFrame}
                                >
                                    <Box
                                        className={styles.avatarClip}
                                    >
                                        {!imageMissing && imageSrc && (
                                            <Box
                                                className={`${styles.avatarImage}${imageLoaded ? "" : ` ${styles.avatarImageHidden}`}`}
                                                component="img"
                                                src={imageSrc}
                                                alt={`${itemLabel} portrait`}
                                                data-loaded={imageLoaded ? "true" : "false"}
                                                onLoad={() => {
                                                    setPersistedCardImageState(item.url, {
                                                        loaded: true,
                                                        missing: false,
                                                        imageSourceIndex,
                                                    });

                                                    setLoadedImageByUrl((prev) => ({
                                                        ...prev,
                                                        [item.url]: true,
                                                    }));
                                                }}
                                                onError={() => {
                                                    const nextImageSourceIndex = imageSourceIndex + 1;

                                                    setPersistedCardImageState(item.url, {
                                                        loaded: false,
                                                        missing: false,
                                                        imageSourceIndex,
                                                    });

                                                    setLoadedImageByUrl((prev) => ({
                                                        ...prev,
                                                        [item.url]: false,
                                                    }));

                                                    if (nextImageSourceIndex < imageSources.length) {
                                                        setPersistedCardImageState(item.url, {
                                                            loaded: false,
                                                            missing: false,
                                                            imageSourceIndex: nextImageSourceIndex,
                                                        });

                                                        setImageSourceIndexByUrl((prev) => ({
                                                            ...prev,
                                                            [item.url]: nextImageSourceIndex,
                                                        }));
                                                        return;
                                                    }

                                                    setPersistedCardImageState(item.url, {
                                                        loaded: false,
                                                        missing: true,
                                                        imageSourceIndex,
                                                    });

                                                    setMissingImageByUrl((prev) => ({
                                                        ...prev,
                                                        [item.url]: true,
                                                    }));
                                                }}
                                            />
                                        )}
                                        {(!imageLoaded || imageMissing || !imageSrc) && fallbackIcon}
                                    </Box>

                                    <Box
                                        component="svg"
                                        className={styles.avatarRing}
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="xMidYMid meet"
                                        aria-hidden="true"
                                    >
                                        <defs>
                                            <linearGradient
                                                id={ringGradientId}
                                                x1="50"
                                                y1="0"
                                                x2="50"
                                                y2="100"
                                                gradientUnits="userSpaceOnUse"
                                            >
                                                <stop offset="0%" stopColor="#c3cad3" />
                                                <stop offset="18%" stopColor="#929baa" />
                                                <stop offset="55%" stopColor="#5d6676" />
                                                <stop offset="100%" stopColor="#2e3642" />
                                            </linearGradient>
                                        </defs>
                                    <circle className={styles.avatarRingBase} cx="50" cy="50" r="46" />
                                    <circle
                                        className={styles.avatarRingHighlight}
                                        cx="50"
                                        cy="50"
                                        r="46"
                                        stroke={`url(#${ringGradientId})`}
                                    />
                                </Box>
                                </Box>

                                <Text className={styles.itemLabel}>
                                    {itemLabel}
                                </Text>
                            </Stack>
                        </Paper>
                    );
                })}
            </Box>

            <InfiniteScrollSentinel
                sentinelRef={sentinelRef}
                hasItems={items.length > 0}
                hasMore={hasMore}
                loadingMore={loadingMore}
                showDone={showCompletionIndicator && !hasMore && items.length > 0}
                loadingIndicator={
                    <Box className={styles.loadingIcon}>
                        <CircleNotchIcon size={32} weight="duotone" color="currentColor" />
                    </Box>
                }
                doneIndicator={
                    <Box className={styles.doneIcon}>
                        <RobotIcon size={32} weight="duotone" color="currentColor" />
                    </Box>
                }
                doneClassName={styles.doneEnter}
                onDoneClick={scrollMainContentToTop}
                doneAriaLabel="Scroll to top"
            />
        </>
    );
}
