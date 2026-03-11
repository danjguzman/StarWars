export function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        const message = error.message.trim();
        return message.length > 0 ? message : null;
    }

    if (typeof error === "string") {
        const message = error.trim();
        return message.length > 0 ? message : null;
    }

    return null;
}

export function buildUserFacingError(prefix: string, error: unknown, fallbackDetail?: string) {
    const cleanPrefix = prefix.trim().replace(/[.\s]+$/, "");
    const detail = getErrorMessage(error) ?? fallbackDetail?.trim() ?? null;

    if (!detail) return `${cleanPrefix}.`;

    const cleanDetail = detail.replace(/[\s]+/g, " ").trim();
    const normalizedPrefix = cleanPrefix.toLowerCase();
    const normalizedDetail = cleanDetail.replace(/[.\s]+$/, "").toLowerCase();

    if (normalizedDetail.startsWith(normalizedPrefix)) {
        return cleanDetail.endsWith(".") ? cleanDetail : `${cleanDetail}.`;
    }

    return `${cleanPrefix}. ${cleanDetail.endsWith(".") ? cleanDetail : `${cleanDetail}.`}`;
}
