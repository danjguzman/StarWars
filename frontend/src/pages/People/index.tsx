import { useEffect, useState } from "react";
import { Alert, Box, Stack, Text } from "@mantine/core";
import { Users } from "phosphor-react";
import Modal from "@components/Modal";
import ListTemplate from "@components/PageTemplate/ListTemplate";
import PageTemplate from "@components/PageTemplate";
import PersonModalContent from "@pages/People/PersonModalContent";
import { usePeopleStore } from "@stores/peopleStore";
import { estimateInitialTargetCount } from "@utils/layout";

/* People list page component. */
export default function People() {
    const [selectedPersonIndex, setSelectedPersonIndex] = useState<number | null>(null);
    const {
        people,
        loading,
        loadingMore,
        error,
        hasMore,
        fetchPeople,
    } = usePeopleStore();
    const selectedPerson = selectedPersonIndex !== null && selectedPersonIndex < people.length
        ? people[selectedPersonIndex]
        : null;

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
                    onItemClick={({ item }) => {
                        const itemIndex = people.findIndex((person) => person.url === item.url);
                        if (itemIndex < 0) return;
                        setSelectedPersonIndex(itemIndex);
                    }}
                />
            </Stack>

            <Modal
                opened={selectedPerson !== null}
                ariaLabel={selectedPerson ? `${selectedPerson.name} details` : "Person details"}
                onClose={() => {
                    setSelectedPersonIndex(null);
                }}
            >
                {selectedPerson && (
                    <PersonModalContent
                        person={selectedPerson}
                        selectedIndex={selectedPersonIndex ?? 0}
                        total={people.length}
                        onClose={() => {
                            setSelectedPersonIndex(null);
                        }}
                        onPrev={() => {
                            setSelectedPersonIndex((current) => {
                                if (current === null || people.length === 0) return current;
                                return (current - 1 + people.length) % people.length;
                            });
                        }}
                        onNext={() => {
                            setSelectedPersonIndex((current) => {
                                if (current === null || people.length === 0) return current;
                                return (current + 1) % people.length;
                            });
                        }}
                    />
                )}
            </Modal>
        </PageTemplate>
    );
}
