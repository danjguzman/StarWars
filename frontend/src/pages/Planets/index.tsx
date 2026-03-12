import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { Planet as PlanetIcon } from "phosphor-react";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import ResourceModalRoute from "@pages/_shared/ResourceModalRoute";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import PlanetModalContent from "@pages/Planets/PlanetModalContent";
import { type Planet } from "@types";
import { usePlanetsStore } from "@stores/planetsStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Planets page wrapper that passes planet-specific data into the shared browse page layout. */
export default function Planets({ modalOnly = false }: { modalOnly?: boolean }) {
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
    const { openModalRoute, closeModalRoute } = useModalRouteNavigation("/planets");

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
        onCloseModal: closeModalRoute,
        getModalAriaLabel: (planet: Planet) => `${planet.name} details`,
        renderModalContent: ({ item, selectedIndex, total, onPrev, onNext }: {
            item: Planet;
            selectedIndex: number;
            total: number;
            onPrev: () => void;
            onNext: () => void;
        }) => (
            <PlanetModalContent
                planet={item}
                selectedIndex={selectedIndex}
                total={total}
                onPrev={onPrev}
                onNext={onNext}
            />
        ),
    };

    if (modalOnly) {
        return <ResourceModalRoute {...sharedProps} />;
    }

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
