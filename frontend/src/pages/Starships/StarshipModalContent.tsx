import { useCallback, useMemo } from "react";
import { FilmReelIcon } from "@phosphor-icons/react";
import { FlyingSaucer as FlyingSaucerIcon, Users as UsersIcon } from "phosphor-react";
import ContentTemplate from "@components/Modal/ContentTemplate";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import { type ContentTemplateRelatedGroup, type ContentTemplateTrait, type Starship } from "@types";
import { getEntityImageSources } from "@utils/assets";
import { formatDisplayValue } from "@utils/display";
import { collectRelatedResourceUrls, resolveResourceItems } from "@utils/resourceResolve";
import { useResolvedResourceNames } from "@utils/useResolvedResourceNames";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";

interface StarshipModalContentProps {
    starship: Starship;
    selectedIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

export default function StarshipModalContent({
    starship,
    selectedIndex,
    total,
    onPrev,
    onNext,
}: StarshipModalContentProps) {
    const { openModalRoute } = useModalRouteNavigation("/starships");
    const starshipId = resourceIdFromUrl(starship.url);
    const artworkSources = useMemo(() => getEntityImageSources("starships", starshipId), [starshipId]);

    const openRelatedItem = useCallback((item: { url: string }) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    const relatedResourceUrls = useMemo(() => {
        return collectRelatedResourceUrls([
            starship.pilots,
            starship.films,
        ]);
    }, [starship.films, starship.pilots]);

    const resolvedResourceNames = useResolvedResourceNames(relatedResourceUrls);

    const traits: ContentTemplateTrait[] = [
        { label: "Model", value: formatDisplayValue(starship.model) },
        { label: "Class", value: formatDisplayValue(starship.starship_class) },
        { label: "Manufacturer", value: formatDisplayValue(starship.manufacturer) },
        { label: "Crew", value: formatDisplayValue(starship.crew) },
        { label: "Passengers", value: formatDisplayValue(starship.passengers) },
        { label: "Hyperdrive", value: formatDisplayValue(starship.hyperdrive_rating) },
        { label: "MGLT", value: formatDisplayValue(starship.MGLT) },
        { label: "Record", value: `${selectedIndex + 1} / ${total}` },
    ];

    const relatedGroups: ContentTemplateRelatedGroup[] = [
        {
            label: "Pilots",
            count: starship.pilots.length,
            items: resolveResourceItems(starship.pilots, resolvedResourceNames),
            icon: <UsersIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Films",
            count: starship.films.length,
            items: resolveResourceItems(starship.films, resolvedResourceNames),
            icon: <FilmReelIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
    ];

    return (
        <ContentTemplate
            title={starship.name}
            imageSources={artworkSources}
            imageAlt={`${starship.name} artwork`}
            imageFallback={<FlyingSaucerIcon size={148} weight="duotone" color="var(--mantine-color-gray-4)" />}
            traits={traits}
            relatedGroups={relatedGroups}
            onPrev={onPrev}
            onNext={onNext}
        />
    );
}
