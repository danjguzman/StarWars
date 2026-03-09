import { Box, Text } from "@mantine/core";
import { CaretLeft, CaretRight, UserCircle, X } from "phosphor-react";
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

export default function PersonModalContent({
    person,
    selectedIndex,
    total,
    onPrev,
    onNext,
    onClose,
}: PersonModalContentProps) {
    const personId = resourceIdFromUrl(person.url);
    const portraitSrc = personId ? `${ASSET_IMAGE_BASE_PATH}/people/${personId}.jpg` : null;

    return (
        <Box className={styles.layout}>
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

            <Box className={styles.bottomOrbit}>
                <Box className={styles.orbitNode}>
                    <span>{person.homeworld ? "1" : "0"}</span>
                    <small>Homeworld</small>
                </Box>
                <Box className={styles.orbitNode}>
                    <span>{person.species.length}</span>
                    <small>Species</small>
                </Box>
                <Box className={styles.orbitNode}>
                    <span>{person.starships.length}</span>
                    <small>Starships</small>
                </Box>
                <Box className={styles.orbitNode}>
                    <span>{person.vehicles.length}</span>
                    <small>Vehicles</small>
                </Box>
                <Box className={styles.orbitNode}>
                    <span>{person.films.length}</span>
                    <small>Films</small>
                </Box>
            </Box>
        </Box>
    );
}
