type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

function pageCacheKey(cacheName: string, page: number) {
    return `${cacheName}:page:${page}`;
}

export function getCachedValue<T>(key: string): T | null {
    const entry = cache.get(key);

    if (!entry) {
        return null;
    }

    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }

    return entry.value as T;
}

export function setCachedValue<T>(key: string, value: T, ttlMs = DEFAULT_CACHE_TTL_MS) {
    cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
    });
}

export async function getCachedPage<T>(
    cacheName: string,
    page: number,
    fetchPage: (page: number) => Promise<T>,
    ttlMs = DEFAULT_CACHE_TTL_MS
) {
    const key = pageCacheKey(cacheName, page);
    const cachedPage = getCachedValue<T>(key);

    if (cachedPage) {
        return cachedPage;
    }

    const pageData = await fetchPage(page);
    setCachedValue(key, pageData, ttlMs);

    return pageData;
}

export function invalidatePageCache(cacheName: string) {
    invalidateCacheByPrefix(`${cacheName}:page:`);
}

export function invalidateCacheByPrefix(prefix: string) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}
