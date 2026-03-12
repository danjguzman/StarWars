import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { Users } from "phosphor-react";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import { type Person } from "@types";
import { usePeopleStore } from "@stores/peopleStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useParams } from "react-router-dom";
import styles from "./index.module.css";

/* People page wrapper that passes the people-specific data into the shared browse page layout. */
export default function People() {
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
    const { openModalRoute } = useModalRouteNavigation("/people");

    /* Open a person modal by moving the route to that person's detail path. */
    const openPersonModal = useCallback((person: Person) => {
        const routePath = resourceRoutePathFromUrl(person.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    const sharedProps = {
        title: "People",
        entityKey: "people",
        routeItemId: personId,
        resources: people,
        loading,
        loadingMore,
        hasMore,
        error,
        lastFailedRequestMode,
        initialItemCount: initialTargetCount,
        fetchResources: fetchPeople,
        getItemId: (person: Person) => resourceIdFromUrl(person.url),
        onOpenItem: openPersonModal,
    };

    return (
        <ResourceBrowseRoute
            {...sharedProps}
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <Users size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            errorUi={{
                initialTitle: "Couldn't load the People archive",
                nextPageTitle: "Couldn't load more people",
                initialRetryLabel: "Retry loading people",
                nextPageRetryLabel: "Try loading more again",
            }}
        />
    );
}
