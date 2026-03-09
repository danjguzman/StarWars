import { useEffect, useMemo, useState } from "react";
import { Box, Flex, Group, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import RelatedItems from "@components/Modals/RelatedItems";
import {
    Alien as AlienIcon,
    CaretLeft,
    CaretRight,
    FlyingSaucer as FlyingSaucerIcon,
    Planet as PlanetIcon,
    TrainRegional as TrainRegionalIcon,
    UserCircle,
    Users as UsersIcon,
    X,
} from "phosphor-react";
import { FilmReelIcon } from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { getJson } from "@services/api";
import { type Person } from "@types";
import { ASSET_IMAGE_BASE_PATH } from "@utils/consts";
import { formatDisplayValue } from "@utils/display";
import {
    type NamedResource,
    getCachedResolvedResourceNames,
    resourceDisplayName,
    resolveResourceItems,
} from "@utils/resourceResolve";
import { resourceCategoryFromUrl, resourceIdFromUrl } from "@utils/swapi";
import styles from "./personModalContent.module.css";

interface PersonModalContentProps {
    person: Person;
    selectedIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
}

export default function PersonModalContent({
    person,
    selectedIndex,
    total,
    onPrev,
    onNext,
    onClose,
}: PersonModalContentProps) {
    const useCompactHeightLayout = useMediaQuery("(max-height: 939px) and (min-width: 721px)");
    const [fetchedResourceNames, setFetchedResourceNames] = useState<Record<string, string>>({});
    const personId = resourceIdFromUrl(person.url);
    const portraitSrc = personId ? `${ASSET_IMAGE_BASE_PATH}/people/${personId}.jpg` : null;
    const homeworldCount = person.homeworld ? 1 : 0;
    const speciesCount = person.species.length;
    const starshipsCount = person.starships.length;
    const vehiclesCount = person.vehicles.length;
    const filmsCount = person.films.length;
    const categoryLabel = resourceCategoryFromUrl(person.url, true);
    const categoryKey = resourceCategoryFromUrl(person.url);

    const relatedResourceUrls = useMemo(() => {
        return Array.from(new Set([
            ...(person.homeworld ? [person.homeworld] : []),
            ...person.species,
            ...person.starships,
            ...person.vehicles,
            ...person.films,
        ]));
    }, [person.films, person.homeworld, person.species, person.starships, person.vehicles]);

    const cachedResourceNames = useMemo(() => {
        return getCachedResolvedResourceNames(relatedResourceUrls);
    }, [relatedResourceUrls]);

    const resolvedResourceNames = useMemo(
        () => ({
            ...cachedResourceNames,
            ...fetchedResourceNames,
        }),
        [cachedResourceNames, fetchedResourceNames]
    );

    useEffect(() => {
        let isMounted = true;

        const unresolvedUrls = relatedResourceUrls.filter((url) => !cachedResourceNames[url]);
        if (unresolvedUrls.length === 0) return () => {
            isMounted = false;
        };

        Promise.all(
            unresolvedUrls.map(async (url) => {
                try {
                    const resource = await getJson<NamedResource>(url);
                    const displayName = resourceDisplayName(resource);

                    return displayName ? [url, displayName] as const : null;
                } catch {
                    return null;
                }
            })
        ).then((entries) => {
            if (!isMounted) return;

            const fetchedNames = entries.reduce<Record<string, string>>((accumulator, entry) => {
                if (!entry) return accumulator;

                const [url, displayName] = entry;
                accumulator[url] = displayName;
                return accumulator;
            }, {});

            if (Object.keys(fetchedNames).length === 0) return;

            setFetchedResourceNames((current) => ({
                ...current,
                ...fetchedNames,
            }));
        });

        return () => {
            isMounted = false;
        };
    }, [cachedResourceNames, relatedResourceUrls]);

    const homeworldResourceItems = useMemo(
        () => resolveResourceItems(person.homeworld ? [person.homeworld] : [], resolvedResourceNames),
        [person.homeworld, resolvedResourceNames]
    );
    const speciesResourceItems = useMemo(
        () => resolveResourceItems(person.species, resolvedResourceNames),
        [person.species, resolvedResourceNames]
    );
    const starshipResourceItems = useMemo(
        () => resolveResourceItems(person.starships, resolvedResourceNames),
        [person.starships, resolvedResourceNames]
    );
    const vehicleResourceItems = useMemo(
        () => resolveResourceItems(person.vehicles, resolvedResourceNames),
        [person.vehicles, resolvedResourceNames]
    );
    const filmResourceItems = useMemo(
        () => resolveResourceItems(person.films, resolvedResourceNames),
        [person.films, resolvedResourceNames]
    );

    const categoryIcon = (() => {
        const commonProps = {
            className: styles.floatingCategoryIcon,
            weight: "duotone" as const,
            "aria-hidden": true,
        };

        if (categoryKey === "films") return <FilmReelIcon {...commonProps} />;
        if (categoryKey === "species") return <AlienIcon {...commonProps} />;
        if (categoryKey === "starships") return <FlyingSaucerIcon {...commonProps} />;
        if (categoryKey === "vehicles") return <TrainRegionalIcon {...commonProps} />;
        if (categoryKey === "planets") return <PlanetIcon {...commonProps} />;

        return <UsersIcon {...commonProps} />;
    })();

    const floatingMobileClose = typeof document === "undefined"
        ? null
        : createPortal(
            <button
                type="button"
                className={styles.floatingCloseButton}
                onClick={onClose}
                aria-label="Close modal"
            >
                <X size={20} weight="bold" />
            </button>,
            document.body
        );

    const floatingCategoryHeader = typeof document === "undefined"
        ? null
        : createPortal(
            <Box className={styles.floatingCategoryHeader} aria-hidden="true">
                {categoryIcon}
                <Text component="span" className={styles.floatingCategoryLabel}>{categoryLabel}</Text>
            </Box>,
            document.body
        );

    return (
        <>
            {floatingCategoryHeader}
            {floatingMobileClose}

            <Box className={`${styles.layout}${useCompactHeightLayout ? ` ${styles.layoutCompact}` : ""}`}>
                {useCompactHeightLayout ? (
                    <>
                        <Group className={styles.compactNavRow} justify="space-between" gap="md" wrap="nowrap">
                            <button
                                type="button"
                                className={`${styles.sideOrb} ${styles.compactNavButton}`}
                                onClick={onPrev}
                                aria-label="Previous person"
                            >
                                <CaretLeft size={20} weight="bold" />
                                <span>Prev</span>
                            </button>

                            <button
                                type="button"
                                className={`${styles.sideOrb} ${styles.compactNavButton}`}
                                onClick={onNext}
                                aria-label="Next person"
                            >
                                <CaretRight size={20} weight="bold" />
                                <span>Next</span>
                            </button>
                        </Group>

                        <Box className={styles.nameCard}>
                            <Text className={styles.nameText}>{person.name}</Text>
                        </Box>

                        <Flex className={styles.compactDetailsRow} align="stretch" gap="md">
                            <Box className={styles.heroColumn}>
                                <Box className={`${styles.heroFrame} ${styles.heroFrameCompact}`}>
                                    {portraitSrc ? (
                                        <img src={portraitSrc} alt={`${person.name} portrait`} className={styles.heroImage} />
                                    ) : (
                                        <Box className={styles.heroFallback}>
                                            <UserCircle size={148} color="var(--mantine-color-gray-4)" />
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            <Box className={`${styles.traitsCard} ${styles.traitsCardCompact}`}>
                                <button
                                    type="button"
                                    className={`${styles.closeButton} ${styles.compactCloseButton}`}
                                    onClick={onClose}
                                    aria-label="Close modal"
                                >
                                    <X size={20} weight="bold" />
                                </button>

                                <dl className={styles.traitsGrid}>
                                    <div>
                                        <dt>Height</dt>
                                        <dd>{formatDisplayValue(person.height)}</dd>
                                    </div>
                                    <div>
                                        <dt>Mass</dt>
                                        <dd>{formatDisplayValue(person.mass)}</dd>
                                    </div>
                                    <div>
                                        <dt>Hair</dt>
                                        <dd>{formatDisplayValue(person.hair_color)}</dd>
                                    </div>
                                    <div>
                                        <dt>Eyes</dt>
                                        <dd>{formatDisplayValue(person.eye_color)}</dd>
                                    </div>
                                    <div>
                                        <dt>Skin</dt>
                                        <dd>{formatDisplayValue(person.skin_color)}</dd>
                                    </div>
                                    <div>
                                        <dt>Gender</dt>
                                        <dd>{formatDisplayValue(person.gender)}</dd>
                                    </div>
                                    <div>
                                        <dt>Birth Year</dt>
                                        <dd>{formatDisplayValue(person.birth_year)}</dd>
                                    </div>
                                    <div>
                                        <dt>Record</dt>
                                        <dd>{selectedIndex + 1} / {total}</dd>
                                    </div>
                                </dl>
                            </Box>
                        </Flex>
                    </>
                ) : (
                    <>
                        <Box className={styles.stageRow}>
                            <button type="button" className={styles.sideOrb} onClick={onPrev} aria-label="Previous person">
                                <CaretLeft size={20} weight="bold" />
                                <span>Prev</span>
                            </button>

                            <Box className={styles.heroColumn}>
                                <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close modal">
                                    <X size={20} weight="bold" />
                                </button>

                                <Box className={styles.heroFrame}>
                                    {portraitSrc ? (
                                        <img src={portraitSrc} alt={`${person.name} portrait`} className={styles.heroImage} />
                                    ) : (
                                        <Box className={styles.heroFallback}>
                                            <UserCircle size={148} color="var(--mantine-color-gray-4)" />
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            <button type="button" className={styles.sideOrb} onClick={onNext} aria-label="Next person">
                                <CaretRight size={20} weight="bold" />
                                <span>Next</span>
                            </button>
                        </Box>

                        <Box className={styles.nameCard}>
                            <Text className={styles.nameText}>{person.name}</Text>
                        </Box>

                        <Box className={styles.traitsCard}>
                            <dl className={styles.traitsGrid}>
                                <div>
                                    <dt>Height</dt>
                                    <dd>{formatDisplayValue(person.height)}</dd>
                                </div>
                                <div>
                                    <dt>Mass</dt>
                                    <dd>{formatDisplayValue(person.mass)}</dd>
                                </div>
                                <div>
                                    <dt>Hair</dt>
                                    <dd>{formatDisplayValue(person.hair_color)}</dd>
                                </div>
                                <div>
                                    <dt>Eyes</dt>
                                    <dd>{formatDisplayValue(person.eye_color)}</dd>
                                </div>
                                <div>
                                    <dt>Skin</dt>
                                    <dd>{formatDisplayValue(person.skin_color)}</dd>
                                </div>
                                <div>
                                    <dt>Gender</dt>
                                    <dd>{formatDisplayValue(person.gender)}</dd>
                                </div>
                                <div>
                                    <dt>Birth Year</dt>
                                    <dd>{formatDisplayValue(person.birth_year)}</dd>
                                </div>
                                <div>
                                    <dt>Record</dt>
                                    <dd>{selectedIndex + 1} / {total}</dd>
                                </div>
                            </dl>
                        </Box>
                    </>
                )}

                <Box className={styles.bottomOrbit}>
                    <RelatedItems
                        label="Homeworld"
                        count={homeworldCount}
                        items={homeworldResourceItems}
                        icon={<PlanetIcon weight="duotone" aria-hidden="true" />}
                    />
                    <RelatedItems
                        label="Species"
                        count={speciesCount}
                        items={speciesResourceItems}
                        icon={<AlienIcon weight="duotone" aria-hidden="true" />}
                    />
                    <RelatedItems
                        label="Starships"
                        count={starshipsCount}
                        items={starshipResourceItems}
                        icon={<FlyingSaucerIcon weight="duotone" aria-hidden="true" />}
                    />
                    <RelatedItems
                        label="Vehicles"
                        count={vehiclesCount}
                        items={vehicleResourceItems}
                        icon={<TrainRegionalIcon weight="duotone" aria-hidden="true" />}
                    />
                    <RelatedItems
                        label="Films"
                        count={filmsCount}
                        items={filmResourceItems}
                        icon={<FilmReelIcon weight="duotone" aria-hidden="true" />}
                    />
                </Box>
            </Box>
        </>
    );
}
