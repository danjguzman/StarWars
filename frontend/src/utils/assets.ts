import { ASSET_IMAGE_BASE_PATH } from "@utils/consts";

const IMAGE_EXTENSIONS = ["jpg", "png"] as const;

export function getEntityImageSources(entityKey: string, itemId: string | null | undefined) {
    if (!itemId) return [];

    const imageBasePath = `${ASSET_IMAGE_BASE_PATH}/${entityKey}/${itemId}`;
    return IMAGE_EXTENSIONS.map((extension) => `${imageBasePath}.${extension}`);
}
