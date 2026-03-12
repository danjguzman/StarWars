import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { Planet as PlanetIcon } from "phosphor-react";
import PlanetModalContent from "@pages/Planets/PlanetModalContent";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import { type Planet } from "@types";
import { usePlanetsStore } from "@stores/planetsStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Planets page wrapper that passes planet-specific data into the shared browse page layout. */
export default function Planets() {
    const navigate = useNavigate();
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

    /* Open a planet modal by moving the route to that planet's detail path. */
    const openPlanetModal = useCallback((planet: Planet) => {
        const routePath = resourceRoutePathFromUrl(planet.url);
        if (!routePath) return;
        navigate(routePath);
    }, [navigate]);

    /* Close the modal by going back to the main planets page route. */
    const closePlanetModal = useCallback(() => {
        navigate("/planets");
    }, [navigate]);

    return (
        <ResourceBrowseRoute
            title="Planets"
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <PlanetIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            entityKey="planets"
            routeItemId={planetId}
            resources={planets}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            lastFailedRequestMode={lastFailedRequestMode}
            initialItemCount={initialTargetCount}
            fetchResources={fetchPlanets}
            getItemId={(planet) => resourceIdFromUrl(planet.url)}
            onOpenItem={openPlanetModal}
            onCloseModal={closePlanetModal}
            getModalAriaLabel={(planet) => `${planet.name} details`}
            errorUi={{
                initialTitle: "Couldn't load the Planets archive",
                nextPageTitle: "Couldn't load more planets",
                initialRetryLabel: "Retry loading planets",
                nextPageRetryLabel: "Try loading more again",
            }}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <PlanetModalContent
                    planet={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
        />
    );
}
