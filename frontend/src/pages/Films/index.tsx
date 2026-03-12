import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { FilmReelIcon } from "@phosphor-icons/react";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import { type Film } from "@types";
import { useFilmsStore } from "@stores/filmsStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Films page wrapper that passes film-specific data into the shared browse page layout. */
export default function Films() {
    const { filmId } = useParams<{ filmId?: string }>();
    const {
        films,
        loading,
        loadingMore,
        error,
        lastFailedRequestMode,
        hasMore,
        fetchFilms,
    } = useFilmsStore();
    const initialTargetCount = useMemo(() => estimateInitialTargetCount(), []);
    const { openModalRoute } = useModalRouteNavigation("/films");

    /* Open a film modal by moving the route to that film's detail path. */
    const openFilmModal = useCallback((film: Film) => {
        const routePath = resourceRoutePathFromUrl(film.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    const sharedProps = {
        title: "Films",
        entityKey: "films",
        routeItemId: filmId,
        resources: films,
        loading,
        loadingMore,
        hasMore,
        error,
        lastFailedRequestMode,
        initialItemCount: initialTargetCount,
        labelKey: "title" as const,
        fetchResources: fetchFilms,
        getItemId: (film: Film) => resourceIdFromUrl(film.url),
        onOpenItem: openFilmModal,
    };

    return (
        <ResourceBrowseRoute
            {...sharedProps}
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <FilmReelIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            errorUi={{
                initialTitle: "Couldn't load the Films archive",
                nextPageTitle: "Couldn't load more films",
                initialRetryLabel: "Retry loading films",
                nextPageRetryLabel: "Try loading more again",
            }}
        />
    );
}
