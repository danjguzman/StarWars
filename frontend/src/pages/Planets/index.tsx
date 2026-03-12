import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { Planet as PlanetIcon } from "phosphor-react";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import { type Planet } from "@types";
import { usePlanetsStore } from "@stores/planetsStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Planets page wrapper that passes planet-specific data into the shared browse page layout. */
export default function Planets() {
    const { planetId } = useParams<{ planetId?: string }>();
    const {
        planets,
        loading,
        loadingMore,
        error,
        lastFailedRequestMode,
        hasMore,
        fetchPlanets,
    } = usePlanetsStore();
    const initialTargetCount = useMemo(() => estimateInitialTargetCount(), []);
    const { openModalRoute } = useModalRouteNavigation("/planets");

    /* Open a planet modal by moving the route to that planet's detail path. */
    const openPlanetModal = useCallback((planet: Planet) => {
        const routePath = resourceRoutePathFromUrl(planet.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    const sharedProps = {
        title: "Planets",
        entityKey: "planets",
        routeItemId: planetId,
        resources: planets,
        loading,
        loadingMore,
        hasMore,
        error,
        lastFailedRequestMode,
        initialItemCount: initialTargetCount,
        fetchResources: fetchPlanets,
        getItemId: (planet: Planet) => resourceIdFromUrl(planet.url),
        onOpenItem: openPlanetModal,
    };

    return (
        <ResourceBrowseRoute
            {...sharedProps}
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <PlanetIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            errorUi={{
                initialTitle: "Couldn't load the Planets archive",
                nextPageTitle: "Couldn't load more planets",
                initialRetryLabel: "Retry loading planets",
                nextPageRetryLabel: "Try loading more again",
            }}
        />
    );
}
