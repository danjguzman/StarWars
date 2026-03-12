import { useCallback, useMemo } from "react";
import {
    Alien as AlienIcon,
    FlyingSaucer as FlyingSaucerIcon,
    Planet as PlanetIcon,
    TrainRegional as TrainRegionalIcon,
} from "phosphor-react";
import { FilmReelIcon } from "@phosphor-icons/react";
import ContentTemplate from "@components/Modal/ContentTemplate";
import { type ContentTemplateRelatedGroup, type ContentTemplateTrait, type Person } from "@types";
import { getEntityImageSources } from "@utils/assets";
import { formatDisplayValue } from "@utils/display";
import { collectRelatedResourceUrls, resolveResourceItems } from "@utils/resourceResolve";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useResolvedResourceNames } from "@utils/useResolvedResourceNames";
import { useNavigate } from "react-router-dom";

interface PersonModalContentProps {
    person: Person;
    selectedIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

export default function PersonModalContent({
    person,
    selectedIndex,
    total,
    onPrev,
    onNext,
}: PersonModalContentProps) {
    const navigate = useNavigate();
    const personId = resourceIdFromUrl(person.url);
    const portraitSources = useMemo(() => getEntityImageSources("people", personId), [personId]);

    const openRelatedItem = useCallback((item: { url: string }) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        navigate(routePath);
    }, [navigate]);

    /* Combine all related resource URLs into one list so they can be resolved once. */
    const relatedResourceUrls = useMemo(() => {
        return collectRelatedResourceUrls([
            person.homeworld ? [person.homeworld] : [],
            person.species,
            person.starships,
            person.vehicles,
            person.films,
        ]);
    }, [person.films, person.homeworld, person.species, person.starships, person.vehicles]);

    /* Turn related URLs into readable names for the bottom relationship buttons. */
    const resolvedResourceNames = useResolvedResourceNames(relatedResourceUrls);

    /* Build the trait rows shown in the details table. */
    const traits: ContentTemplateTrait[] = [
        { label: "Height", value: formatDisplayValue(person.height) },
        { label: "Mass", value: formatDisplayValue(person.mass) },
        { label: "Hair", value: formatDisplayValue(person.hair_color) },
        { label: "Eyes", value: formatDisplayValue(person.eye_color) },
        { label: "Skin", value: formatDisplayValue(person.skin_color) },
        { label: "Gender", value: formatDisplayValue(person.gender) },
        { label: "Birth Year", value: formatDisplayValue(person.birth_year) },
        { label: "Record", value: `${selectedIndex + 1} / ${total}` },
    ];

    /* Build the bottom relationship buttons and the items inside each one. */
    const relatedGroups: ContentTemplateRelatedGroup[] = [
        {
            label: "Homeworld",
            count: person.homeworld ? 1 : 0,
            items: resolveResourceItems(person.homeworld ? [person.homeworld] : [], resolvedResourceNames),
            icon: <PlanetIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Species",
            count: person.species.length,
            items: resolveResourceItems(person.species, resolvedResourceNames),
            icon: <AlienIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Starships",
            count: person.starships.length,
            items: resolveResourceItems(person.starships, resolvedResourceNames),
            icon: <FlyingSaucerIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Vehicles",
            count: person.vehicles.length,
            items: resolveResourceItems(person.vehicles, resolvedResourceNames),
            icon: <TrainRegionalIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Films",
            count: person.films.length,
            items: resolveResourceItems(person.films, resolvedResourceNames),
            icon: <FilmReelIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
    ];

    return (
        <ContentTemplate
            title={person.name}
            imageSources={portraitSources}
            imageAlt={`${person.name} portrait`}
            traits={traits}
            relatedGroups={relatedGroups}
            onPrev={onPrev}
            onNext={onNext}
        />
    );
}
