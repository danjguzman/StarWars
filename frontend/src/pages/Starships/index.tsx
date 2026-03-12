import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { FlyingSaucer as FlyingSaucerIcon } from "phosphor-react";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import ResourceModalRoute from "@pages/_shared/ResourceModalRoute";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import StarshipModalContent from "@pages/Starships/StarshipModalContent";
import { type Starship } from "@types";
import { useStarshipsStore } from "@stores/starshipsStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Starships page wrapper that passes starship-specific data into the shared browse page layout. */
export default function StarshipsPage({ modalOnly = false }: { modalOnly?: boolean }) {
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
    const { openModalRoute, closeModalRoute } = useModalRouteNavigation("/starships");

    /* Open a starship modal by moving the route to that starship detail path. */
    const openStarshipModal = useCallback((item: Starship) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    const sharedProps = {
        title: "Starships",
        entityKey: "starships",
        routeItemId: starshipId,
        resources: starships,
        loading,
        loadingMore,
        hasMore,
        error,
        lastFailedRequestMode,
        initialItemCount: initialTargetCount,
        fetchResources: fetchStarships,
        getItemId: (item: Starship) => resourceIdFromUrl(item.url),
        onOpenItem: openStarshipModal,
        onCloseModal: closeModalRoute,
        getModalAriaLabel: (item: Starship) => `${item.name} details`,
        renderModalContent: ({ item, selectedIndex, total, onPrev, onNext }: {
            item: Starship;
            selectedIndex: number;
            total: number;
            onPrev: () => void;
            onNext: () => void;
        }) => (
            <StarshipModalContent
                starship={item}
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
                    <FlyingSaucerIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            errorUi={{
                initialTitle: "Couldn't load the Starships archive",
                nextPageTitle: "Couldn't load more starships",
                initialRetryLabel: "Retry loading starships",
                nextPageRetryLabel: "Try loading more again",
            }}
        />
    );
}
