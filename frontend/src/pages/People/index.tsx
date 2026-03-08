import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Center,
    Flex,
    Paper,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { usePeopleStore } from "@stores/peopleStore";
import { useInfiniteScroll } from "@utils/useInfiniteScroll";
import {
    estimateInitialTargetCount,
    TILE_HEIGHT,
    TILE_MIN_WIDTH,
} from "@utils/layout";

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
    const [showAllLoadedMessage, setShowAllLoadedMessage] = useState(true);

    /* Attach infinite scroll to a bottom sentinel element. */
    const sentinelRef = useInfiniteScroll({
        hasMore,
        onLoadMore: () => fetchPeople({ nextPage: true }),
        disabled: loading || loadingMore,
        contentLength: people.length,
    });

    /* Fetch initial data on first render. */
    useEffect(() => {
        fetchPeople({ targetCount: estimateInitialTargetCount() });
    }, [fetchPeople]);

    /* Hide the final status message after five seconds. */
    useEffect(() => {

        /* Avoid showing final 'All Loaded' message if it's not needed. */
        if (hasMore || people.length === 0 || !showAllLoadedMessage) return;

        /* Keep the final 'All Loaded' status visible briefly before hiding it. */
        const timeout = window.setTimeout(() => { setShowAllLoadedMessage(false); }, 5000);
        
        return () => {
            window.clearTimeout(timeout);
        };
    }, [hasMore, people.length, showAllLoadedMessage]);

    /* Show final status when all pages are loaded. */
    const shouldShowAllLoadedMessage = !hasMore && people.length > 0 && showAllLoadedMessage;

    /* Render blocking states before the list. */
    if (loading) return <Text>Loading...</Text>;
    if (error) return <Alert color="red">{error}</Alert>;

    return (
        <Stack gap="md">

            {/* Page Header */}
            <Title order={3}>People</Title>

            {/* Render List of Items. */}
            <Flex gap="md" wrap="wrap">
                {people.map((p) => (
                    <Paper
                        key={p.url}
                        withBorder
                        p="md"
                        radius="md"
                        bg="dark.7"
                        style={{
                            flex: `1 1 ${TILE_MIN_WIDTH}px`,
                            minWidth: 0,
                            minHeight: TILE_HEIGHT,
                        }}
                    >
                        <Stack align="center" justify="center" h="100%" gap="md">
                            <Box
                                w={100}
                                h={100}
                                style={{
                                    border: "1px dashed var(--mantine-color-dark-3)",
                                    borderRadius: "8px",
                                }}
                            />
                            <Text fw={600} ta="center">
                                {p.name}
                            </Text>
                        </Stack>
                    </Paper>
                ))}
            </Flex>

            {/* IntersectionObserver for Sentinal triggers fetching for more data when it comes into view. */}
            <Box ref={sentinelRef} h={1} />

            {/* Display 'Loading' message when more data is fetched. */}
            {loadingMore && (
                <Center>
                    <Text c="dimmed" size="sm">
                        loading
                    </Text>
                </Center>
            )}

            {/* Temporarily display 'All Loaded' message when there's nothing left to fetch. */}
            {people.length > 0 && (
                <Text
                    c="dimmed"
                    ta="center"
                    size="sm"
                    style={{
                        minHeight: 20,
                        visibility: shouldShowAllLoadedMessage ? "visible" : "hidden",
                    }}
                >
                    All people loaded.
                </Text>
            )}
        </Stack>
    );
}
