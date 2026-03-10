import { useMemo } from "react";
import { type IconProps } from "phosphor-react";
import {
    Alien as AlienIcon,
    FlyingSaucer as FlyingSaucerIcon,
    Planet as PlanetIcon,
    TrainRegional as TrainRegionalIcon,
    Users as UsersIcon,
} from "phosphor-react";
import { FilmReelIcon } from "@phosphor-icons/react";
import ContentTemplate, {
    type ContentTemplateRelatedGroup,
    type ContentTemplateTrait,
} from "@components/Modal/ContentTemplate";
import { type Person } from "@types";
import { ASSET_IMAGE_BASE_PATH } from "@utils/consts";
import { formatDisplayValue } from "@utils/display";
import { collectRelatedResourceUrls, resolveResourceItems } from "@utils/resourceResolve";
import { resourceCategoryFromUrl, resourceIdFromUrl } from "@utils/swapi";
import { useResolvedResourceNames } from "@utils/useResolvedResourceNames";

interface PersonModalContentProps {
    person: Person;
    selectedIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

/* Pick the icon that matches the current resource type. */
function categoryIconByKey(categoryKey: string) {
    const iconProps: IconProps = {
        weight: "duotone",
        "aria-hidden": true,
    };
    if (categoryKey === "films") return <FilmReelIcon {...iconProps} />;
    if (categoryKey === "species") return <AlienIcon {...iconProps} />;
    if (categoryKey === "starships") return <FlyingSaucerIcon {...iconProps} />;
    if (categoryKey === "vehicles") return <TrainRegionalIcon {...iconProps} />;
    if (categoryKey === "planets") return <PlanetIcon {...iconProps} />;
    return <UsersIcon {...iconProps} />;
}

export default function PersonModalContent({
    person,
    selectedIndex,
    total,
    onPrev,
    onNext,
}: PersonModalContentProps) {
    const personId = resourceIdFromUrl(person.url);
    const portraitSrc = personId ? `${ASSET_IMAGE_BASE_PATH}/people/${personId}.jpg` : null;
    const categoryLabel = resourceCategoryFromUrl(person.url, true);
    const categoryKey = resourceCategoryFromUrl(person.url);

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
        },
        {
            label: "Species",
            count: person.species.length,
            items: resolveResourceItems(person.species, resolvedResourceNames),
            icon: <AlienIcon weight="duotone" aria-hidden="true" />,
        },
        {
            label: "Starships",
            count: person.starships.length,
            items: resolveResourceItems(person.starships, resolvedResourceNames),
            icon: <FlyingSaucerIcon weight="duotone" aria-hidden="true" />,
        },
        {
            label: "Vehicles",
            count: person.vehicles.length,
            items: resolveResourceItems(person.vehicles, resolvedResourceNames),
            icon: <TrainRegionalIcon weight="duotone" aria-hidden="true" />,
        },
        {
            label: "Films",
            count: person.films.length,
            items: resolveResourceItems(person.films, resolvedResourceNames),
            icon: <FilmReelIcon weight="duotone" aria-hidden="true" />,
        },
    ];

    return (
        <ContentTemplate
            title={person.name}
            categoryLabel={categoryLabel}
            categoryIcon={categoryIconByKey(categoryKey)}
            imageSrc={portraitSrc}
            imageAlt={`${person.name} portrait`}
            traits={traits}
            relatedGroups={relatedGroups}
            onPrev={onPrev}
            onNext={onNext}
        />
    );
}
