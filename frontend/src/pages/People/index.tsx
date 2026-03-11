import { useCallback, useEffect, useMemo } from "react";
import { Alert, Box, Button, Stack, Text } from "@mantine/core";
import { Users } from "phosphor-react";
import Modal from "@components/Modal";
import ListTemplate from "@components/PageTemplate/ListTemplate";
import PageTemplate from "@components/PageTemplate";
import PersonModalContent from "@pages/People/PersonModalContent";
import { type Person } from "@types";
import { usePeopleStore } from "@stores/peopleStore";
import { getCachedValue } from "@utils/clientCache";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

/* People list page component. */
export default function People() {
    const navigate = useNavigate();
    const { personId } = useParams<{ personId?: string }>();
    const {
        people,
        loading,
        loadingMore,
        error,
        lastFailedRequestMode,
        hasMore,
        fetchPeople,
    } = usePeopleStore();
    const initialTargetCount = useMemo(() => estimateInitialTargetCount(), []);

    /* Use the full cached people list for modal navigation when it is available. */
    const modalPeople = useMemo(() => {
        const allPeople = getCachedValue<Person[]>("people:all");
        if (allPeople && allPeople.length > 0) return allPeople;
        return people;
    }, [people]);

    /* Show the loaded list first, or a small cached slice while the page is still loading. */
    const visiblePeople = useMemo(() => {
        if (people.length > 0) return people;
        if (modalPeople.length === 0) return [];
        return modalPeople.slice(0, initialTargetCount);
    }, [initialTargetCount, modalPeople, people]);

    /* Find which person in the modal list matches the id in the current route. */
    const selectedPersonIndex = useMemo(() => {
        if (!personId) return null;
        return modalPeople.findIndex((person) => resourceIdFromUrl(person.url) === personId);
    }, [modalPeople, personId]);

    /* Read the selected person only when the route points to a real item in the list. */
    const selectedPerson = selectedPersonIndex !== null && selectedPersonIndex >= 0 && selectedPersonIndex < modalPeople.length
        ? modalPeople[selectedPersonIndex]
        : null;

    /* Close the modal by going back to the main people page route. */
    const closePersonModal = useCallback(() => {
        navigate("/people");
    }, [navigate]);

    /* Open a person modal by moving the route to that person's detail path. */
    const openPersonByIndex = useCallback((index: number) => {
        const targetPerson = modalPeople[index];
        if (!targetPerson) return;
        const targetRoutePath = resourceRoutePathFromUrl(targetPerson.url);
        if (!targetRoutePath) return;
        navigate(targetRoutePath);
    }, [modalPeople, navigate]);

    /* Go to the previous person and wrap to the end when needed. */
    const showPrevPerson = useCallback(() => {
        if (selectedPersonIndex === null || selectedPersonIndex < 0 || modalPeople.length === 0) return;
        openPersonByIndex((selectedPersonIndex - 1 + modalPeople.length) % modalPeople.length);
    }, [modalPeople.length, openPersonByIndex, selectedPersonIndex]);

    /* Go to the next person and wrap to the start when needed. */
    const showNextPerson = useCallback(() => {
        if (selectedPersonIndex === null || selectedPersonIndex < 0 || modalPeople.length === 0) return;
        openPersonByIndex((selectedPersonIndex + 1) % modalPeople.length);
    }, [modalPeople.length, openPersonByIndex, selectedPersonIndex]);

    /* Retry the failed request, either for more results or for the first load. */
    const retryPeopleLoad = useCallback(() => {
        if (lastFailedRequestMode === "nextPage" && visiblePeople.length > 0) {
            void fetchPeople({ nextPage: true });
            return;
        }
        void fetchPeople({ targetCount: initialTargetCount });
    }, [fetchPeople, initialTargetCount, lastFailedRequestMode, visiblePeople.length]);

    /* Invoke Store to fetch initial data on first render with estimated tile count. */
    useEffect(() => {
        fetchPeople({ targetCount: initialTargetCount });
    }, [fetchPeople, initialTargetCount]);

    /* Keep loading more pages when the URL points to a person that is not loaded yet. */
    useEffect(() => {
        if (!personId || loading || loadingMore || !hasMore) return;
        if (selectedPersonIndex !== -1) return;
        fetchPeople({ nextPage: true });
    }, [fetchPeople, hasMore, loading, loadingMore, personId, selectedPersonIndex]);

    return (
        <PageTemplate
            title="People"
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <Users size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
        >
            <Stack gap="md">

                {/* Show a clear error message and retry action when loading fails. */}
                {error ? (
                    <Alert
                        color="red"
                        title={lastFailedRequestMode === "nextPage" ? "Couldn't load more people" : "Couldn't load the People archive"}
                        variant="light"
                    >
                        <Stack gap="xs" align="flex-start">
                            <Text size="sm">{error}</Text>
                            <Button variant="light" color="red" onClick={retryPeopleLoad}>
                                {lastFailedRequestMode === "nextPage" ? "Try loading more again" : "Retry loading people"}
                            </Button>
                        </Stack>
                    </Alert>
                ) : null}

                {/* Show the people grid and load more items when the list reaches the end. */}
                <ListTemplate
                    items={visiblePeople}
                    entityKey="people"
                    onLoadMore={() => fetchPeople({ nextPage: true })}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onItemClick={({ item }) => {
                        const routePath = resourceRoutePathFromUrl(item.url);
                        if (!routePath) return;
                        navigate(routePath);
                    }}
                />
            </Stack>

            {/* Show the shared person details modal when a person is selected. */}
            <Modal
                opened={selectedPerson !== null}
                ariaLabel={selectedPerson ? `${selectedPerson.name} details` : "Person details"}
                onClose={closePersonModal}
                onNavigatePrev={showPrevPerson}
                onNavigateNext={showNextPerson}
            >
                {selectedPerson && (
                    <PersonModalContent
                        person={selectedPerson}
                        selectedIndex={selectedPersonIndex ?? 0}
                        total={modalPeople.length}
                        onPrev={showPrevPerson}
                        onNext={showNextPerson}
                    />
                )}
            </Modal>
        </PageTemplate>
    );
}
