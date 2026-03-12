import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { Alien as AlienIcon } from "phosphor-react";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import { type Species } from "@types";
import { useSpeciesStore } from "@stores/speciesStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Species page wrapper that passes species-specific data into the shared browse page layout. */
export default function SpeciesPage() {
    const { speciesId } = useParams<{ speciesId?: string }>();
    const {
        species,
        loading,
        loadingMore,
        error,
        lastFailedRequestMode,
        hasMore,
        fetchSpecies,
    } = useSpeciesStore();
    const initialTargetCount = useMemo(() => estimateInitialTargetCount(), []);
    const { openModalRoute } = useModalRouteNavigation("/species");

    /* Open a species modal by moving the route to that species detail path. */
    const openSpeciesModal = useCallback((item: Species) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    const sharedProps = {
        title: "Species",
        entityKey: "species",
        routeItemId: speciesId,
        resources: species,
        loading,
        loadingMore,
        hasMore,
        error,
        lastFailedRequestMode,
        initialItemCount: initialTargetCount,
        fetchResources: fetchSpecies,
        getItemId: (item: Species) => resourceIdFromUrl(item.url),
        onOpenItem: openSpeciesModal,
    };

    return (
        <ResourceBrowseRoute
            {...sharedProps}
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <AlienIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            errorUi={{
                initialTitle: "Couldn't load the Species archive",
                nextPageTitle: "Couldn't load more species",
                initialRetryLabel: "Retry loading species",
                nextPageRetryLabel: "Try loading more again",
            }}
        />
    );
}
