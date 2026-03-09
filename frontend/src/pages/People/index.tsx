import { useCallback, useEffect, useMemo } from "react";
import { Alert, Box, Stack, Text } from "@mantine/core";
import { Users } from "phosphor-react";
import Modal from "@components/Modal";
import ListTemplate from "@components/PageTemplate/ListTemplate";
import PageTemplate from "@components/PageTemplate";
import PersonModalContent from "@pages/People/PersonModalContent";
import { usePeopleStore } from "@stores/peopleStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl } from "@utils/swapi";
import { useNavigate, useParams } from "react-router-dom";

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
    const selectedPersonIndex = useMemo(() => {
        if (!personId) return null;

        return people.findIndex((person) => resourceIdFromUrl(person.url) === personId);
    }, [people, personId]);

    const selectedPerson = selectedPersonIndex !== null && selectedPersonIndex >= 0 && selectedPersonIndex < people.length
        ? people[selectedPersonIndex]
        : null;

    const closePersonModal = useCallback(() => {
        navigate("/people");
    }, [navigate]);

    const openPersonByIndex = useCallback((index: number) => {
        const targetPerson = people[index];
        if (!targetPerson) return;

        const targetPersonId = resourceIdFromUrl(targetPerson.url);
        if (!targetPersonId) return;

        navigate(`/person/${targetPersonId}`);
    }, [navigate, people]);

    const showPrevPerson = useCallback(() => {
        if (selectedPersonIndex === null || selectedPersonIndex < 0 || people.length === 0) return;
        openPersonByIndex((selectedPersonIndex - 1 + people.length) % people.length);
    }, [openPersonByIndex, people.length, selectedPersonIndex]);

    const showNextPerson = useCallback(() => {
        if (selectedPersonIndex === null || selectedPersonIndex < 0 || people.length === 0) return;
        openPersonByIndex((selectedPersonIndex + 1) % people.length);
    }, [openPersonByIndex, people.length, selectedPersonIndex]);

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
                    onItemClick={({ item }) => {
                        const itemId = resourceIdFromUrl(item.url);
                        if (!itemId) return;
                        navigate(`/person/${itemId}`);
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
                        total={people.length}
                        onClose={closePersonModal}
                        onPrev={showPrevPerson}
                        onNext={showNextPerson}
                    />
                )}
            </Modal>
        </PageTemplate>
    );
}
