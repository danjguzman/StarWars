import { useCallback, useMemo } from "react";
import { FilmReelIcon } from "@phosphor-icons/react";
import { Planet as PlanetIcon, Users as UsersIcon } from "phosphor-react";
import ContentTemplate from "@components/Modal/ContentTemplate";
import { type ContentTemplateRelatedGroup, type ContentTemplateTrait, type Planet } from "@types";
import { getEntityImageSources } from "@utils/assets";
import { formatDisplayValue } from "@utils/display";
import { collectRelatedResourceUrls, resolveResourceItems } from "@utils/resourceResolve";
import { useResolvedResourceNames } from "@utils/useResolvedResourceNames";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useNavigate } from "react-router-dom";

interface PlanetModalContentProps {
    planet: Planet;
    selectedIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

export default function PlanetModalContent({
    planet,
    selectedIndex,
    total,
    onPrev,
    onNext,
}: PlanetModalContentProps) {
    const navigate = useNavigate();
    const planetId = resourceIdFromUrl(planet.url);
    const artworkSources = useMemo(() => getEntityImageSources("planets", planetId), [planetId]);

    const openRelatedItem = useCallback((item: { url: string }) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        navigate(routePath);
    }, [navigate]);

    const relatedResourceUrls = useMemo(() => {
        return collectRelatedResourceUrls([
            planet.residents,
            planet.films,
        ]);
    }, [planet.films, planet.residents]);

    const resolvedResourceNames = useResolvedResourceNames(relatedResourceUrls);

    const traits: ContentTemplateTrait[] = [
        { label: "Climate", value: formatDisplayValue(planet.climate) },
        { label: "Terrain", value: formatDisplayValue(planet.terrain) },
        { label: "Diameter", value: formatDisplayValue(planet.diameter) },
        { label: "Gravity", value: formatDisplayValue(planet.gravity) },
        { label: "Rotation", value: formatDisplayValue(planet.rotation_period) },
        { label: "Orbit", value: formatDisplayValue(planet.orbital_period) },
        { label: "Surface Water", value: formatDisplayValue(planet.surface_water) },
        { label: "Record", value: `${selectedIndex + 1} / ${total}` },
    ];

    const relatedGroups: ContentTemplateRelatedGroup[] = [
        {
            label: "Residents",
            count: planet.residents.length,
            items: resolveResourceItems(planet.residents, resolvedResourceNames),
            icon: <UsersIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Films",
            count: planet.films.length,
            items: resolveResourceItems(planet.films, resolvedResourceNames),
            icon: <FilmReelIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
    ];

    return (
        <ContentTemplate
            title={planet.name}
            imageSources={artworkSources}
            imageAlt={`${planet.name} artwork`}
            imageFallback={<PlanetIcon size={148} weight="duotone" color="var(--mantine-color-gray-4)" />}
            traits={traits}
            relatedGroups={relatedGroups}
            onPrev={onPrev}
            onNext={onNext}
        />
    );
}
