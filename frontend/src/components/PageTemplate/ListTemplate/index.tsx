import { useState } from "react";
import { Box, Center, Paper, Stack, Text } from "@mantine/core";
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
import {
    ASSET_IMAGE_BASE_PATH,
    TILE_AVATAR_SIZE,
    TILE_HEIGHT,
    TILE_MIN_WIDTH,
} from "@utils/consts";
import { resourceIdFromUrl } from "@utils/swapi";
import InfiniteScrollSentinel from "@components/InfiniteScrollSentinel";
import { useInfiniteScroll } from "@utils/useInfiniteScroll";
import styles from "./index.module.css";

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
    const [missingImageByUrl, setMissingImageByUrl] = useState<Record<string, boolean>>({});
    const [loadedImageByUrl, setLoadedImageByUrl] = useState<Record<string, boolean>>({});
    const fallbackIcon = fallbackIconByEntityKey(entityKey);
    const showInitialLoading = loading && items.length === 0;
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

    /* Get item avatars. */
    function getItemImageSrc(item: TItem) {
        const itemId = resourceIdFromUrl(item.url);
        if (!itemId)return null;
        return `${ASSET_IMAGE_BASE_PATH}/${entityKey}/${itemId}.jpg`;
    }

    /* Get item label/name, or defauled to "unknown" since SWAPI does have some missing data. */
    function getItemLabel(item: TItem) {
        const value = item[labelKey];
        if (typeof value === "string" && value.length > 0) return value;
        return "Unknown";
    }

    return (
        <>
            {showInitialLoading ? (
                <Center className={styles.initialLoadingShell} role="status" aria-live="polite">
                    <Box className={styles.loadingIcon}>
                        <CircleNotchIcon size={40} weight="duotone" color="currentColor" />
                    </Box>
                </Center>
            ) : null}

            <Box
                className={styles.grid}
                style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_MIN_WIDTH}px, 1fr))`,
                }}
            >
                {items.map((item) => {
                    const itemKey = item.url;
                    const itemLabel = getItemLabel(item);
                    const imageSrc = getItemImageSrc(item);
                    const imageMissing = !imageSrc || Boolean(missingImageByUrl[item.url]);
                    const imageLoaded = Boolean(loadedImageByUrl[item.url]) && !imageMissing;
                    const ringGradientId = getRingGradientId(item);
                    const isInteractive = Boolean(onItemClick);

                    const handleItemSelect = (target?: HTMLElement) => {
                        target?.blur();
                        onItemClick?.({ item, label: itemLabel });
                    };

                    return (
                        <Paper
                            key={itemKey}
                            className={styles.card}
                            p="md"
                            radius="md"
                            style={{
                                minWidth: 0,
                                minHeight: TILE_HEIGHT,
                                cursor: isInteractive ? "pointer" : "default",
                            }}
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
                            <Stack align="center" justify="center" h="100%" gap="md">
                                <Box
                                    className={styles.avatarFrame}
                                    w={TILE_AVATAR_SIZE}
                                    h={TILE_AVATAR_SIZE}
                                    style={{
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Box
                                        className={styles.avatarClip}
                                        w="100%"
                                        h="100%"
                                        style={{
                                            borderRadius: "50%",
                                            overflow: "hidden",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "var(--mantine-color-dark-6)",
                                        }}
                                    >
                                        {!imageMissing && imageSrc && (
                                            <Box
                                                className={`${styles.avatarImage}${imageLoaded ? "" : ` ${styles.avatarImageHidden}`}`}
                                                component="img"
                                                src={imageSrc}
                                                alt={`${itemLabel} portrait`}
                                                data-loaded={imageLoaded ? "true" : "false"}
                                                w="100%"
                                                h="100%"
                                                style={{
                                                    objectFit: "cover",
                                                    objectPosition: "top center",
                                                    display: "block",
                                                }}
                                                onLoad={() => {
                                                    setLoadedImageByUrl((prev) => ({
                                                        ...prev,
                                                        [item.url]: true,
                                                    }));
                                                }}
                                                onError={() => {
                                                    setLoadedImageByUrl((prev) => ({
                                                        ...prev,
                                                        [item.url]: false,
                                                    }));
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

                                <Text fw={600} ta="center" className={styles.itemLabel}>
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
                onDoneClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                doneAriaLabel="Scroll to top"
            />
        </>
    );
}
