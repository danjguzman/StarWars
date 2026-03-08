import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Flex,
    Paper,
    Stack,
    Text,
} from "@mantine/core";
import {
    CircleNotch as CircleNotchIcon,
    Robot as RobotIcon,
    Users,
    User,
} from "phosphor-react";
import InfiniteScrollSentinel from "@components/InfiniteScrollSentinel";
import PageTemplate from "@components/PageTemplate";
import { usePeopleStore } from "@stores/peopleStore";
import { useInfiniteScroll } from "@utils/useInfiniteScroll";
import {
    estimateInitialTargetCount,
    TILE_AVATAR_SIZE,
    TILE_HEIGHT,
    TILE_MIN_WIDTH,
} from "@utils/layout";
import { personIdFromUrl } from "@utils/swapi";

/* People list page component. */
export default function People() {
    const {
        people,
        loading,
        loadingMore,
        error,
        hasMore,
        fetchPeople,
    } = usePeopleStore();
    const [missingImageByUrl, setMissingImageByUrl] = useState<Record<string, boolean>>({});

    /* Attach infinite scroll to a bottom sentinel element. */
    const sentinelRef = useInfiniteScroll({
        hasMore,
        onLoadMore: () => fetchPeople({ nextPage: true }),
        disabled: loading || loadingMore,
        contentLength: people.length,
    });

    /* Fetch initial data on first render with estimated tile count. */
    useEffect(() => {
        fetchPeople({ targetCount: estimateInitialTargetCount() });
    }, [fetchPeople]);

    /* Show final status only when all pages are loaded. */
    const shouldShowAllLoadedIcon = !hasMore && people.length > 0;

    /* Render blocking states before the list. */
    if (loading) return <Text>Loading...</Text>;
    if (error) return <Alert color="red">{error}</Alert>;

    return (
        <PageTemplate
            title="People"
            headerIcon={
                <Box className="app-page-header-icon">
                    <Users size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
        >

            {/* Render List of Items. */}
            <Flex gap="md" wrap="wrap">
                {people.map((p) => {
                    
                    /* Map SWAPI person URL id to local image path. */
                    const personId = personIdFromUrl(p.url);
                    const imageSrc = personId ? `/assets/img/people/${personId}.jpg` : null;
                    const showFallbackIcon = !imageSrc || Boolean(missingImageByUrl[p.url]);
                    const ringGradientId = `people-ring-gradient-${personId ?? p.name.replace(/\s+/g, "-").toLowerCase()}`;

                    return (
                        <Paper
                            key={p.url}
                            className="people-tile"
                            p="md"
                            radius="md"
                            style={{
                                flex: `1 1 ${TILE_MIN_WIDTH}px`,
                                minWidth: 0,
                                minHeight: TILE_HEIGHT,
                                cursor: "pointer",
                            }}
                        >
                            <Stack align="center" justify="center" h="100%" gap="md">
                                <Box
                                    className="people-avatar-frame"
                                    w={TILE_AVATAR_SIZE}
                                    h={TILE_AVATAR_SIZE}
                                    style={{
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {/* Avatar */}
                                    <Box
                                        className="people-avatar-clip"
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
                                        {!showFallbackIcon && imageSrc && (
                                            <Box
                                                className="people-avatar-image"
                                                component="img"
                                                src={imageSrc}
                                                alt={`${p.name} portrait`}
                                                w="100%"
                                                h="100%"
                                                style={{
                                                    objectFit: "cover",
                                                    objectPosition: "top center",
                                                    display: "block",
                                                }}
                                                onError={() => {
                                                    setMissingImageByUrl((prev) => ({
                                                        ...prev,
                                                        [p.url]: true,
                                                    }));
                                                }}
                                            />
                                        )}
                                        {showFallbackIcon && (
                                            <User size={96} color="var(--mantine-color-gray-5)" weight="regular" />
                                        )}
                                    </Box>

                                    {/* Avatar Rings */}
                                    <Box
                                        component="svg"
                                        className="people-avatar-ring"
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
                                        <circle className="people-avatar-ring-base" cx="50" cy="50" r="47" />
                                        <circle
                                            className="people-avatar-ring-highlight"
                                            cx="50"
                                            cy="50"
                                            r="47"
                                            stroke={`url(#${ringGradientId})`}
                                        />
                                    </Box>
                                </Box>

                                {/* Label */}
                                <Text fw={600} ta="center" className="app-character-name">
                                    {p.name}
                                </Text>
                            </Stack>
                        </Paper>
                    );
                })}
            </Flex>

            {/* Trigger fetch when Sentinel is in view. */}
            <InfiniteScrollSentinel
                sentinelRef={sentinelRef}
                hasItems={people.length > 0}
                hasMore={hasMore}
                loadingMore={loadingMore}
                showDone={shouldShowAllLoadedIcon}
                loadingIndicator={
                    <CircleNotchIcon
                        size={32}
                        weight="duotone"
                        color="var(--mantine-color-yellow-4)"
                        style={{
                            animation: "people-loading-spin 1s linear infinite",
                            filter: "drop-shadow(0 0 8px var(--mantine-color-yellow-4))",
                        }}
                    />
                }
                doneIndicator={
                    <Box className="people-done-indicator">
                        <RobotIcon size={32} weight="duotone" color="currentColor" />
                    </Box>
                }
                doneAnimation="people-all-loaded-in 180ms ease-out 120ms both"
                onDoneClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                doneAriaLabel="Scroll to top"
            />
        </PageTemplate>
    );
}
