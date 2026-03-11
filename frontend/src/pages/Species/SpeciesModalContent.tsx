import { useMemo } from "react";
import { FilmReelIcon } from "@phosphor-icons/react";
import { Alien as AlienIcon, Planet as PlanetIcon, Users as UsersIcon } from "phosphor-react";
import ContentTemplate from "@components/Modal/ContentTemplate";
import { type ContentTemplateRelatedGroup, type ContentTemplateTrait, type Species } from "@types";
import { formatDisplayValue } from "@utils/display";
import { collectRelatedResourceUrls, resolveResourceItems } from "@utils/resourceResolve";
import { useResolvedResourceNames } from "@utils/useResolvedResourceNames";

interface SpeciesModalContentProps {
    species: Species;
    selectedIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

export default function SpeciesModalContent({
    species,
    selectedIndex,
    total,
    onPrev,
    onNext,
}: SpeciesModalContentProps) {
    const homeworldUrls = species.homeworld ? [species.homeworld] : [];

    const relatedResourceUrls = useMemo(() => {
        return collectRelatedResourceUrls([
            homeworldUrls,
            species.people,
            species.films,
        ]);
    }, [homeworldUrls, species.films, species.people]);

    const resolvedResourceNames = useResolvedResourceNames(relatedResourceUrls);
    const homeworldItems = resolveResourceItems(homeworldUrls, resolvedResourceNames);
    const homeworldName = homeworldItems[0]?.name ?? "Unknown";

    const traits: ContentTemplateTrait[] = [
        { label: "Classification", value: formatDisplayValue(species.classification) },
        { label: "Designation", value: formatDisplayValue(species.designation) },
        { label: "Language", value: formatDisplayValue(species.language) },
        { label: "Homeworld", value: homeworldName },
        { label: "Avg Height", value: formatDisplayValue(species.average_height) },
        { label: "Avg Lifespan", value: formatDisplayValue(species.average_lifespan) },
        { label: "Skin Colors", value: formatDisplayValue(species.skin_colors) },
        { label: "Record", value: `${selectedIndex + 1} / ${total}` },
    ];

    const relatedGroups: ContentTemplateRelatedGroup[] = [
        {
            label: "Homeworld",
            count: homeworldItems.length,
            items: homeworldItems,
            icon: <PlanetIcon weight="duotone" aria-hidden="true" />,
        },
        {
            label: "People",
            count: species.people.length,
            items: resolveResourceItems(species.people, resolvedResourceNames),
            icon: <UsersIcon weight="duotone" aria-hidden="true" />,
        },
        {
            label: "Films",
            count: species.films.length,
            items: resolveResourceItems(species.films, resolvedResourceNames),
            icon: <FilmReelIcon weight="duotone" aria-hidden="true" />,
        },
    ];

    return (
        <ContentTemplate
            title={species.name}
            imageSrc={null}
            imageAlt={`${species.name} artwork`}
            imageFallback={<AlienIcon size={148} weight="duotone" color="var(--mantine-color-gray-4)" />}
            traits={traits}
            relatedGroups={relatedGroups}
            onPrev={onPrev}
            onNext={onNext}
        />
    );
}
