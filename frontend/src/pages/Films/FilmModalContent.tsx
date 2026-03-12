import { useCallback, useMemo } from "react";
import {
    Alien as AlienIcon,
    FlyingSaucer as FlyingSaucerIcon,
    Planet as PlanetIcon,
    TrainRegional as TrainRegionalIcon,
    Users as UsersIcon,
} from "phosphor-react";
import { FilmReelIcon } from "@phosphor-icons/react";
import ContentTemplate from "@components/Modal/ContentTemplate";
import { type ContentTemplateRelatedGroup, type ContentTemplateTrait, type Film } from "@types";
import { formatDisplayValue } from "@utils/display";
import { collectRelatedResourceUrls, resolveResourceItems } from "@utils/resourceResolve";
import { useResolvedResourceNames } from "@utils/useResolvedResourceNames";
import { resourceRoutePathFromUrl } from "@utils/swapi";
import { useNavigate } from "react-router-dom";

interface FilmModalContentProps {
    film: Film;
    selectedIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

export default function FilmModalContent({
    film,
    selectedIndex,
    total,
    onPrev,
    onNext,
}: FilmModalContentProps) {
    const navigate = useNavigate();

    const openRelatedItem = useCallback((item: { url: string }) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        navigate(routePath);
    }, [navigate]);

    const relatedResourceUrls = useMemo(() => {
        return collectRelatedResourceUrls([
            film.characters,
            film.planets,
            film.starships,
            film.vehicles,
            film.species,
        ]);
    }, [film.characters, film.planets, film.species, film.starships, film.vehicles]);

    const resolvedResourceNames = useResolvedResourceNames(relatedResourceUrls);

    const traits: ContentTemplateTrait[] = [
        { label: "Episode", value: `Episode ${film.episode_id}` },
        { label: "Release Date", value: formatDisplayValue(film.release_date) },
        { label: "Director", value: formatDisplayValue(film.director) },
        { label: "Producer", value: formatDisplayValue(film.producer) },
        { label: "Characters", value: film.characters.length.toString() },
        { label: "Planets", value: film.planets.length.toString() },
        { label: "Species", value: film.species.length.toString() },
        { label: "Record", value: `${selectedIndex + 1} / ${total}` },
    ];

    const relatedGroups: ContentTemplateRelatedGroup[] = [
        {
            label: "Characters",
            count: film.characters.length,
            items: resolveResourceItems(film.characters, resolvedResourceNames),
            icon: <UsersIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Planets",
            count: film.planets.length,
            items: resolveResourceItems(film.planets, resolvedResourceNames),
            icon: <PlanetIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Starships",
            count: film.starships.length,
            items: resolveResourceItems(film.starships, resolvedResourceNames),
            icon: <FlyingSaucerIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Vehicles",
            count: film.vehicles.length,
            items: resolveResourceItems(film.vehicles, resolvedResourceNames),
            icon: <TrainRegionalIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Species",
            count: film.species.length,
            items: resolveResourceItems(film.species, resolvedResourceNames),
            icon: <AlienIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
    ];

    return (
        <ContentTemplate
            title={film.title}
            imageSrc={null}
            imageAlt={`${film.title} artwork`}
            imageFallback={<FilmReelIcon size={148} weight="duotone" color="var(--mantine-color-gray-4)" />}
            traits={traits}
            relatedGroups={relatedGroups}
            onPrev={onPrev}
            onNext={onNext}
        />
    );
}
