import { Box, Flex, Group, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
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
import { FilmReel as FilmReelIcon } from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { type Person } from "@types";
import { ASSET_IMAGE_BASE_PATH } from "@utils/consts";
import { resourceIdFromUrl } from "@utils/swapi";
import styles from "./personModalContent.module.css";

interface PersonModalContentProps {
    person: Person;
    selectedIndex: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
}

function formatValue(value: string) {
    if (!value || value === "n/a" || value === "unknown") return "Unknown";
    return value;
}

function categoryLabelFromUrl(url: string) {
    const match = url.match(/\/api\/([^/]+)\//);
    const resource = match?.[1]?.toLowerCase();

    if (resource === "people") return "People";
    if (resource === "species") return "Species";
    if (resource === "starships") return "Starships";
    if (resource === "vehicles") return "Vehicles";
    if (resource === "planets") return "Planets";
    if (resource === "films") return "Films";

    return "People";
}

function categoryKeyFromUrl(url: string) {
    const match = url.match(/\/api\/([^/]+)\//);
    const resource = match?.[1]?.toLowerCase();

    if (resource === "people") return "people";
    if (resource === "species") return "species";
    if (resource === "starships") return "starships";
    if (resource === "vehicles") return "vehicles";
    if (resource === "planets") return "planets";
    if (resource === "films") return "films";

    return "people";
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
    const personId = resourceIdFromUrl(person.url);
    const portraitSrc = personId ? `${ASSET_IMAGE_BASE_PATH}/people/${personId}.jpg` : null;
    const homeworldCount = person.homeworld ? 1 : 0;
    const speciesCount = person.species.length;
    const starshipsCount = person.starships.length;
    const vehiclesCount = person.vehicles.length;
    const filmsCount = person.films.length;
    const categoryLabel = categoryLabelFromUrl(person.url);
    const categoryKey = categoryKeyFromUrl(person.url);

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
                                        <dd>{formatValue(person.height)}</dd>
                                    </div>
                                    <div>
                                        <dt>Mass</dt>
                                        <dd>{formatValue(person.mass)}</dd>
                                    </div>
                                    <div>
                                        <dt>Hair</dt>
                                        <dd>{formatValue(person.hair_color)}</dd>
                                    </div>
                                    <div>
                                        <dt>Eyes</dt>
                                        <dd>{formatValue(person.eye_color)}</dd>
                                    </div>
                                    <div>
                                        <dt>Skin</dt>
                                        <dd>{formatValue(person.skin_color)}</dd>
                                    </div>
                                    <div>
                                        <dt>Gender</dt>
                                        <dd>{formatValue(person.gender)}</dd>
                                    </div>
                                    <div>
                                        <dt>Birth Year</dt>
                                        <dd>{formatValue(person.birth_year)}</dd>
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
                                    <dd>{formatValue(person.height)}</dd>
                                </div>
                                <div>
                                    <dt>Mass</dt>
                                    <dd>{formatValue(person.mass)}</dd>
                                </div>
                                <div>
                                    <dt>Hair</dt>
                                    <dd>{formatValue(person.hair_color)}</dd>
                                </div>
                                <div>
                                    <dt>Eyes</dt>
                                    <dd>{formatValue(person.eye_color)}</dd>
                                </div>
                                <div>
                                    <dt>Skin</dt>
                                    <dd>{formatValue(person.skin_color)}</dd>
                                </div>
                                <div>
                                    <dt>Gender</dt>
                                    <dd>{formatValue(person.gender)}</dd>
                                </div>
                                <div>
                                    <dt>Birth Year</dt>
                                    <dd>{formatValue(person.birth_year)}</dd>
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
                    <Box className={`${styles.orbitNode} ${homeworldCount === 0 ? styles.orbitNodeEmpty : ""}`}>
                        <span className={styles.orbitBubble}>
                            <PlanetIcon className={styles.orbitIcon} weight="duotone" aria-hidden="true" />
                            <span className={styles.orbitBadge}>{homeworldCount}</span>
                        </span>
                        <small>Homeworld</small>
                    </Box>
                    <Box className={`${styles.orbitNode} ${speciesCount === 0 ? styles.orbitNodeEmpty : ""}`}>
                        <span className={styles.orbitBubble}>
                            <AlienIcon className={styles.orbitIcon} weight="duotone" aria-hidden="true" />
                            <span className={styles.orbitBadge}>{speciesCount}</span>
                        </span>
                        <small>Species</small>
                    </Box>
                    <Box className={`${styles.orbitNode} ${starshipsCount === 0 ? styles.orbitNodeEmpty : ""}`}>
                        <span className={styles.orbitBubble}>
                            <FlyingSaucerIcon className={styles.orbitIcon} weight="duotone" aria-hidden="true" />
                            <span className={styles.orbitBadge}>{starshipsCount}</span>
                        </span>
                        <small>Starships</small>
                    </Box>
                    <Box className={`${styles.orbitNode} ${vehiclesCount === 0 ? styles.orbitNodeEmpty : ""}`}>
                        <span className={styles.orbitBubble}>
                            <TrainRegionalIcon className={styles.orbitIcon} weight="duotone" aria-hidden="true" />
                            <span className={styles.orbitBadge}>{vehiclesCount}</span>
                        </span>
                        <small>Vehicles</small>
                    </Box>
                    <Box className={`${styles.orbitNode} ${filmsCount === 0 ? styles.orbitNodeEmpty : ""}`}>
                        <span className={styles.orbitBubble}>
                            <FilmReelIcon className={styles.orbitIcon} weight="duotone" aria-hidden="true" />
                            <span className={styles.orbitBadge}>{filmsCount}</span>
                        </span>
                        <small>Films</small>
                    </Box>
                </Box>
            </Box>
        </>
    );
}
