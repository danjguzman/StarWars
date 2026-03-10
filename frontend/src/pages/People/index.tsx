import { useCallback, useEffect, useMemo } from "react";
import { Alert, Box, Stack, Text } from "@mantine/core";
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
        hasMore,
        fetchPeople,
    } = usePeopleStore();

    const modalPeople = useMemo(() => {
        const allPeople = getCachedValue<Person[]>("people:all");
        if (allPeople && allPeople.length > 0) return allPeople;
        return people;
    }, [people]);

    const selectedPersonIndex = useMemo(() => {
        if (!personId) return null;

        return modalPeople.findIndex((person) => resourceIdFromUrl(person.url) === personId);
    }, [modalPeople, personId]);

    const selectedPerson = selectedPersonIndex !== null && selectedPersonIndex >= 0 && selectedPersonIndex < modalPeople.length
        ? modalPeople[selectedPersonIndex]
        : null;

    const closePersonModal = useCallback(() => {
        navigate("/people");
    }, [navigate]);

    const openPersonByIndex = useCallback((index: number) => {
        const targetPerson = modalPeople[index];
        if (!targetPerson) return;

        const targetRoutePath = resourceRoutePathFromUrl(targetPerson.url);
        if (!targetRoutePath) return;

        navigate(targetRoutePath);
    }, [modalPeople, navigate]);

    const showPrevPerson = useCallback(() => {
        if (selectedPersonIndex === null || selectedPersonIndex < 0 || modalPeople.length === 0) return;
        openPersonByIndex((selectedPersonIndex - 1 + modalPeople.length) % modalPeople.length);
    }, [modalPeople.length, openPersonByIndex, selectedPersonIndex]);

    const showNextPerson = useCallback(() => {
        if (selectedPersonIndex === null || selectedPersonIndex < 0 || modalPeople.length === 0) return;
        openPersonByIndex((selectedPersonIndex + 1) % modalPeople.length);
    }, [modalPeople.length, openPersonByIndex, selectedPersonIndex]);

    /* Invoke Store to fetch initial data on first render with estimated tile count. */
    useEffect(() => {
        /* Invoke store directly. */
        fetchPeople({ targetCount: estimateInitialTargetCount() });
    }, [fetchPeople]);

    useEffect(() => {
        if (!personId || loading || loadingMore || !hasMore) return;
        if (selectedPersonIndex !== -1) return;

        fetchPeople({ nextPage: true });
    }, [fetchPeople, hasMore, loading, loadingMore, personId, selectedPersonIndex]);

    /* Render blocking states before the list. */
    if (loading) return <Text>Loading...</Text>;
    if (error) return <Alert color="red">{error}</Alert>;

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
                <ListTemplate
                    items={people}
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
