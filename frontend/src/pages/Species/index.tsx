import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { Alien as AlienIcon } from "phosphor-react";
import ResourceBrowsePage from "@components/PageTemplate/ResourceBrowsePage";
import SpeciesModalContent from "@pages/Species/SpeciesModalContent";
import { type Species } from "@types";
import { useSpeciesStore } from "@stores/speciesStore";
import { SPECIES_ALL_CACHE_KEY } from "@utils/consts";
import { getCachedValue } from "@utils/clientCache";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Species page wrapper that passes species-specific data into the shared browse page layout. */
export default function SpeciesPage() {
    const navigate = useNavigate();
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
    const cachedSpecies = getCachedValue<Species[]>(SPECIES_ALL_CACHE_KEY);

    /* Open a species modal by moving the route to that species detail path. */
    const openSpeciesModal = useCallback((item: Species) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        navigate(routePath);
    }, [navigate]);

    /* Close the modal by going back to the main species page route. */
    const closeSpeciesModal = useCallback(() => {
        navigate("/species");
    }, [navigate]);

    return (
        <ResourceBrowsePage
            title="Species"
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <AlienIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            entityKey="species"
            routeItemId={speciesId}
            resources={species}
            cachedResources={cachedSpecies}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            lastFailedRequestMode={lastFailedRequestMode}
            initialItemCount={initialTargetCount}
            fetchResources={fetchSpecies}
            getItemId={(item) => resourceIdFromUrl(item.url)}
            onOpenItem={openSpeciesModal}
            onCloseModal={closeSpeciesModal}
            getModalAriaLabel={(item) => `${item.name} details`}
            errorUi={{
                initialTitle: "Couldn't load the Species archive",
                nextPageTitle: "Couldn't load more species",
                initialRetryLabel: "Retry loading species",
                nextPageRetryLabel: "Try loading more again",
            }}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <SpeciesModalContent
                    species={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
        />
    );
}
