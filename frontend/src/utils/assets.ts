import { ASSET_IMAGE_BASE_PATH } from "@utils/consts";

const IMAGE_EXTENSIONS = ["jpg", "png"] as const;
const ENTITY_KEYS_WITH_IMAGE_ASSETS = new Set(["films", "people"]);

export function getEntityImageSources(entityKey: string, itemId: string | null | undefined) {
    if (!itemId || !ENTITY_KEYS_WITH_IMAGE_ASSETS.has(entityKey)) return [];

    const imageBasePath = `${ASSET_IMAGE_BASE_PATH}/${entityKey}/${itemId}`;
    return IMAGE_EXTENSIONS.map((extension) => `${imageBasePath}.${extension}`);
}
