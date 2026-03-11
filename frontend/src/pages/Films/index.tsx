import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { FilmReelIcon } from "@phosphor-icons/react";
import ResourceBrowsePage from "@components/PageTemplate/ResourceBrowsePage";
import FilmModalContent from "@pages/Films/FilmModalContent";
import { type Film } from "@types";
import { useFilmsStore } from "@stores/filmsStore";
import { FILMS_ALL_CACHE_KEY } from "@utils/consts";
import { getCachedValue } from "@utils/clientCache";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Films page wrapper that passes film-specific data into the shared browse page layout. */
export default function Films() {
    const navigate = useNavigate();
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
    const cachedFilms = getCachedValue<Film[]>(FILMS_ALL_CACHE_KEY);

    /* Open a film modal by moving the route to that film's detail path. */
    const openFilmModal = useCallback((film: Film) => {
        const routePath = resourceRoutePathFromUrl(film.url);
        if (!routePath) return;
        navigate(routePath);
    }, [navigate]);

    /* Close the modal by going back to the main films page route. */
    const closeFilmModal = useCallback(() => {
        navigate("/films");
    }, [navigate]);

    return (
        <ResourceBrowsePage
            title="Films"
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <FilmReelIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            entityKey="films"
            routeItemId={filmId}
            resources={films}
            cachedResources={cachedFilms}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            lastFailedRequestMode={lastFailedRequestMode}
            initialItemCount={initialTargetCount}
            labelKey="title"
            fetchResources={fetchFilms}
            getItemId={(film) => resourceIdFromUrl(film.url)}
            onOpenItem={openFilmModal}
            onCloseModal={closeFilmModal}
            getModalAriaLabel={(film) => `${film.title} details`}
            errorUi={{
                initialTitle: "Couldn't load the Films archive",
                nextPageTitle: "Couldn't load more films",
                initialRetryLabel: "Retry loading films",
                nextPageRetryLabel: "Try loading more again",
            }}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <FilmModalContent
                    film={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
        />
    );
}
