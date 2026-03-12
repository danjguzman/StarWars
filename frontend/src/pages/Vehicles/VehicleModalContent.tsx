import { useCallback, useMemo } from "react";
import { FilmReelIcon } from "@phosphor-icons/react";
import { TrainRegional as TrainRegionalIcon, Users as UsersIcon } from "phosphor-react";
import ContentTemplate from "@components/Modal/ContentTemplate";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import { type ContentTemplateRelatedGroup, type ContentTemplateTrait, type Vehicle } from "@types";
import { getEntityImageSources } from "@utils/assets";
import { formatDisplayValue } from "@utils/display";
import { collectRelatedResourceUrls, resolveResourceItems } from "@utils/resourceResolve";
import { useResolvedResourceNames } from "@utils/useResolvedResourceNames";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";

interface VehicleModalContentProps {
    vehicle: Vehicle;
    selectedIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}

export default function VehicleModalContent({
    vehicle,
    selectedIndex,
    total,
    onPrev,
    onNext,
}: VehicleModalContentProps) {
    const { openModalRoute } = useModalRouteNavigation("/vehicles");
    const vehicleId = resourceIdFromUrl(vehicle.url);
    const artworkSources = useMemo(() => getEntityImageSources("vehicles", vehicleId), [vehicleId]);

    const openRelatedItem = useCallback((item: { url: string }) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    const relatedResourceUrls = useMemo(() => {
        return collectRelatedResourceUrls([
            vehicle.pilots,
            vehicle.films,
        ]);
    }, [vehicle.films, vehicle.pilots]);

    const resolvedResourceNames = useResolvedResourceNames(relatedResourceUrls);

    const traits: ContentTemplateTrait[] = [
        { label: "Model", value: formatDisplayValue(vehicle.model) },
        { label: "Class", value: formatDisplayValue(vehicle.vehicle_class) },
        { label: "Manufacturer", value: formatDisplayValue(vehicle.manufacturer) },
        { label: "Crew", value: formatDisplayValue(vehicle.crew) },
        { label: "Passengers", value: formatDisplayValue(vehicle.passengers) },
        { label: "Max Speed", value: formatDisplayValue(vehicle.max_atmosphering_speed) },
        { label: "Cargo", value: formatDisplayValue(vehicle.cargo_capacity) },
        { label: "Record", value: `${selectedIndex + 1} / ${total}` },
    ];

    const relatedGroups: ContentTemplateRelatedGroup[] = [
        {
            label: "Pilots",
            count: vehicle.pilots.length,
            items: resolveResourceItems(vehicle.pilots, resolvedResourceNames),
            icon: <UsersIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
        {
            label: "Films",
            count: vehicle.films.length,
            items: resolveResourceItems(vehicle.films, resolvedResourceNames),
            icon: <FilmReelIcon weight="duotone" aria-hidden="true" />,
            onSelectItem: openRelatedItem,
        },
    ];

    return (
        <ContentTemplate
            title={vehicle.name}
            imageSources={artworkSources}
            imageAlt={`${vehicle.name} artwork`}
            imageFallback={<TrainRegionalIcon size={148} weight="duotone" color="var(--mantine-color-gray-4)" />}
            traits={traits}
            relatedGroups={relatedGroups}
            onPrev={onPrev}
            onNext={onNext}
        />
    );
}
