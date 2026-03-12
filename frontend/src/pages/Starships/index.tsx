import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { FlyingSaucer as FlyingSaucerIcon } from "phosphor-react";
import StarshipModalContent from "@pages/Starships/StarshipModalContent";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import { type Starship } from "@types";
import { useStarshipsStore } from "@stores/starshipsStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Starships page wrapper that passes starship-specific data into the shared browse page layout. */
export default function StarshipsPage() {
    const navigate = useNavigate();
    const { starshipId } = useParams<{ starshipId?: string }>();
    const {
        starships,
        loading,
        loadingMore,
        error,
        lastFailedRequestMode,
        hasMore,
        fetchStarships,
    } = useStarshipsStore();
    const initialTargetCount = useMemo(() => estimateInitialTargetCount(), []);

    /* Open a starship modal by moving the route to that starship detail path. */
    const openStarshipModal = useCallback((item: Starship) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        navigate(routePath);
    }, [navigate]);

    /* Close the modal by going back to the main starships page route. */
    const closeStarshipModal = useCallback(() => {
        navigate("/starships");
    }, [navigate]);

    return (
        <ResourceBrowseRoute
            title="Starships"
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <FlyingSaucerIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            entityKey="starships"
            routeItemId={starshipId}
            resources={starships}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            lastFailedRequestMode={lastFailedRequestMode}
            initialItemCount={initialTargetCount}
            fetchResources={fetchStarships}
            getItemId={(item) => resourceIdFromUrl(item.url)}
            onOpenItem={openStarshipModal}
            onCloseModal={closeStarshipModal}
            getModalAriaLabel={(item) => `${item.name} details`}
            errorUi={{
                initialTitle: "Couldn't load the Starships archive",
                nextPageTitle: "Couldn't load more starships",
                initialRetryLabel: "Retry loading starships",
                nextPageRetryLabel: "Try loading more again",
            }}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <StarshipModalContent
                    starship={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
        />
    );
}
