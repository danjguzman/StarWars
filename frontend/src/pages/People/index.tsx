import { useEffect } from "react";
import { Alert, Box, Stack, Text } from "@mantine/core";
import { Users } from "phosphor-react";
import ListTemplate from "@components/PageTemplate/ListTemplate";
import PageTemplate from "@components/PageTemplate";
import { usePeopleStore } from "@stores/peopleStore";
import { estimateInitialTargetCount } from "@utils/layout";

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

    /* Invoke Store to fetch initial data on first render with estimated tile count. */
    useEffect(() => {
        
        /* Invoke store directly. */
        fetchPeople({ targetCount: estimateInitialTargetCount() });

    }, [fetchPeople]);

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
            <Stack gap="md">
                <ListTemplate
                    items={people}
                    entityKey="people"
                    onLoadMore={() => fetchPeople({ nextPage: true })}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                />
            </Stack>
        </PageTemplate>
    );
}
