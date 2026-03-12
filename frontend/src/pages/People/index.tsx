import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { Users } from "phosphor-react";
import PersonModalContent from "@pages/People/PersonModalContent";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import { type Person } from "@types";
import { usePeopleStore } from "@stores/peopleStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

/* People page wrapper that passes the people-specific data into the shared browse page layout. */
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

    /* Open a person modal by moving the route to that person's detail path. */
    const openPersonModal = useCallback((person: Person) => {
        const routePath = resourceRoutePathFromUrl(person.url);
        if (!routePath) return;
        navigate(routePath);
    }, [navigate]);

    /* Close the modal by going back to the main people page route. */
    const closePersonModal = useCallback(() => {
        navigate("/people");
    }, [navigate]);

    return (
        <ResourceBrowseRoute
            title="People"
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <Users size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            entityKey="people"
            routeItemId={personId}
            resources={people}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            lastFailedRequestMode={lastFailedRequestMode}
            initialItemCount={initialTargetCount}
            fetchResources={fetchPeople}
            getItemId={(person) => resourceIdFromUrl(person.url)}
            onOpenItem={openPersonModal}
            onCloseModal={closePersonModal}
            getModalAriaLabel={(person) => `${person.name} details`}
            errorUi={{
                initialTitle: "Couldn't load the People archive",
                nextPageTitle: "Couldn't load more people",
                initialRetryLabel: "Retry loading people",
                nextPageRetryLabel: "Try loading more again",
            }}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <PersonModalContent
                    person={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
        />
    );
}
