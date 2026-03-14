import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Box, Flex, Group, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { CaretLeft, CaretRight, UserCircle } from "phosphor-react";
import RelatedItems from "@components/Modal/RelatedItems";
import { type ContentTemplateRelatedGroup, type ContentTemplateTrait } from "@types";
import styles from "./index.module.css";

interface ContentTemplateProps {
    title: string;
    imageSrc?: string | null;
    imageSources?: string[];
    imageAlt: string;
    traits: ContentTemplateTrait[];
    relatedGroups: ContentTemplateRelatedGroup[];
    onPrev: () => void;
    onNext: () => void;
    imageFallback?: ReactNode;
}

export default function ContentTemplate({
    title,
    imageSrc,
    imageSources,
    imageAlt,
    traits,
    relatedGroups,
    onPrev,
    onNext,
    imageFallback,
}: ContentTemplateProps) {
    const useCompactHeightLayout = useMediaQuery("(max-height: 939px) and (min-width: 721px)");
    const useUltraCompactLandscapeLayout = useMediaQuery("(max-height: 420px) and (orientation: landscape)");
    const fallbackMarkup = imageFallback ?? <UserCircle size={148} color="var(--mantine-color-gray-4)" />;
    const resolvedImageSources = useMemo(() => {
        if (imageSources && imageSources.length > 0) return imageSources;
        return imageSrc ? [imageSrc] : [];
    }, [imageSources, imageSrc]);
    const imageSourcesKey = resolvedImageSources.join("|");
    const [imageSourceIndex, setImageSourceIndex] = useState(0);
    const activeImageSrc = resolvedImageSources[imageSourceIndex] ?? null;

    useEffect(() => {
        setImageSourceIndex(0);
    }, [imageSourcesKey]);

    const handleImageError = () => {
        setImageSourceIndex((currentIndex) => {
            const nextImageSourceIndex = currentIndex + 1;
            if (nextImageSourceIndex < resolvedImageSources.length) return nextImageSourceIndex;
            return resolvedImageSources.length;
        });
    };

    /* Render the trait rows that appear in the details card. */
    const renderTraitsGrid = () => (
        <dl className={styles.traitsGrid}>
            {traits.map((trait, index) => (
                <div key={`${trait.label}-${index}`}>
                    <dt>{trait.label}</dt>
                    <dd>{trait.value}</dd>
                </div>
            ))}
        </dl>
    );

    const renderRelatedGroups = (className = styles.bottomOrbit) => (
        <Box className={className}>
            {relatedGroups.map((group, index) => (
                <RelatedItems
                    key={`${group.label}-${index}`}
                    label={group.label}
                    count={group.count}
                    items={group.items}
                    icon={group.icon}
                    onSelectItem={group.onSelectItem}
                />
            ))}
        </Box>
    );

    return (
        <Box className={`${styles.layout}${useCompactHeightLayout ? ` ${styles.layoutCompact}` : ""}`}>
            {useCompactHeightLayout ? (
                <>
                    {/* Show compact previous/next controls for shorter viewports. */}
                    <Group className={styles.compactNavRow} justify="space-between" gap="md" wrap="nowrap">

                            {/* Go to the previous item. */}
                            <button
                                type="button"
                                className={`${styles.sideOrb} ${styles.compactNavButton}`}
                                onClick={onPrev}
                                aria-label="Previous item"
                            >
                                <CaretLeft size={36} weight="fill" />
                            </button>

                            {/* Go to the next item. */}
                            <button
                                type="button"
                                className={`${styles.sideOrb} ${styles.compactNavButton}`}
                                onClick={onNext}
                                aria-label="Next item"
                            >
                                <CaretRight size={36} weight="fill" />
                            </button>
                    </Group>

                    {/* Show the item title below the compact nav controls. */}
                    {!useUltraCompactLandscapeLayout ? (
                        <Box className={styles.nameCard}>
                            <Text className={styles.nameText}>{title}</Text>
                        </Box>
                    ) : null}

                    {/* Place the image and traits side by side in compact mode. */}
                    <Flex className={styles.compactDetailsRow} align="stretch" gap="md">

                        {/* Show the main image or the fallback artwork. */}
                        <Box className={styles.heroColumn}>
                            <Box className={`${styles.heroFrame} ${styles.heroFrameCompact}`}>
                                {activeImageSrc ? (
                                    <img
                                        src={activeImageSrc}
                                        alt={imageAlt}
                                        className={styles.heroImage}
                                        loading="eager"
                                        decoding="sync"
                                        onError={handleImageError}
                                    />
                                ) : (
                                    <Box className={styles.heroFallback}>
                                        {fallbackMarkup}
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Show the traits card next to the image in compact mode. */}
                        <Box className={`${styles.traitsCard} ${styles.traitsCardCompact}${useUltraCompactLandscapeLayout ? ` ${styles.traitsCardUltraCompact}` : ""}`}>
                            {useUltraCompactLandscapeLayout ? (
                                <Text className={`${styles.nameText} ${styles.nameTextInline}`}>{title}</Text>
                            ) : null}
                            {renderTraitsGrid()}
                            {useUltraCompactLandscapeLayout ? renderRelatedGroups(styles.bottomOrbitInline) : null}
                        </Box>
                    </Flex>
                </>
            ) : (
                <>
                    {/* Show the standard desktop layout with nav, image, and details stacked below. */}
                    <Box className={styles.stageRow}>

                            {/* Go to the previous item. */}
                            <button type="button" className={styles.sideOrb} onClick={onPrev} aria-label="Previous item">
                                <CaretLeft size={36} weight="fill" />
                            </button>

                            {/* Show the main image or the fallback artwork. */}
                            <Box className={styles.heroColumn}>
                                <Box className={styles.heroFrame}>
                                    {activeImageSrc ? (
                                        <img
                                            src={activeImageSrc}
                                            alt={imageAlt}
                                            className={styles.heroImage}
                                            loading="eager"
                                            decoding="sync"
                                            onError={handleImageError}
                                        />
                                    ) : (
                                        <Box className={styles.heroFallback}>
                                            {fallbackMarkup}
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            {/* Go to the next item. */}
                            <button type="button" className={styles.sideOrb} onClick={onNext} aria-label="Next item">
                                <CaretRight size={36} weight="fill" />
                            </button>
                    </Box>

                    {/* Show the item title below the main stage area. */}
                    {!useUltraCompactLandscapeLayout ? (
                        <Box className={styles.nameCard}>
                            <Text className={styles.nameText}>{title}</Text>
                        </Box>
                    ) : null}

                    {/* Show the traits card under the title in the standard layout. */}
                    <Box className={`${styles.traitsCard}${useUltraCompactLandscapeLayout ? ` ${styles.traitsCardUltraCompact}` : ""}`}>
                        {useUltraCompactLandscapeLayout ? (
                            <Text className={`${styles.nameText} ${styles.nameTextInline}`}>{title}</Text>
                        ) : null}
                        {renderTraitsGrid()}
                        {useUltraCompactLandscapeLayout ? renderRelatedGroups(styles.bottomOrbitInline) : null}
                    </Box>
                </>
            )}

            {/* Show the related-resource buttons along the bottom of the modal. */}
            {!useUltraCompactLandscapeLayout ? renderRelatedGroups() : null}
        </Box>
    );
}
